import { useEffect, useState } from "react";
import Panel from "../ui/Panel";
import Input from "../ui/Input";
import Selector from "../ui/Selector";
import Toggle from "../ui/Toggle";
import Badge from "../ui/Badge";
import Slider from "../ui/Slider";
import Stat from "../ui/Stat";
import { STATES } from "../../lib/fsm";

const httpOf = (wsUrl) => wsUrl.replace(/^ws(s?):/, "http$1:").replace(/\/$/, "");

/** Polls the camera server's /status.json. */
function useCameraStatus(url, enabled) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (!enabled) return setStatus(null);
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`${httpOf(url)}/status.json`, { cache: "no-store" });
        if (alive) setStatus(await r.json());
      } catch {
        if (alive) setStatus({ offline: true });
      }
    };
    tick();
    const id = setInterval(tick, 700);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [url, enabled]);
  return status;
}

export default function CameraPanel({ controls, update }) {
  const [preview, setPreview] = useState(true);
  const status = useCameraStatus(controls.cameraUrl, true);
  const online = status && !status.offline;
  const live = controls.input === "camera" || (controls.cameraState && controls.fsm === controls.cameraState);

  return (
    <Panel
      id="camera"
      title="Caméra — suivi des gens"
      code="//10"
      actions={
        <>
          {live && <Badge color="accent" pulse>Active</Badge>}
          <Badge color={online ? "success" : "primary"} pulse={!online}>{online ? "Serveur OK" : "Hors ligne"}</Badge>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          <Input
            label="Serveur caméra (WebSocket)"
            value={controls.cameraUrl}
            onChange={(e) => update({ cameraUrl: e.target.value })}
            hint="tools/camera/server.py — voir tools/camera/README.md"
          />
          <Selector
            label="Suivre pendant l'état"
            value={controls.cameraState}
            onChange={(v) => update({ cameraState: v }, v ? `Caméra pendant ${v}` : "Caméra: aucun état")}
            items={[{ value: "", label: "Jamais" }, ...STATES.map((s) => ({ value: s, label: s }))]}
          />
          <p className="font-serif text-xs text-foreground/50">
            Dans cet état, l'oeil suit la personne la plus proche; s'il n'y a personne, il revient au centre.
            Ou choisis « Caméra » comme source du regard pour l'utiliser tout le temps.
          </p>
          <Slider
            label="Dilatation quand la personne suivie salue (0 = off)"
            value={controls.waveDilate}
            min={0}
            max={1}
            step={0.05}
            color="success"
            format={(v) => v.toFixed(2)}
            onChange={(v) => update({ waveDilate: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Personnes" value={online ? status.count : "—"} sub={online ? (status.present ? "suivie" : "personne") : ""} color="success" />
            <Stat
              label="Salut"
              value={online ? (status.wave ? "OUI" : "non") : "—"}
              sub={online && status.wave === undefined ? "redémarrer le serveur" : "personne suivie"}
              color={online && status.wave ? "success" : "common"}
            />
            <Stat label="FPS" value={online ? status.fps : "—"} sub={online ? status.detector : ""} color="secondary" />
            <Stat label="Regard X" value={online ? status.x.toFixed(2) : "—"} color="primary" />
            <Stat label="Regard Y" value={online ? status.y.toFixed(2) : "—"} color="legendary" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Toggle label="Aperçu en direct" checked={preview} onChange={setPreview} />
          <div className="relative aspect-[4/3] border border-secondary/50 bg-black grid place-items-center">
            {online && preview ? (
              <img src={`${httpOf(controls.cameraUrl)}/stream.mjpg`} alt="Aperçu de la caméra" className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <p className="font-mono text-xs text-foreground/40 p-4 text-center">
                {online ? "aperçu désactivé" : "tools/camera/.venv/bin/python tools/camera/server.py"}
              </p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
