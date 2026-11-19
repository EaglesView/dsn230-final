import { useEffect, useState } from "react";
import Badge from "../ui/Badge";

export default function AdminHeader({ displays, fsm }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const real = displays.filter((d) => d.role === "display").length;
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm px-4 pt-4 pb-2">
      <div className="border-2 border-primary min-h-12 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-primary font-serif text-base sm:text-lg">
        <p className="font-sans text-sm tracking-[0.25em]">
          OEIL<span className="text-secondary">//</span>DECK
        </p>
        <span className="hidden sm:inline text-primary/40">|</span>
        <p className="hidden md:block">DSN230 — CONTRÔLE DE L'INSTALLATION</p>
        <span className="hidden md:inline text-primary/40">|</span>
        <p>
          AFFICHAGES:{" "}
          <span className={real ? "text-success font-bold" : "text-primary font-bold"}>{real}</span>
          <span className="text-foreground/40"> (+{displays.length - real} aperçu)</span>
        </p>
        <span className="hidden sm:inline text-primary/40">|</span>
        <p>
          ÉTAT: <span className={fsm === "Error" ? "text-primary font-bold animate-blink" : "text-secondary font-bold"}>{fsm}</span>
        </p>
        <div className="ml-auto flex items-center gap-3">
          <Badge color="legendary">ESP32 simulé</Badge>
          <time className="font-mono text-sm text-foreground/60 tabular-nums">
            {now.toTimeString().slice(0, 8)}
          </time>
        </div>
      </div>
    </header>
  );
}
