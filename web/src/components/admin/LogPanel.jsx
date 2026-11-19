import Panel from "../ui/Panel";
import LogConsole from "../ui/LogConsole";
import { log, logStore } from "../../lib/log";

const COMMANDS = {
  next: "NextScene",
  prev: "PrevScene",
  home: "Home",
  boot: "BootDone",
  connected: "Connected",
  lost: "ConnectionLost",
};

export default function LogPanel({ fire }) {
  const entries = logStore.use();
  const onCommand = (cmd) => {
    const ev = COMMANDS[cmd.toLowerCase()];
    if (ev) return fire(ev);
    if (cmd === "help") log(`Commandes: ${Object.keys(COMMANDS).join(", ")}`);
    else log(`Commande inconnue: ${cmd}`, "warn");
  };
  return (
    <Panel
      id="journal"
      title="Journal"
      code="//07"
      actions={
        <button type="button" onClick={() => logStore.set([])} className="font-sans text-[10px] tracking-widest text-primary/70 hover:text-primary cursor-pointer">
          EFFACER
        </button>
      }
    >
      <LogConsole entries={entries} onCommand={onCommand} />
    </Panel>
  );
}
