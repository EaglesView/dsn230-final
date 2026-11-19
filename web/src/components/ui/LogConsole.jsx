import { useEffect, useRef } from "react";

const LEVEL = {
  info: "text-secondary",
  ok: "text-success",
  warn: "text-legendary",
  error: "text-primary",
  osc: "text-accent",
};

// Inspiré du chat de magix-web3 (components/layouts/lobby/cyber-chat.jsx).
export default function LogConsole({ entries, height = 260, onCommand }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);
  return (
    <div className="flex flex-col border border-primary/50">
      <div ref={ref} className="overflow-y-auto p-3 font-mono text-xs leading-relaxed bg-black/30" style={{ height }} aria-live="polite">
        {entries.length === 0 && <p className="text-foreground/40">// aucun événement</p>}
        {entries.map((e) => (
          <p key={e.id} className="flex gap-3">
            <span className="text-foreground/35 tabular-nums shrink-0">{e.time}</span>
            <span className={`${LEVEL[e.level] ?? LEVEL.info} uppercase w-10 shrink-0`}>{e.level}</span>
            <span className="text-foreground/85 break-all">{e.msg}</span>
          </p>
        ))}
      </div>
      {onCommand && (
        <form
          className="flex border-t border-primary/50"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.cmd;
            if (input.value.trim()) onCommand(input.value.trim());
            input.value = "";
          }}
        >
          <span className="pl-3 self-center font-mono text-primary">$</span>
          <input
            name="cmd"
            aria-label="Commande"
            placeholder="next · prev · home · lost · connected · help"
            className="flex-1 bg-transparent px-3 py-2 font-mono text-xs outline-none placeholder:text-foreground/30"
          />
          <button
            type="submit"
            className="px-4 bg-primary text-background font-serif font-bold uppercase text-sm hover:px-6 transition-all cursor-pointer"
          >
            Envoyer
          </button>
        </form>
      )}
    </div>
  );
}
