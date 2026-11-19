/**
 * Gaze input sources. Each one writes a target in normalized device
 * coordinates (x, y in -1..1, y up) into `gaze`, the eye reads it every frame.
 *
 *  - mouse : pointer over the display window (temporary)
 *  - pad   : XY pad on the admin dashboard (via the bus)
 *  - esp32 : WebSocket from the backend bridge. Browsers can't receive OSC/UDP,
 *            so the bridge forwards JSON: {"x":0.1,"y":-0.4} or {"gaze":[x,y]}
 */
export const gaze = { x: 0, y: 0, lastInput: 0 };

export function setGaze(x, y) {
  gaze.x = Math.max(-1, Math.min(1, x));
  gaze.y = Math.max(-1, Math.min(1, y));
  gaze.lastInput = performance.now();
}

export function attachMouse(target = window) {
  const onMove = (e) => {
    setGaze((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  target.addEventListener("pointermove", onMove);
  return () => target.removeEventListener("pointermove", onMove);
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
        const [x, y] = Array.isArray(d.gaze) ? d.gaze : [d.x, d.y];
        if (Number.isFinite(x) && Number.isFinite(y)) setGaze(x, y);
      } catch {
        /* ignore non-JSON frames */
      }
    };
    ws.onclose = () => {
      onStatus("closed");
      if (!stopped) timer = setTimeout(connect, 2000);
    };
  };
  connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    ws?.close();
  };
}
