export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`inline-flex items-center gap-3 select-none ${disabled ? "opacity-40" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative w-16 h-7 shrink-0 border transition-colors outline-none focus-visible:outline-dashed focus-visible:outline-1 focus-visible:outline-secondary focus-visible:outline-offset-2 ${
          checked ? "border-success bg-success/15" : "border-primary/70 bg-primary/10"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 font-sans text-[9px] tracking-widest ${
            checked ? "left-2 text-success" : "right-2 text-primary/80"
          }`}
        >
          {checked ? "ON" : "OFF"}
        </span>
        <span
          className={`absolute top-0.5 bottom-0.5 w-6 transition-all duration-150 cut-sm-br ${
            checked ? "left-[calc(100%-1.65rem)] bg-success" : "left-0.5 bg-primary/70"
          }`}
        />
      </button>
      {label && <span className="font-serif text-base text-foreground/85">{label}</span>}
    </label>
  );
}
