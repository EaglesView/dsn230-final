import { createStore } from "./store";

/** Everything the dashboard can change on the eye display. */
export const DEFAULT_CONTROLS = {
  fsm: "Idle",
  input: "mouse", // mouse | pad | esp32 | camera
  wsUrl: "ws://localhost:8787",
  cameraUrl: "ws://localhost:8787", // tools/camera/server.py
  cameraState: "", // FSM state that switches the input to the camera ("" = never)
  waveDilate: 0.5, // how much the pupil opens while the followed person waves (0 = off)
  backend: "webgl", // webgl | webgpu
  model: "realistic", // realistic | classic  (see three/models.js)
  pupilAuto: true, // pupil follows the FSM state + noise
  pupil: 0, // manual pupil: > 0 constricted, < 0 dilated
  mediaSource: "demo", // demo | url | file  — what F shows in the pupil
  mediaUrl: "",
  mediaSize: 0.2, // media disc radius, in eye radii (pupil at rest ~0.19)
  followSpeed: 8, // 1/s — higher = snappier
  maxAngle: 40, // degrees
  focusDepth: 2.5, // distance of the virtual plane the eye looks at
  idleWander: true,
  exposure: 1,
  envIntensity: 1,
  toneMapping: "agx", // none | aces | agx | neutral
  background: "void", // void | black | transparent
  debug: false,
};

const KEY = "oeil.controls";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_CONTROLS, ...JSON.parse(raw) } : DEFAULT_CONTROLS;
  } catch {
    return DEFAULT_CONTROLS;
  }
}

export const controlsStore = createStore(load());

export function persistControls() {
  return controlsStore.subscribe(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(controlsStore.get()));
    } catch {
      /* private mode / storage blocked — fine */
    }
  });
}
