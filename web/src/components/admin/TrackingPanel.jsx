import { useState } from "react";
import Panel from "../ui/Panel";
import Segmented from "../ui/Segmented";
import Slider from "../ui/Slider";
import Toggle from "../ui/Toggle";
import Input from "../ui/Input";
import XYPad from "../ui/XYPad";
import Button from "../ui/Button";

export default function TrackingPanel({ controls, update, sendGaze, sendPress }) {
  const [pad, setPad] = useState({ x: 0, y: 0 });
  const [held, setHeld] = useState(false);
  const hold = (down) => {
    if (down === held) return;
    setHeld(down);
    sendPress(down);
  };
  return (
    <Panel id="oeil" title="Suivi de l'oeil" code="//04">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-5">
          <Segmented
            label="Source du regard"
            value={controls.input}
            onChange={(v) => update({ input: v }, `Source → ${v}`)}
            options={[
              { value: "mouse", label: "Souris" },
              { value: "pad", label: "Pavé XY" },
              { value: "esp32", label: "ESP32" },
            ]}
          />
          {controls.input === "esp32" && (
            <Input
              label="Pont WebSocket"
              value={controls.wsUrl}
              onChange={(e) => update({ wsUrl: e.target.value })}
              hint='Le pont reçoit l’OSC de l’ESP32 et renvoie {"x":…, "y":…} en JSON.'
            />
          )}
          <Slider label="Vitesse de suivi" value={controls.followSpeed} min={1} max={30} step={0.5} unit=" /s" onChange={(v) => update({ followSpeed: v })} />
          <Slider label="Angle max" value={controls.maxAngle} min={5} max={80} unit="°" color="secondary" onChange={(v) => update({ maxAngle: v })} />
          <Slider
            label="Profondeur du point focal"
            value={controls.focusDepth}
            min={0.5}
            max={5}
            step={0.1}
            color="accent"
            format={(v) => v.toFixed(1)}
            onChange={(v) => update({ focusDepth: v })}
          />
          <Toggle
            label="Errance au repos (saccades après 4 s sans entrée)"
            checked={controls.idleWander}
            onChange={(v) => update({ idleWander: v }, `Errance ${v ? "ON" : "OFF"}`)}
          />
          <Toggle
            label="Pupille automatique (animation Blender de l'état)"
            checked={controls.pupilAuto}
            onChange={(v) => update({ pupilAuto: v }, `Pupille auto ${v ? "ON" : "OFF"}`)}
          />
          <Slider
            label="Pupille (− dilatée · + contractée)"
            value={controls.pupil}
            min={-1}
            max={1}
            step={0.05}
            color="legendary"
            format={(v) => (v > 0 ? "+" : "") + v.toFixed(2)}
            disabled={controls.pupilAuto}
            onChange={(v) => update({ pupil: v })}
          />
        </div>
        <div>
          <p className="font-serif uppercase tracking-wider text-sm text-foreground/70 mb-1.5">Visée manuelle</p>
          <div className="max-w-72">
          <XYPad
            value={pad}
            disabled={controls.input !== "pad"}
            onChange={(v) => {
              setPad(v);
              sendGaze(v.x, v.y);
            }}
          />
          </div>
          {controls.input !== "pad" && (
            <p className="mt-1 font-serif text-xs text-legendary">Choisis « Pavé XY » comme source pour l’utiliser.</p>
          )}
          <Button
            variant="kitsch"
            className="mt-4 w-full max-w-72 touch-none select-none"
            active={held}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              hold(true);
            }}
            onPointerUp={() => hold(false)}
            onPointerCancel={() => hold(false)}
            onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && hold(true)}
            onKeyUp={(e) => (e.key === " " || e.key === "Enter") && hold(false)}
            onBlur={() => hold(false)}
          >
            Maintenir: pupille ouverte
          </Button>
          <p className="mt-1 font-serif text-xs text-foreground/50">Ou clic maintenu sur l’affichage (source Souris).</p>
        </div>
      </div>
    </Panel>
  );
}
