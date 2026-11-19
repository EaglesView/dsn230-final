import { useEffect, useState } from "react";
import { sceneIndex } from "../../lib/fsm";

/**
 * Fake ESP32 / Wii remote data so the device widgets can be tested before the
 * backend exists. Replace with real telemetry from the bridge.
 */
export function useSimulatedDevices(fsm) {
  const [s, setS] = useState({ t: 0, battery: 82, rssi: -58, accel: [0, 0, 1], buttons: 0, uptime: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setS((p) => {
        const t = p.t + 0.1;
        const live = sceneIndex(fsm) >= 1;
        return {
          t,
          uptime: p.uptime + 0.1,
          battery: Math.max(0, p.battery - 0.004),
          rssi: Math.round(Math.max(-90, Math.min(-40, p.rssi + (Math.random() - 0.5) * 3))),
          accel: live
            ? [Math.sin(t * 1.7) * 0.8, Math.cos(t * 1.3) * 0.6, 1 + Math.sin(t * 3.1) * 0.15]
            : [0, 0, 1],
          buttons: live && Math.random() < 0.08 ? 1 << Math.floor(Math.random() * 7) : 0,
        };
      });
    }, 100);
    return () => clearInterval(id);
  }, [fsm]);

  return s;
}
