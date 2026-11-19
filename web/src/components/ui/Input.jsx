import { useId } from "react";

export default function Input({ label, prefix = ">", className = "", hint, ...props }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-serif uppercase tracking-wider text-sm text-foreground/70">
          {label}
        </label>
      )}
      <div className="flex items-center border border-primary bg-primary/5 focus-within:border-secondary focus-within:bg-secondary/5 transition-colors">
        {prefix && <span className="pl-3 font-mono text-primary/80">{prefix}</span>}
        <input
          id={id}
          className="w-full bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 outline-none"
          {...props}
        />
      </div>
      {hint && <p className="font-serif text-xs text-foreground/50">{hint}</p>}
    </div>
  );
}
