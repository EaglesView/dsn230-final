import Button from "../ui/Button";

export const SECTIONS = [
  { id: "apercu", label: "Aperçu" },
  { id: "scenes", label: "Scènes / FSM" },
  { id: "oeil", label: "Suivi de l'oeil" },
  { id: "rendu", label: "Rendu" },
  { id: "media", label: "Média pupille" },
  { id: "appareils", label: "Appareils" },
  { id: "journal", label: "Journal" },
  { id: "composants", label: "Composants" },
];

// Inspiré de la sidebar de magix-web3 (components/layouts/lobby/sidebar.jsx).
export default function Sidebar({ active, onReset }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-24 border-2 border-primary p-2 flex flex-col gap-1" aria-label="Sections">
        <div className="border-2 border-primary text-secondary p-2 font-sans text-lg mb-2">
          OEIL<span className="font-bold text-success">CTRL</span>
        </div>
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            size="sm"
            active={active === s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })}
          >
            {s.label}
          </Button>
        ))}
        <div className="h-px bg-primary/40 my-2" />
        <Button size="sm" variant="neutral" onClick={() => window.open("/", "oeil-display")}>
          Ouvrir l'affichage ↗
        </Button>
        <Button size="sm" variant="neokitsch" onClick={onReset}>
          Réinitialiser
        </Button>
      </nav>
    </aside>
  );
}
