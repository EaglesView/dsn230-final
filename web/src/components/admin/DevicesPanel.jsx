import Panel from "../ui/Panel";
import Badge from "../ui/Badge";
import { ProgressBar, AxisMeter } from "../ui/ProgressBar";
import { useSimulatedDevices } from "./useSimulatedDevices";

const BUTTONS = ["A", "B", "+", "−", "HOME", "1", "2"];

function nodeStatus(fsm) {
  if (fsm === "Error") return { label: "Hors ligne", color: "primary" };
  if (fsm === "Boot" || fsm === "Connecting") return { label: "Connexion", color: "rare" };
  return { label: "En ligne", color: "success" };
}

export default function DevicesPanel({ fsm }) {
  const s = useSimulatedDevices(fsm);
  const st = nodeStatus(fsm);
  const uptime = new Date(s.uptime * 1000).toISOString().slice(11, 19);
  return (
    <Panel id="appareils" title="Appareils" code="//06" actions={<Badge color="legendary">Simulé</Badge>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="border border-primary/40 p-4 flex flex-col gap-3">
          <header className="flex items-center justify-between gap-2">
            <h3 className="font-sans text-sm tracking-widest text-secondary">ESP32 // CONTRÔLEUR</h3>
            <Badge color={st.color} pulse={st.color !== "success"}>{st.label}</Badge>
          </header>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
            <dt className="text-foreground/50">OSC →</dt>
            <dd className="text-foreground/85">192.168.1.100:7000</dd>
            <dt className="text-foreground/50">RSSI</dt>
            <dd className="text-foreground/85 tabular-nums">{s.rssi} dBm</dd>
            <dt className="text-foreground/50">Uptime</dt>
            <dd className="text-foreground/85 tabular-nums">{uptime}</dd>
            <dt className="text-foreground/50">Flux</dt>
            <dd className="text-foreground/85">{fsm.startsWith("Scene") ? "~30 Hz" : "en pause"}</dd>
          </dl>
          <ProgressBar label="Signal" value={s.rssi + 90} max={50} color="secondary" format={() => `${s.rssi} dBm`} />
        </article>

        <article className="border border-primary/40 p-4 flex flex-col gap-3">
          <header className="flex items-center justify-between gap-2">
            <h3 className="font-sans text-sm tracking-widest text-secondary">WIIMOTE</h3>
            <Badge color={st.color}>{st.color === "success" ? "Appairée" : "—"}</Badge>
          </header>
          <ProgressBar label="Batterie" value={s.battery} color={s.battery < 20 ? "primary" : "success"} />
          <div className="flex flex-col gap-1.5">
            <AxisMeter label="X" value={s.accel[0]} min={-2} max={2} color="primary" />
            <AxisMeter label="Y" value={s.accel[1]} min={-2} max={2} color="secondary" />
            <AxisMeter label="Z" value={s.accel[2]} min={-2} max={2} color="accent" />
          </div>
          <div className="flex flex-wrap gap-1" aria-label="Boutons">
            {BUTTONS.map((b, i) => (
              <span
                key={b}
                className={`px-2 py-0.5 border font-sans text-[10px] tracking-widest ${
                  s.buttons & (1 << i) ? "bg-legendary border-legendary text-background" : "border-primary/30 text-primary/50"
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        </article>

        <article className="md:col-span-2 border border-dashed border-primary/30 p-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-sans text-sm tracking-widest text-foreground/50">ESP32 // CAPTEURS #2</h3>
            <p className="font-serif text-sm text-foreground/40">Emplacement réservé pour un deuxième microcontrôleur.</p>
          </div>
          <Badge color="common">Non configuré</Badge>
        </article>
      </div>
    </Panel>
  );
}
