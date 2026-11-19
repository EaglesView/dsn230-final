/** series: [{ data: number[], color: "var(--secondary)", label }] */
export default function Sparkline({ series, min = -1, max = 1, height = 80, label }) {
  const len = Math.max(2, ...series.map((s) => s.data.length));
  const toPts = (data) =>
    data
      .map((v, i) => `${(i / (len - 1)) * 100},${100 - ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100}`)
      .join(" ");
  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full bg-white/[0.02] border border-primary/20"
        style={{ height }}
        role="img"
        aria-label={label}
      >
        <line x1="0" x2="100" y1="50" y2="50" stroke="currentColor" className="text-foreground/15" vectorEffect="non-scaling-stroke" />
        {series.map((s) => (
          <polyline
            key={s.label}
            points={toPts(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <figcaption className="flex gap-4 font-serif text-xs uppercase tracking-wider text-foreground/60">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
