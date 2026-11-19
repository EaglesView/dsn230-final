import { useId, useState } from "react";

export default function Tabs({ tabs, initial = 0 }) {
  const [i, setI] = useState(initial);
  const base = useId();
  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-primary/50 overflow-x-auto">
        {tabs.map((t, k) => (
          <button
            key={t.label}
            id={`${base}-t${k}`}
            role="tab"
            type="button"
            aria-selected={i === k}
            aria-controls={`${base}-p${k}`}
            onClick={() => setI(k)}
            className={`shrink-0 cut-tab pl-4 pr-6 py-1.5 font-serif font-bold uppercase tracking-wide text-sm cursor-pointer outline-none focus-visible:underline ${
              i === k ? "bg-primary text-background" : "bg-primary/10 text-primary hover:bg-primary/25"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id={`${base}-p${i}`} role="tabpanel" aria-labelledby={`${base}-t${i}`} className="pt-4">
        {tabs[i]?.content}
      </div>
    </div>
  );
}
