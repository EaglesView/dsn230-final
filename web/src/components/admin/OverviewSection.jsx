import Panel from "../ui/Panel";
import Stat from "../ui/Stat";
import Sparkline from "../ui/Sparkline";
import Badge from "../ui/Badge";

export default function OverviewSection({ controls, displays, history }) {
  const main = displays.find((d) => d.role === "display") ?? displays[0];
  return (
    <div id="apercu" className="scroll-mt-24 grid grid-cols-1 xl:grid-cols-5 gap-4">
      <div className="xl:col-span-5 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Affichages" value={displays.filter((d) => d.role === "display").length} sub={`${displays.length} au total`} color="success" />
        <Stat label="FPS" value={main?.fps ?? "—"} sub={main ? main.id : "aucun affichage"} color="secondary" />
        <Stat label="Rendu" value={(main?.backend ?? controls.backend).split(" ")[0].toUpperCase()} sub={main?.backend ?? "demandé"} color="accent" />
        <Stat label="État FSM" value={controls.fsm} color={controls.fsm === "Error" ? "primary" : "legendary"} />
        <Stat label="Entrée" value={controls.input.toUpperCase()} sub={controls.input === "esp32" ? controls.wsUrl : "temporaire"} color="rare" />
      </div>

      <Panel title="Aperçu en direct" code="//01" className="xl:col-span-3" bodyClassName="p-0">
        <div className="relative aspect-video bg-black">
          <iframe src="/?embed" title="Aperçu de l'oeil" className="absolute inset-0 w-full h-full border-0" />
          <div className="scanlines absolute inset-0" />
        </div>
      </Panel>

      <Panel title="Télémétrie du regard" code="//02" className="xl:col-span-2">
        <Sparkline
          label="Historique du regard X et Y"
          height={140}
          series={[
            { label: "X", data: history.x, color: "var(--secondary)" },
            { label: "Y", data: history.y, color: "var(--primary)" },
          ]}
        />
        <ul className="mt-4 flex flex-col gap-2">
          {displays.length === 0 && (
            <li className="font-serif text-foreground/50">Aucun affichage. Ouvre « / » dans un autre onglet.</li>
          )}
          {displays.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 border border-primary/25 px-3 py-1.5">
              <span className="font-mono text-xs text-foreground/80">{d.id}</span>
              <Badge color={d.role === "display" ? "success" : "common"}>{d.role}</Badge>
              <span className="font-mono text-xs text-foreground/50 tabular-nums">{d.fps ?? "–"} fps</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
