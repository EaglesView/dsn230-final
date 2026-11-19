import { useSyncExternalStore } from "react";

/**
 * Tiny external store (no dependency). `use(selector)` must return a
 * primitive or an existing reference — never build a new object in it.
 */
export function createStore(initial) {
  let state = initial;
  const subs = new Set();
  const get = () => state;
  const set = (patch) => {
    const next = typeof patch === "function" ? patch(state) : { ...state, ...patch };
    if (next === state) return;
    state = next;
    subs.forEach((fn) => fn());
  };
  const subscribe = (fn) => {
    subs.add(fn);
    return () => subs.delete(fn);
  };
  const use = (selector = (s) => s) =>
    useSyncExternalStore(subscribe, () => selector(state));
  return { get, set, subscribe, use };
}
