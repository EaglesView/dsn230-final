// Repris de magix-web3 (components/ui/button.jsx), sans les sons ni le glitch.
const VARIANTS = {
  neomilitarism: { bg: "bg-primary/40", hover: "group-hover:bg-primary group-focus-visible:bg-primary", text: "text-primary", textHover: "group-hover:text-background group-focus-visible:text-background" },
  neokitsch: { bg: "bg-legendary/40", hover: "group-hover:bg-legendary group-focus-visible:bg-legendary", text: "text-legendary", textHover: "group-hover:text-background group-focus-visible:text-background" },
  kitsch: { bg: "bg-accent/40", hover: "group-hover:bg-accent group-focus-visible:bg-accent", text: "text-secondary font-sans! text-[0.8em]!", textHover: "" },
  entropism: { bg: "bg-rare/40", hover: "group-hover:bg-rare group-focus-visible:bg-rare", text: "text-foreground font-mono! font-medium!", textHover: "" },
  tech: { bg: "bg-success/40", hover: "group-hover:bg-success group-focus-visible:bg-success", text: "text-success", textHover: "group-hover:text-background group-focus-visible:text-background" },
  neutral: { bg: "bg-secondary/40", hover: "group-hover:bg-secondary group-focus-visible:bg-secondary", text: "text-secondary", textHover: "group-hover:text-background group-focus-visible:text-background" },
};
const SIZES = { sm: "h-9 text-sm", md: "h-11 text-base", lg: "h-14 text-xl" };

export default function Button({
  children,
  variant = "neomilitarism",
  size = "md",
  active = false,
  disabled = false,
  className = "",
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.neomilitarism;
  const live = !disabled;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active || undefined}
      className={`group flex items-stretch ${SIZES[size]} outline-none ${
        live ? "cursor-pointer" : "cursor-not-allowed opacity-40"
      } ${className}`}
      {...props}
    >
      <span aria-hidden className={`w-3 shrink-0 cut-sm-bl ${v.bg}`} />
      <span
        className={`flex-1 flex items-center cut-xxs-br transition-colors duration-100 ${
          active ? v.bg.replace("/40", "") : v.bg
        } ${live ? v.hover : ""}`}
      >
        <span
          className={`w-full text-left px-4 transition-all duration-150 font-serif font-bold uppercase tracking-wide whitespace-nowrap ${
            active ? "text-background" : v.text
          } ${live ? `group-hover:px-7 ${v.textHover}` : ""}`}
        >
          {children}
        </span>
      </span>
    </button>
  );
}
