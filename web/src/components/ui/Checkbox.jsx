import { useId } from "react";

// Repris de magix-web3 (components/ui/checkbox.jsx), version contrôlée.
export default function Checkbox({ checked, onChange, label, disabled = false }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-3 select-none ${disabled ? "opacity-40" : "cursor-crosshair"}`}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span
        className="w-7 h-7 shrink-0 grid place-items-center border border-primary bg-primary/20 cut-sm-br transition-all duration-100
          peer-checked:bg-primary peer-checked:scale-90 peer-focus-visible:outline peer-focus-visible:outline-dashed peer-focus-visible:outline-secondary peer-focus-visible:outline-offset-2"
      >
        {checked && <span className="font-sans font-black text-background text-lg leading-none">✓</span>}
      </span>
      {label && <span className="font-serif text-base text-foreground/85">{label}</span>}
    </label>
  );
}
