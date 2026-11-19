import { tone } from "./tones";

// Inspiré de la barre de vie de magix-web3 (components/game/player-health.jsx).
export function ProgressBar({ value, max = 100, label, color = "primary", showValue = true, format }) {
  const t = tone(color);
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex flex-col gap-1">
      {(label || showValue) && (
        <div className="flex justify-between font-serif text-sm uppercase tracking-wider">
          <span className="text-foreground/70">{label}</span>
          {showValue && <span className={`${t.text} font-bold tabular-nums`}>{format ? format(value) : `${Math.round(pct)}%`}</span>}
        </div>
      )}
      <div
        className={`relative h-4 ${t.soft} cut-health`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div className={`absolute inset-y-0 left-0 ${t.bg} cut-health transition-[width] duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Signed bar centered on zero — for accelerometer axes etc. */
export function AxisMeter({ label, value, min = -1, max = 1, color = "secondary" }) {
  const t = tone(color);
  const span = max - min;
  const zero = ((0 - min) / span) * 100;
  const pos = ((Math.max(min, Math.min(max, value)) - min) / span) * 100;
  const left = Math.min(zero, pos);
  const width = Math.abs(pos - zero);
  return (
    <div className="flex items-center gap-3">
      <span className={`w-5 font-sans text-xs ${t.text}`}>{label}</span>
      <div className="relative flex-1 h-3 bg-white/5">
        <div className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: `${zero}%` }} />
        <div className={`absolute inset-y-0 ${t.bg}`} style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
      <span className="w-14 text-right font-mono text-xs tabular-nums text-foreground/70">{value.toFixed(2)}</span>
    </div>
  );
}
