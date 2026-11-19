import { WebGPURenderer, PMREMGenerator } from "three/webgpu";

/**
 * Both backends go through WebGPURenderer so materials written in TSL
 * (three's node shader language) work everywhere:
 *
 *  - "webgl"  : WebGPURenderer with forceWebGL — WebGL 2 backend.
 *  - "webgpu" : real WebGPU; three falls back to WebGL 2 by itself when the
 *               browser has no WebGPU.
 *
 * Standard glTF materials (MeshStandard / MeshPhysical) are converted to node
 * materials automatically, so full PBR works on both.
 */
export async function createRenderer(backend, canvas) {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    alpha: true,
    forceWebGL: backend !== "webgpu",
  });
  await renderer.init();
  const isGPU = !!renderer.backend?.isWebGPUBackend;
  const actual = isGPU ? "webgpu" : backend === "webgpu" ? "webgpu (repli webgl2)" : "webgl2";
  return { renderer, actual, PMREMGenerator };
}

export function webgpuAvailable() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}
