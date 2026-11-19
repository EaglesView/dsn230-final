// Static class maps so Tailwind can see every class name.
export const TONE = {
  primary: { text: "text-primary", border: "border-primary", bg: "bg-primary", soft: "bg-primary/15", var: "var(--primary)" },
  secondary: { text: "text-secondary", border: "border-secondary", bg: "bg-secondary", soft: "bg-secondary/15", var: "var(--secondary)" },
  accent: { text: "text-accent", border: "border-accent", bg: "bg-accent", soft: "bg-accent/15", var: "var(--accent)" },
  legendary: { text: "text-legendary", border: "border-legendary", bg: "bg-legendary", soft: "bg-legendary/15", var: "var(--legendary)" },
  success: { text: "text-success", border: "border-success", bg: "bg-success", soft: "bg-success/15", var: "var(--success)" },
  rare: { text: "text-rare", border: "border-rare", bg: "bg-rare", soft: "bg-rare/15", var: "var(--rare)" },
  common: { text: "text-common", border: "border-common", bg: "bg-common", soft: "bg-common/15", var: "var(--common)" },
};
export const tone = (t) => TONE[t] ?? TONE.primary;
