import Panel from "../ui/Panel";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { STATES, sceneIndex } from "../../lib/fsm";

const STATE_TONE = {
  Boot: "common",
  Connecting: "rare",
  Idle: "secondary",
  Scene1: "accent",
  Scene2: "legendary",
  Scene3: "success",
  Error: "primary",
};

export default function FsmPanel({ fsm, fire, force }) {
  return (
    <Panel
      id="scenes"
      title="Scènes — machine à états"
      code="//03"
      actions={<Badge color={STATE_TONE[fsm]} pulse>/scene {sceneIndex(fsm)}</Badge>}
    >
      <ol className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 mb-5" aria-label="États">
        {STATES.map((s) => (
          <li
            key={s}
            aria-current={s === fsm ? "step" : undefined}
            className={`border px-2 py-2 text-center font-sans text-[10px] tracking-widest uppercase transition-colors ${
              s === fsm ? "border-secondary bg-secondary text-background" : "border-primary/40 text-primary/70"
            }`}
          >
            {s}
          </li>
        ))}
      </ol>

      <p className="font-serif text-sm uppercase tracking-wider text-foreground/60 mb-2">Événements Wiimote (passent par decide())</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Button onClick={() => fire("PrevScene")}>◀ Prev (B / −)</Button>
        <Button variant="neutral" onClick={() => fire("Home")}>Home</Button>
        <Button onClick={() => fire("NextScene")}>Next (A / +) ▶</Button>
      </div>

      <p className="font-serif text-sm uppercase tracking-wider text-foreground/60 mb-2">Signaux système</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Button size="sm" variant="tech" onClick={() => fire("BootDone")}>BootDone</Button>
        <Button size="sm" variant="tech" onClick={() => fire("Connected")}>Connected</Button>
        <Button size="sm" variant="neokitsch" onClick={() => fire("ConnectionLost")}>ConnectionLost</Button>
      </div>

      <p className="font-serif text-sm uppercase tracking-wider text-foreground/60 mb-2">Forcer un état (ignore la FSM)</p>
      <div className="flex flex-wrap gap-2">
        {STATES.map((s) => (
          <Button key={s} size="sm" variant="entropism" active={s === fsm} onClick={() => force(s)}>
            {s}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
