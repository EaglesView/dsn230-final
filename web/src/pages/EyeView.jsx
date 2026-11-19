import { useEffect, useRef, useState } from "react";
import EyeCanvas from "../components/EyeCanvas";
import { controlsStore } from "../lib/controls";
import { createBus, clientId } from "../lib/bus";
import { attachMouse, attachWebSocket, setGaze } from "../lib/gaze";

/**
 * The display: full-screen eye. Meant for the projector / screen.
 * Takes orders from the admin dashboard over the bus.
 */
export default function EyeView() {
  const controls = controlsStore.use();
  const embed = new URLSearchParams(location.search).has("embed");
  const [telemetry, setTelemetry] = useState(null);
  const [wsStatus, setWsStatus] = useState("—");
  const busRef = useRef(null);

  // Bus: receive controls + pad gaze, announce ourselves.
  useEffect(() => {
    const role = embed ? "preview" : "display";
    const bus = createBus();
    busRef.current = bus;
    const off = bus.on((m) => {
      if (m.type === "controls") controlsStore.set(m.controls);
      if (m.type === "gaze" && controlsStore.get().input === "pad") setGaze(m.x, m.y);
      if (m.type === "ping") bus.send({ type: "hello", id: clientId, role });
    });
    bus.send({ type: "hello", id: clientId, role });
    const bye = () => bus.send({ type: "bye", id: clientId });
    window.addEventListener("pagehide", bye);
    return () => {
      bye();
      off();
      window.removeEventListener("pagehide", bye);
      bus.close();
      busRef.current = null;
    };
  }, [embed]);

  // Input source.
  useEffect(() => {
    if (controls.input === "mouse") return attachMouse();
    if (controls.input === "esp32") return attachWebSocket(controls.wsUrl, setWsStatus);
  }, [controls.input, controls.wsUrl]);

  const onTelemetry = (t) => {
    setTelemetry(t);
    busRef.current?.send({
      type: "telemetry",
      id: clientId,
      role: embed ? "preview" : "display",
      input: controlsStore.get().input,
      ws: wsStatus,
      ...t,
    });
  };

  return (
    <main className={`relative w-screen h-screen overflow-hidden bg-background ${controls.input === "mouse" ? "cursor-crosshair" : ""}`}>
      <EyeCanvas controls={controls} onTelemetry={onTelemetry} className="absolute inset-0" />

      {controls.debug && telemetry && (
        <aside className="absolute top-4 left-4 border border-secondary/60 bg-background/80 px-4 py-3 font-mono text-xs text-secondary space-y-0.5 pointer-events-none">
          <p className="font-sans tracking-[0.25em] text-primary mb-1">OEIL // DEBUG</p>
          <p>ID       {clientId}</p>
          <p>RENDU    {telemetry.backend}</p>
          <p>FPS      {telemetry.fps}</p>
          <p>ÉTAT     {controls.fsm}</p>
          <p>ENTRÉE   {controls.input}{controls.input === "esp32" ? ` (${wsStatus})` : ""}</p>
          <p>
            REGARD   {telemetry.gaze[0].toFixed(2)}, {telemetry.gaze[1].toFixed(2)}
          </p>
        </aside>
      )}

      {!embed && (
        <a
          href="/admin"
          className="absolute bottom-3 right-4 font-sans text-[10px] tracking-[0.3em] text-foreground/20 hover:text-primary transition-colors"
        >
          ADMIN
        </a>
      )}
    </main>
  );
}
