import { useId } from "react";
import { tone } from "./tones";

// Repris de magix-web3 (components/ui/slider.jsx), version contrôlée avec étiquette.
export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  color = "primary",
  format,
  disabled = false,
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const t = tone(color);
  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? "opacity-40" : ""}`}>
      <div className="flex items-baseline justify-between gap-4 font-serif uppercase tracking-wider text-sm">
        <label htmlFor={id} className="text-foreground/70">
          {label}
        </label>
        <output htmlFor={id} className={`${t.text} font-bold tabular-nums`}>
          {format ? format(value) : value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="cyber-range w-full h-4"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        style={{ "--fill-percent": `${pct}%`, "--range-color": t.var }}
      />
    </div>
  );
}
