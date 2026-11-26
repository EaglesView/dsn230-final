/**
 * Gaze input sources. Each one writes a target in normalized device
 * coordinates (x, y in -1..1, y up) into `gaze`, the eye reads it every frame.
 *
 *  - mouse : pointer over the display window (temporary)
 *  - pad   : XY pad on the admin dashboard (via the bus)
 *  - camera: WebSocket from tools/camera/server.py (OpenCV), same JSON as below;
 *            it sends the center when nobody is in front of the camera
 *  - esp32 : WebSocket from the backend bridge. Browsers can't receive OSC/UDP,
 *            so the bridge forwards JSON: {"x":0.1,"y":-0.4} or {"gaze":[x,y]},
 *            {"press": true|false} for the press (e.g. a Wii remote button),
 *            {"media": true|false} to show the image/video in the pupil
 */
import { setMediaShown } from "./media";

export const gaze = { x: 0, y: 0, lastInput: 0, pressed: false, waving: false };

/** "Press" = fully dilate the pupil while held (mouse button, bridge, dashboard). */
export function setPressed(down) {
  gaze.pressed = !!down;
  gaze.lastInput = performance.now();
}

export function setGaze(x, y) {
  gaze.x = Math.max(-1, Math.min(1, x));
  gaze.y = Math.max(-1, Math.min(1, y));
  gaze.lastInput = performance.now();
}

export function attachMouse(target = window) {
  const onMove = (e) => {
    setGaze((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  const onDown = (e) => e.button === 0 && setPressed(true);
  const onUp = () => setPressed(false);
  target.addEventListener("pointermove", onMove);
  target.addEventListener("pointerdown", onDown);
  target.addEventListener("pointerup", onUp);
  target.addEventListener("pointercancel", onUp);
  window.addEventListener("blur", onUp);
  return () => {
    target.removeEventListener("pointermove", onMove);
    target.removeEventListener("pointerdown", onDown);
    target.removeEventListener("pointerup", onUp);
    target.removeEventListener("pointercancel", onUp);
    window.removeEventListener("blur", onUp);
    setPressed(false);
  };
}

/** Reconnecting WebSocket client. `onStatus` gets "connecting" | "open" | "closed". */
export function attachWebSocket(url, onStatus = () => {}) {
  let ws;
  let timer;
  let stopped = false;
  const connect = () => {
    onStatus("connecting");
    try {
      ws = new WebSocket(url);
    } catch {
      onStatus("closed");
      timer = setTimeout(connect, 2000);
      return;
    }
    ws.onopen = () => onStatus("open");
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (typeof d.press === "boolean") setPressed(d.press);
        if (typeof d.media === "boolean") setMediaShown(d.media);
        if (typeof d.wave === "boolean") gaze.waving = d.wave; // camera: followed person waves
        const [x, y] = Array.isArray(d.gaze) ? d.gaze : [d.x, d.y];
        if (Number.isFinite(x) && Number.isFinite(y)) setGaze(x, y);
      } catch {
        /* ignore non-JSON frames */
      }
    };
    ws.onclose = () => {
      onStatus("closed");
      gaze.waving = false;
      if (!stopped) timer = setTimeout(connect, 2000);
    };
  };
  connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    ws?.close();
    gaze.waving = false;
  };
}
