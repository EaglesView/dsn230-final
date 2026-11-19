import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gaze } from "../lib/gaze";
import { MODELS } from "./models";
import { PupilMedia } from "./PupilMedia";
import { media } from "../lib/media";

const TONE_MAPPING = {
  none: THREE.NoToneMapping,
  aces: THREE.ACESFilmicToneMapping,
  agx: THREE.AgXToneMapping,
  neutral: THREE.NeutralToneMapping,
};
const BACKGROUND = { void: 0x0e0e17, black: 0x000000 };

// Rim-light color per FSM state, so scene changes are visible on the eye.
const STATE_COLOR = {
  Boot: 0x333344,
  Connecting: 0x2570d4,
  Idle: 0x5ef6ff,
  Scene1: 0x9d2bf5,
  Scene2: 0xfb932e,
  Scene3: 0x1ded83,
  Error: 0xf75049,
};

// Pupil target per FSM state (> 0 constricted, < 0 dilated), used when
// "pupille auto" is on but the model has no clip for that state.
const STATE_PUPIL = {
  Boot: -0.4,
  Connecting: -0.4,
  Idle: 0.45,
  Scene1: 0.2,
  Scene2: -0.35,
  Scene3: 0.75,
  Error: 0.95,
};

const FORWARD = new THREE.Vector3(0, 0, 1); // the model's iris faces +Z
const IDLE_AFTER_MS = 4000;

/** Smooth 1D value noise in -1..1. */
function noise1(x) {
  const hash = (n) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const i = Math.floor(x);
  const t = x - i;
  const k = t * t * (3 - 2 * t);
  return hash(i) * (1 - k) + hash(i + 1) * k;
}

export class EyeScene {
  constructor({ renderer, PMREMGenerator }) {
    this.renderer = renderer;
    this.PMREMGenerator = PMREMGenerator;
    this.controls = {};

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.position.set(0, 0, 6);

    // The eye rotates inside this pivot; the model's center is at the origin.
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.key = new THREE.DirectionalLight(0xffffff, 1.2);
    this.key.position.set(2, 3, 5);
    this.rim = new THREE.PointLight(STATE_COLOR.Idle, 25, 0, 2);
    this.rim.position.set(-2.5, 1.8, 0.5);
    this.scene.add(this.key, this.rim);

    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.ndc = new THREE.Vector2();
    this.target = new THREE.Vector3(0, 0, 3);
    this.goal = new THREE.Quaternion();
    this.dir = new THREE.Vector3();
    this.identity = new THREE.Quaternion();
    this.rimGoal = new THREE.Color(STATE_COLOR.Idle);

    this.wander = { x: 0, y: 0, next: 0 };
    this.output = { x: 0, y: 0 }; // where the eye is actually looking (NDC)
    this.time = 0;
    this.pupil = 0;
    this.press = 0; // 0..1, eased toward gaze.pressed
    this.mediaK = 0; // 0..1, eased toward media.shown
    this.pupilMedia = new PupilMedia();
    this.mediaVersion = -1;
    this.handles = {};
    this.mixer = null;
    this.clips = {};
    this.playing = null;

    this.#buildDebug();
  }

  init() {
    const pmrem = new this.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    // The renderer is already initialized (createRenderer awaits init()).
    this.envMap = pmrem.fromScene(room, 0.04).texture;
    this.scene.environment = this.envMap;
    pmrem.dispose();
  }

  async load(modelId) {
    const def = MODELS[modelId] ?? MODELS.realistic;
    const gltf = await new GLTFLoader().loadAsync(def.url);
    this.handles = def.setup(gltf.scene) ?? {};
    this.model = gltf.scene;
    this.pivot.add(this.model);

    // Clips named after an FSM state ("Idle", "Scene1", "Error", ...) play
    // when that state is active — name the Blender actions that way.
    this.mixer = new THREE.AnimationMixer(gltf.scene);
    this.clips = Object.fromEntries(gltf.animations.map((c) => [c.name, c]));
    this.#playStateClip(this.controls.fsm);
  }

  #playStateClip(state) {
    if (!this.mixer) return;
    // Auto mode: the Blender clip for this state drives the pupil.
    const clip = this.controls.pupilAuto ? this.clips[state] : null;
    const next = clip ? this.mixer.clipAction(clip) : null;
    if (next === this.playing) return;
    this.playing?.fadeOut(0.4);
    next?.reset().fadeIn(0.4).play();
    this.playing = next;
  }

  setControls(c) {
    this.controls = c;
    const r = this.renderer;
    r.toneMapping = TONE_MAPPING[c.toneMapping] ?? THREE.AgXToneMapping;
    r.toneMappingExposure = c.exposure;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.environmentIntensity = c.envIntensity;
    if (c.background === "transparent") r.setClearColor(0x000000, 0);
    else r.setClearColor(BACKGROUND[c.background] ?? BACKGROUND.void, 1);
    this.rimGoal.set(STATE_COLOR[c.fsm] ?? STATE_COLOR.Idle);
    this.debug.visible = !!c.debug;
    this.#playStateClip(c.fsm);
    this.axes.visible = !!c.debug;
  }

  resize(width, height) {
    if (!width || !height) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    // Keep the whole eye in frame on portrait screens.
    this.camera.position.z = aspect < 1 ? 6 / aspect : 6;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
  }

  frame(dt) {
    this.time += dt;
    const c = this.controls;
    const now = performance.now();

    // 1. Pick the gaze target in NDC.
    let x = gaze.x;
    let y = gaze.y;
    if (c.fsm === "Boot" || c.fsm === "Connecting") {
      x = 0;
      y = -0.6; // drowsy: looks down until the system is up
    } else if (c.idleWander && now - gaze.lastInput > IDLE_AFTER_MS) {
      // Saccades: hop to a new random point every 0.8–2.6 s.
      if (now > this.wander.next) {
        this.wander.x = (Math.random() * 2 - 1) * 0.7;
        this.wander.y = (Math.random() * 2 - 1) * 0.5;
        this.wander.next = now + 800 + Math.random() * 1800;
      }
      x = this.wander.x;
      y = this.wander.y;
    }
    if (c.fsm === "Error") {
      x += (Math.random() - 0.5) * 0.08;
      y += (Math.random() - 0.5) * 0.08;
    }

    // 2. Project the NDC point onto a plane in front of the eye so the eye
    //    looks at where the cursor really is, not just "in that direction".
    this.ndc.set(x, y);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    this.plane.constant = -(c.focusDepth ?? 2.5);
    this.raycaster.ray.intersectPlane(this.plane, this.target);

    // 3. Aim, clamped to the max angle, with frame-rate independent easing.
    this.dir.copy(this.target).sub(this.pivot.position).normalize();
    this.goal.setFromUnitVectors(FORWARD, this.dir);
    const angle = FORWARD.angleTo(this.dir);
    const max = THREE.MathUtils.degToRad(c.maxAngle ?? 40);
    if (angle > max) this.goal.copy(this.identity).slerp(this.goal, max / angle);
    this.pivot.quaternion.slerp(this.goal, 1 - Math.exp(-(c.followSpeed ?? 8) * dt));
    this.output.x = x;
    this.output.y = y;

    // 4. Lighting follows the FSM state.
    this.rim.color.lerp(this.rimGoal, 1 - Math.exp(-4 * dt));
    this.rim.intensity = c.fsm === "Error" ? 25 + Math.sin(this.time * 12) * 15 : 25;

    // 5. Pupil: the state's clip if there is one, else a per-state target
    //    + slow noise ("breathing"), or the manual value from the dashboard.
    this.mixer?.update(dt);
    if (this.handles.setPupil) {
      if (c.pupilAuto && this.playing) {
        this.pupil = this.handles.getPupil();
      } else {
        const goal = c.pupilAuto
          ? (STATE_PUPIL[c.fsm] ?? 0.45) + noise1(this.time * 1.5) * 0.3
          : c.pupil ?? 0;
        this.pupil += (goal - this.pupil) * (1 - Math.exp(-6 * dt));
        this.handles.setPupil(this.pupil);
      }
    }

    // 6. Press: open fully, fast in / slower out, on top of the clip. On
    //    release the state's clip (still running underneath) takes over again.
    const pressGoal = gaze.pressed ? 1 : 0;
    const rate = pressGoal > this.press ? 14 : 4;
    this.press += (pressGoal - this.press) * (1 - Math.exp(-rate * dt));
    if (this.press < 1e-3 && !gaze.pressed) this.press = 0;

    // 7. Media (hold F): a disc of its own, shown over the pupil. Independent
    //    of the pupil size and of the press.
    if (media.version !== this.mediaVersion) {
      this.mediaVersion = media.version;
      this.pupilMedia.set(media.source);
    }
    const mediaGoal = media.shown ? 1 : 0;
    this.mediaK += (mediaGoal - this.mediaK) * (1 - Math.exp(-(mediaGoal > this.mediaK ? 10 : 6) * dt));
    if (this.mediaK < 1e-3 && !media.shown) this.mediaK = 0;
    this.pupilMedia.update(dt, this.mediaK > 0);
    this.handles.setMedia?.(this.pupilMedia.texture, this.pupilMedia.aspect, this.mediaK, c.mediaSize ?? 0.2);
    this.handles.applyPress?.(this.press);
    if (this.debug.visible) this.#updateDebug();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    });
    this.envMap?.dispose();
    this.pupilMedia.dispose();
    this.renderer.dispose();
  }

  #buildDebug() {
    this.debug = new THREE.Group();
    this.debug.visible = false;
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x5ef6ff })
    );
    this.lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xf75049 }));
    this.axes = new THREE.AxesHelper(1.6);
    this.axes.visible = false;
    this.pivot.add(this.axes);
    this.debug.add(this.marker, this.line);
    this.scene.add(this.debug);
  }

  #updateDebug() {
    this.marker.position.copy(this.target);
    const p = this.lineGeo.attributes.position;
    p.setXYZ(1, this.target.x, this.target.y, this.target.z);
    p.needsUpdate = true;
  }
}
