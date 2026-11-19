import { tone } from "./tones";

const norm = (it) => (typeof it === "string" ? { value: it, label: it } : it);

export default function Segmented({ label, options, value, onChange, color = "primary", className = "" }) {
  const t = tone(color);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="font-serif uppercase tracking-wider text-sm text-foreground/70">{label}</span>}
      <div role="radiogroup" aria-label={label} className={`flex border ${t.border}`}>
        {options.map(norm).map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={o.disabled}
              onClick={() => onChange?.(o.value)}
              className={`flex-1 px-3 py-1.5 font-serif font-bold uppercase tracking-wide text-sm transition-colors outline-none
                focus-visible:outline-dashed focus-visible:outline-1 focus-visible:outline-secondary focus-visible:-outline-offset-4
                disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
                ${on ? `${t.bg} text-background` : `${t.text} hover:bg-white/5`}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
