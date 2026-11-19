import { tone } from "./tones";

export default function Stat({ label, value, sub, color = "primary" }) {
  const t = tone(color);
  return (
    <div className={`relative border-l-2 ${t.border} bg-white/[0.02] px-4 py-3 min-w-0`}>
      <p className="font-serif text-xs uppercase tracking-[0.2em] text-foreground/60 truncate">{label}</p>
      <p className={`font-sans text-2xl ${t.text} tabular-nums truncate`}>{value}</p>
      {sub && <p className="font-serif text-xs text-foreground/50 truncate">{sub}</p>}
    </div>
  );
}
