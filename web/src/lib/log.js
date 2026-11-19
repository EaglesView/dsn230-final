import { createStore } from "./store";

export const logStore = createStore([]);
let seq = 0;

export function log(msg, level = "info") {
  const time = new Date().toTimeString().slice(0, 8);
  logStore.set((l) => [...l.slice(-199), { id: ++seq, time, level, msg }]);
}
