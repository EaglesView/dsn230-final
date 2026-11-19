import { useEffect, useRef, useState } from "react";
import { createBus } from "../../lib/bus";
import { controlsStore, persistControls } from "../../lib/controls";
import { log } from "../../lib/log";

const STALE_MS = 3000;
const HISTORY = 120;

/** Owns the control state on the admin side and tracks connected displays. */
export function useAdminBus() {
  const busRef = useRef(null);
  const [displays, setDisplays] = useState({});
  const [history, setHistory] = useState({ x: [], y: [] });
  const primaryRef = useRef(null);
  const knownRef = useRef(new Set()); // ids already announced in the log

  useEffect(() => {
    const bus = createBus();
    busRef.current = bus;
    const unpersist = persistControls();
    const unsub = controlsStore.subscribe(() => bus.send({ type: "controls", controls: controlsStore.get() }));

    const off = bus.on((m) => {
      if (m.type === "hello") {
        bus.send({ type: "controls", controls: controlsStore.get() });
        if (!knownRef.current.has(m.id)) {
          knownRef.current.add(m.id);
          log(`Affichage connecté: ${m.id} (${m.role})`, "ok");
        }
        setDisplays((d) => ({ ...d, [m.id]: { ...d[m.id], id: m.id, role: m.role, seen: Date.now() } }));
      }
      if (m.type === "telemetry") {
        setDisplays((d) => ({ ...d, [m.id]: { ...m, seen: Date.now() } }));
        // Chart the real display if there is one, else the preview.
        if (!primaryRef.current || m.role === "display" || primaryRef.current === m.id) {
          primaryRef.current = m.role === "display" ? m.id : primaryRef.current ?? m.id;
          if (primaryRef.current === m.id) {
            setHistory((h) => ({
              x: [...h.x.slice(-HISTORY + 1), m.gaze[0]],
              y: [...h.y.slice(-HISTORY + 1), m.gaze[1]],
            }));
          }
        }
      }
      if (m.type === "bye") {
        if (knownRef.current.delete(m.id)) log(`Affichage déconnecté: ${m.id}`, "warn");
        setDisplays((d) => {
          const { [m.id]: _gone, ...rest } = d;
          return rest;
        });
        if (primaryRef.current === m.id) primaryRef.current = null;
      }
    });

    bus.send({ type: "ping" });
    bus.send({ type: "controls", controls: controlsStore.get() });

    const prune = setInterval(() => {
      setDisplays((d) => {
        const now = Date.now();
        const alive = Object.fromEntries(Object.entries(d).filter(([, v]) => now - v.seen < STALE_MS));
        if (Object.keys(alive).length === Object.keys(d).length) return d;
        for (const id of Object.keys(d)) if (!alive[id]) knownRef.current.delete(id);
        if (!alive[primaryRef.current]) primaryRef.current = null;
        return alive;
      });
    }, 1000);

    return () => {
      unpersist();
      unsub();
      off();
      clearInterval(prune);
      bus.close();
      busRef.current = null;
    };
  }, []);

  const sendGaze = (x, y) => busRef.current?.send({ type: "gaze", x, y });
  return { displays: Object.values(displays), history, sendGaze };
}
