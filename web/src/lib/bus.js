/**
 * Control bus between the admin dashboard and the eye display(s).
 *
 * Today: BroadcastChannel — works between tabs/windows of the same browser,
 * which is enough to test the dashboard locally.
 *
 * Later: add a WebSocket transport (same `send`/`on` shape) pointing at the
 * backend that also talks to the ESP32s, so the dashboard can run on a
 * different machine than the projector.
 *
 * Messages:
 *   { type: "controls", controls }                  admin   -> displays
 *   { type: "gaze", x, y }                          admin   -> displays (XY pad, NDC -1..1)
 *   { type: "hello", id, role }                     display -> admin (asks for controls)
 *   { type: "telemetry", id, role, fps, backend, gaze, input, ready }
 *   { type: "bye", id }                             display -> admin
 */
const CHANNEL = "oeil-control";

export function createBus() {
  const listeners = new Set();
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL) : null;
  if (channel) channel.onmessage = (e) => listeners.forEach((fn) => fn(e.data));

  return {
    send(msg) {
      channel?.postMessage(msg);
    },
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    close() {
      listeners.clear();
      channel?.close();
    },
  };
}

export const clientId = Math.random().toString(36).slice(2, 8).toUpperCase();
