import { useRef } from "react";

/** 2D pad, value in -1..1 on both axes (y up). Arrow keys nudge, double-click recenters. */
export default function XYPad({ value, onChange, disabled = false, label = "Pavé XY" }) {
  const ref = useRef(null);
  const fromEvent = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    onChange?.({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  };
  const onKey = (e) => {
    const d = e.shiftKey ? 0.2 : 0.05;
    const k = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key];
    if (!k) return;
    e.preventDefault();
    onChange?.({ x: Math.max(-1, Math.min(1, value.x + k[0])), y: Math.max(-1, Math.min(1, value.y + k[1])) });
  };
  const left = ((value.x + 1) / 2) * 100;
  const top = ((1 - value.y) / 2) * 100;
  return (
    <div className={disabled ? "opacity-40 pointer-events-none" : ""}>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={`x ${value.x.toFixed(2)}, y ${value.y.toFixed(2)}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fromEvent(e);
        }}
        onPointerMove={(e) => e.buttons & 1 && fromEvent(e)}
        onDoubleClick={() => onChange?.({ x: 0, y: 0 })}
        onKeyDown={onKey}
        className="relative aspect-square w-full border border-secondary/60 bg-grid cursor-crosshair touch-none outline-none focus-visible:outline-dashed focus-visible:outline-1 focus-visible:outline-secondary focus-visible:outline-offset-2"
      >
        <div className="absolute inset-y-0 left-1/2 w-px bg-secondary/20" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-secondary/20" />
        <div className="absolute inset-y-0 w-px bg-secondary/60" style={{ left: `${left}%` }} />
        <div className="absolute inset-x-0 h-px bg-secondary/60" style={{ top: `${top}%` }} />
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 border-2 border-secondary bg-background"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-xs text-foreground/60 tabular-nums">
        X {value.x.toFixed(2)} · Y {value.y.toFixed(2)}
      </p>
    </div>
  );
}
