import { useEffect, useRef, useState } from "react";
import EyeCanvas from "../components/EyeCanvas";
import { controlsStore } from "../lib/controls";
import { createBus, clientId } from "../lib/bus";
import { attachMouse, attachWebSocket, setGaze, setPressed } from "../lib/gaze";
import { mediaKind, setMediaShown, setMediaSource } from "../lib/media";

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
  const [mediaFile, setMediaFile] = useState(null); // { url, kind } from the dashboard

  // Bus: receive controls + pad gaze, announce ourselves.
  useEffect(() => {
    const role = embed ? "preview" : "display";
    const bus = createBus();
    busRef.current = bus;
    const off = bus.on((m) => {
      if (m.type === "controls") controlsStore.set(m.controls);
      if (m.type === "gaze" && controlsStore.get().input === "pad") setGaze(m.x, m.y);
      if (m.type === "press") setPressed(m.down);
      if (m.type === "media") setMediaShown(m.show);
      if (m.type === "mediaFile" && m.file) {
        setMediaFile((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url: URL.createObjectURL(m.file), kind: mediaKind(m.file.type) };
        });
      }
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

  // Hold F: show the media in the pupil (ignored while typing in a field).
  useEffect(() => {
    const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    const down = (e) => e.key.toLowerCase() === "f" && !e.repeat && !typing(e) && setMediaShown(true);
    const up = (e) => e.key.toLowerCase() === "f" && setMediaShown(false);
    const blur = () => setMediaShown(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // What the pupil shows.
  useEffect(() => {
    const { mediaSource, mediaUrl } = controls;
    if (mediaSource === "url" && mediaUrl) setMediaSource({ kind: mediaKind(mediaUrl), url: mediaUrl });
    else if (mediaSource === "file" && mediaFile) setMediaSource(mediaFile);
    else setMediaSource({ kind: "demo" });
  }, [controls.mediaSource, controls.mediaUrl, mediaFile]);

  // Input source. The camera takes over during its FSM state (see cameraState).
  const input = controls.cameraState && controls.fsm === controls.cameraState ? "camera" : controls.input;
  useEffect(() => {
    if (input === "mouse") return attachMouse();
    if (input === "esp32") return attachWebSocket(controls.wsUrl, setWsStatus);
    if (input === "camera") return attachWebSocket(controls.cameraUrl, setWsStatus);
  }, [input, controls.wsUrl, controls.cameraUrl]);

  const onTelemetry = (t) => {
    setTelemetry(t);
    busRef.current?.send({
      type: "telemetry",
      id: clientId,
      role: embed ? "preview" : "display",
      input,
      ws: wsStatus,
      ...t,
    });
  };

  return (
    <main className={`relative w-screen h-screen overflow-hidden bg-background ${input === "mouse" ? "cursor-crosshair" : ""}`}>
      <EyeCanvas controls={controls} onTelemetry={onTelemetry} className="absolute inset-0" />

      {controls.debug && telemetry && (
        <aside className="absolute top-4 left-4 border border-secondary/60 bg-background/80 px-4 py-3 font-mono text-xs text-secondary space-y-0.5 pointer-events-none">
          <p className="font-sans tracking-[0.25em] text-primary mb-1">OEIL // DEBUG</p>
          <p>ID       {clientId}</p>
          <p>RENDU    {telemetry.backend}</p>
          <p>FPS      {telemetry.fps}</p>
          <p>ÉTAT     {controls.fsm}</p>
          <p>ENTRÉE   {input}{input === "esp32" || input === "camera" ? ` (${wsStatus})` : ""}</p>
          <p>
            REGARD   {telemetry.gaze[0].toFixed(2)}, {telemetry.gaze[1].toFixed(2)}
          </p>
          <p>MODÈLE   {controls.model}</p>
          {telemetry.pupil != null && <p>PUPILLE  {telemetry.pupil.toFixed(2)}</p>}
          {telemetry.press != null && <p>PRESSION {telemetry.press.toFixed(2)}</p>}
          {telemetry.media != null && <p>MÉDIA    {telemetry.media.toFixed(2)} ({controls.mediaSource})</p>}
          {telemetry.wave != null && <p>SALUT    {telemetry.wave.toFixed(2)}</p>}
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
