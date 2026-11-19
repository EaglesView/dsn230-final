import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gaze } from "../lib/gaze";

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

const FORWARD = new THREE.Vector3(0, 0, 1); // the model's iris faces +Z
const IDLE_AFTER_MS = 4000;

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

  async load(url) {
    const gltf = await new GLTFLoader().loadAsync(url);
    this.model = gltf.scene;
    this.pivot.add(this.model);
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
