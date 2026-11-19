// Repris de magix-web3 (components/ui/horizontal-selector.jsx), version contrôlée.
const norm = (it) => (typeof it === "string" ? { value: it, label: it } : it);

export default function Selector({ label, items, value, onChange, className = "" }) {
  const list = items.map(norm);
  const i = Math.max(0, list.findIndex((it) => it.value === value));
  const go = (d) => onChange?.(list[(i + d + list.length) % list.length].value);
  const arrow =
    "w-8 h-8 grid place-items-center text-primary hover:text-secondary hover:bg-primary/15 cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-1 focus-visible:outline-secondary";
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {label && <span className="font-serif uppercase tracking-wider text-sm text-foreground/70">{label}</span>}
      <div className="flex items-center gap-1 font-serif text-lg text-primary">
        <button type="button" className={arrow} onClick={() => go(-1)} aria-label="Précédent">
          ‹
        </button>
        <div className="min-w-36 text-center font-bold uppercase tracking-wide" aria-live="polite">
          {list[i]?.label}
        </div>
        <button type="button" className={arrow} onClick={() => go(1)} aria-label="Suivant">
          ›
        </button>
      </div>
    </div>
  );
}
