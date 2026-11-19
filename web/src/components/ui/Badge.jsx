import { tone } from "./tones";

export default function Badge({ children, color = "secondary", pulse = false, className = "" }) {
  const t = tone(color);
  return (
    <span
      className={`inline-flex items-center gap-2 border ${t.border} ${t.text} px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.18em] whitespace-nowrap ${className}`}
    >
      <span aria-hidden className={`w-1.5 h-1.5 bg-current ${pulse ? "animate-blink" : ""}`} />
      {children}
    </span>
  );
}
