
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { texture, uv, vec2, float, uniform, smoothstep } from "three/tsl";

const BASE = import.meta.env.BASE_URL;

/**
 * Eye models. `setup(root)` adapts the loaded glTF to the app's conventions
 * (eye centered at the origin, radius ~1, iris facing +Z) and returns the
 * handles the scene can drive, e.g. `{ setPupil, getPupil }`.
 */
export const MODELS = {
  realistic: {
    label: "Réaliste (Blender)",
    url: `${BASE}models/realistic-eye/RealisticEye.glb`,
    setup: setupRealistic,
  },
  classic: {
    label: "Classique (Sketchfab)",
    url: `${BASE}models/eye/scene.gltf`,
    setup: () => ({}),
  },
};

/**
 * Realistic eye, rigged by tools/blender/rig_pupil.py from
 * dump/Blender assets/RealisticEye.blend.
 *
 * Already in the app's conventions (pupil on +Z, centered, radius ~1).
 * Two meshes: "Eye" (sclera + flat recessed iris, PBR maps) and "Cornea"
 * (clear dome: transmission, IOR 1.376, thickness -> real refraction). The
 * pupil is morph targets — PupilDilate / PupilConstrict (+ PupilFull for the
 * press) — that slide the
 * iris vertices over the photo texture, and the file has one animation clip
 * per FSM state (EyeScene plays them by name).
 */
function setupRealistic(root) {
  // The eye mesh has two primitives (sclera, iris) -> two three.js meshes,
  // each with the same morph targets. Drive them all.
  const meshes = [];
  root.traverse((o) => {
    if (o.isMesh && o.morphTargetDictionary?.PupilDilate !== undefined) meshes.push(o);
  });
  if (!meshes.length) return {};
  // Keep the iris sharp when the eye turns away (grazing angles).
  root.traverse((o) => {
    for (const v of Object.values(o.material ?? {})) if (v?.isTexture) v.anisotropy = 8;
  });
  const slots = meshes.map((m) => ({
    w: m.morphTargetInfluences,
    dil: m.morphTargetDictionary.PupilDilate,
    con: m.morphTargetDictionary.PupilConstrict,
    full: m.morphTargetDictionary.PupilFull,
  }));
  slots.forEach((s) => s.w.fill(0));
  const first = slots[0];

  const screen = createMediaDisc(root);

  return {
    /**
     * Show `tex` (aspect = width / height) on the media disc. k = 0..1 opens
     * the disc like a shutter; size = disc radius in eye radii. Independent
     * of the pupil.
     */
    setMedia(tex, aspect, k, size) {
      if (screen.tex.value !== tex) screen.tex.value = tex;
      screen.aspect.value = aspect;
      screen.show.value = k;
      screen.mesh.visible = k > 0;
      screen.mesh.scale.setScalar(size);
    },
    /** pupil > 0 constricted, < 0 dilated, in -1..1 */
    setPupil(p) {
      for (const { w, dil, con } of slots) {
        w[dil] = Math.min(Math.max(-p, 0), 1);
        w[con] = Math.min(Math.max(p, 0), 1);
      }
    },
    getPupil: () => first.w[first.con] - first.w[first.dil],
    /**
     * Blend "fully open" over whatever the clip / app set this frame.
     * k = 0 leaves it untouched, k = 1 is fully open. Call after setPupil
     * and after the mixer, every frame.
     */
    applyPress(k) {
      for (const { w, dil, con, full } of slots) {
        if (full === undefined) {
          w[dil] += (1 - w[dil]) * k;
          w[con] *= 1 - k;
          continue;
        }
        w[dil] *= 1 - k;
        w[con] *= 1 - k;
        w[full] = k;
      }
    },
  };
}

/**
 * A disc for the image/video, sitting just above the iris (under the cornea)
 * and turning with the eye. It is its own mesh, so its size never follows the
 * pupil.
 *
 * It stays an *opaque* material (alphaTest cut-out, no blending): three.js only
 * refracts opaque objects through a transmissive surface, so this keeps the
 * media visible through the cornea. It therefore fades in as a shutter (the
 * cut-out radius grows) rather than with transparency.
 */
function createMediaDisc(root) {
  // Height of the iris dome's apex, so the disc sits just in front of it.
  let apex = 0;
  root.traverse((o) => {
    if (o.isMesh && o.material?.name === "Iris") {
      o.geometry.computeBoundingBox();
      apex = Math.max(apex, o.geometry.boundingBox.max.z);
    }
  });

  const show = uniform(0);
  const aspect = uniform(1);
  // Cover-fit into the circle: crop the long side. CircleGeometry UVs are
  // 0..1 with v up, which matches media textures (flipY).
  const p = uv().sub(0.5);
  const fit = vec2(p.x.div(aspect.max(1)).add(0.5), p.y.mul(aspect.min(1)).add(0.5));
  const tex = texture(new THREE.Texture(), fit);
  const d = p.length().mul(2); // 0 at the center, 1 at the rim
  const radius = show; // shutter: the visible radius grows with show

  const mat = new MeshBasicNodeMaterial({ alphaTest: 0.5, toneMapped: false });
  mat.colorNode = tex.rgb;
  mat.opacityNode = float(1).sub(smoothstep(radius.sub(0.04), radius, d));

  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 96), mat);
  mesh.name = "PupilMedia";
  mesh.position.z = apex + 0.004;
  mesh.visible = false;
  root.add(mesh);
  return { mesh, tex, show, aspect };
}
