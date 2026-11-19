import Panel from "../ui/Panel";
import Segmented from "../ui/Segmented";
import Selector from "../ui/Selector";
import Slider from "../ui/Slider";
import Checkbox from "../ui/Checkbox";
import Badge from "../ui/Badge";
import { webgpuAvailable } from "../../three/createRenderer";

export default function RenderPanel({ controls, update }) {
  const gpu = webgpuAvailable();
  return (
    <Panel
      id="rendu"
      title="Rendu PBR"
      code="//05"
      actions={<Badge color={gpu ? "success" : "legendary"}>{gpu ? "WebGPU dispo" : "WebGPU absent"}</Badge>}
    >
      <div className="flex flex-col gap-5">
        <Segmented
          label="Moteur de rendu"
          color="accent"
          value={controls.backend}
          onChange={(v) => update({ backend: v }, `Moteur → ${v}`)}
          options={[
            { value: "webgl", label: "WebGL 2" },
            { value: "webgpu", label: gpu ? "WebGPU" : "WebGPU (repli)" },
          ]}
        />
        <Selector
          label="Tone mapping"
          value={controls.toneMapping}
          onChange={(v) => update({ toneMapping: v })}
          items={[
            { value: "agx", label: "AgX" },
            { value: "aces", label: "ACES" },
            { value: "neutral", label: "Neutral" },
            { value: "none", label: "Aucun" },
          ]}
        />
        <Selector
          label="Arrière-plan"
          value={controls.background}
          onChange={(v) => update({ background: v })}
          items={[
            { value: "void", label: "Vide" },
            { value: "black", label: "Noir" },
            { value: "transparent", label: "Transparent" },
          ]}
        />
        <Slider label="Exposition" value={controls.exposure} min={0.1} max={3} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => update({ exposure: v })} />
        <Slider
          label="Intensité de l'environnement (IBL)"
          value={controls.envIntensity}
          min={0}
          max={3}
          step={0.05}
          color="secondary"
          format={(v) => v.toFixed(2)}
          onChange={(v) => update({ envIntensity: v })}
        />
        <Checkbox label="Superposition debug (axes, cible, HUD)" checked={controls.debug} onChange={(v) => update({ debug: v }, `Debug ${v ? "ON" : "OFF"}`)} />
      </div>
    </Panel>
  );
}
