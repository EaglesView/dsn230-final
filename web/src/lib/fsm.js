/**
 * Mirror of firmware/esp32_controller/StateMachine.cpp :: decide().
 * Keep the two in sync — the dashboard uses this to simulate the ESP32
 * until the real one reports its state.
 */
export const STATES = ["Boot", "Connecting", "Idle", "Scene1", "Scene2", "Scene3", "Error"];
export const EVENTS = ["BootDone", "Connected", "ConnectionLost", "NextScene", "PrevScene", "Home"];

export function sceneIndex(state) {
  return { Idle: 0, Scene1: 1, Scene2: 2, Scene3: 3 }[state] ?? -1;
}

export function decide(current, event) {
  if (event === "ConnectionLost") return "Error";
  if (event === "Home" && sceneIndex(current) >= 0) return "Idle";
  switch (current) {
    case "Boot":
      if (event === "BootDone") return "Connecting";
      break;
    case "Connecting":
      if (event === "Connected") return "Idle";
      break;
    case "Idle":
      if (event === "NextScene") return "Scene1";
      break;
    case "Scene1":
      if (event === "NextScene") return "Scene2";
      if (event === "PrevScene") return "Idle";
      break;
    case "Scene2":
      if (event === "NextScene") return "Scene3";
      if (event === "PrevScene") return "Scene1";
      break;
    case "Scene3":
      if (event === "NextScene") return "Idle";
      if (event === "PrevScene") return "Scene2";
      break;
    case "Error":
      if (event === "Connected") return "Connecting";
      break;
  }
  return current;
}
