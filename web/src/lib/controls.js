import { createStore } from "./store";

/** Everything the dashboard can change on the eye display. */
export const DEFAULT_CONTROLS = {
  fsm: "Idle",
  input: "mouse", // mouse | pad | esp32
  wsUrl: "ws://localhost:8787",
  backend: "webgl", // webgl | webgpu
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
