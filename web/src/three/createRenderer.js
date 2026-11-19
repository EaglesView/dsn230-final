import * as THREE from "three";

/**
 * Builds the renderer for the requested backend.
 *
 *  - "webgl"  : classic WebGLRenderer (WebGL 2). Full PBR: MeshStandard /
 *               MeshPhysical, IBL, transmission, normal maps, tone mapping.
 *  - "webgpu" : WebGPURenderer from three/webgpu. Same PBR materials (converted
 *               to node materials automatically). If the browser has no
 *               WebGPU, it falls back to its own WebGL 2 backend.
 *
 * three/webgpu is imported lazily so the WebGL build stays small.
 */
export async function createRenderer(backend, canvas) {
  if (backend === "webgpu") {
    const WEBGPU = await import("three/webgpu");
    const renderer = new WEBGPU.WebGPURenderer({ canvas, antialias: true, alpha: true });
    await renderer.init();
    return {
      renderer,
      actual: renderer.backend?.isWebGPUBackend ? "webgpu" : "webgpu (repli webgl2)",
      PMREMGenerator: WEBGPU.PMREMGenerator,
    };
  }
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  return { renderer, actual: "webgl2", PMREMGenerator: THREE.PMREMGenerator };
}

export function webgpuAvailable() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}
