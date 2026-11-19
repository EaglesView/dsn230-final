import { useEffect, useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import Sidebar, { SECTIONS } from "../components/admin/Sidebar";
import OverviewSection from "../components/admin/OverviewSection";
import FsmPanel from "../components/admin/FsmPanel";
import TrackingPanel from "../components/admin/TrackingPanel";
import RenderPanel from "../components/admin/RenderPanel";
import DevicesPanel from "../components/admin/DevicesPanel";
import LogPanel from "../components/admin/LogPanel";
import ComponentLab from "../components/admin/ComponentLab";
import MediaPanel from "../components/admin/MediaPanel";
import CameraPanel from "../components/admin/CameraPanel";
import { useAdminBus } from "../components/admin/useAdminBus";
import { ToastProvider, useToast } from "../components/ui/Toast";
import { Dialog, useDialog } from "../components/ui/Dialog";
import { controlsStore, DEFAULT_CONTROLS } from "../lib/controls";
import { decide, sceneIndex } from "../lib/fsm";
import { log } from "../lib/log";

function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return active;
}

function Dashboard() {
  const controls = controlsStore.use();
  const { displays, history, sendGaze, sendPress, sendMedia, sendMediaFile } = useAdminBus();
  const active = useActiveSection();
  const reset = useDialog();
  const toast = useToast();

  const update = (patch, msg) => {
    controlsStore.set(patch);
    if (msg) log(msg);
  };

  const fire = (event) => {
    const cur = controlsStore.get().fsm;
    const next = decide(cur, event);
    if (next === cur) return log(`[FSM] ${event} ignoré dans ${cur}`, "warn");
    controlsStore.set({ fsm: next });
    log(`[FSM] ${cur} → ${next} (${event})`, next === "Error" ? "error" : "ok");
    log(`/state "${next}" ${sceneIndex(next)}`, "osc");
  };

  const force = (state) => {
    controlsStore.set({ fsm: state });
    log(`[FSM] forcé → ${state}`, "warn");
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <AdminHeader displays={displays} fsm={controls.fsm} />
      <div className="flex gap-4 px-4 pb-10">
        <Sidebar active={active} onReset={reset.open} />
        <main className="flex-1 min-w-0 flex flex-col gap-4">
          <OverviewSection controls={controls} displays={displays} history={history} />
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            <FsmPanel fsm={controls.fsm} fire={fire} force={force} />
            <TrackingPanel controls={controls} update={update} sendGaze={sendGaze} sendPress={sendPress} />
            <RenderPanel controls={controls} update={update} />
            <MediaPanel controls={controls} update={update} sendMedia={sendMedia} sendMediaFile={sendMediaFile} />
            <CameraPanel controls={controls} update={update} />
            <DevicesPanel fsm={controls.fsm} />
          </div>
          <LogPanel fire={fire} />
          <ComponentLab />
          <footer className="font-serif text-xs text-foreground/40 pt-4">
            Modèle 3D : « Eye PBR Test (Downloadable) » par James Truhlar —{" "}
            <a className="underline hover:text-secondary" href="https://sketchfab.com/3d-models/eye-pbr-test-downloadable-f12c63ce28c847fa8041c101f616154b">
              Sketchfab
            </a>{" "}
            — CC-BY-4.0. UI inspirée de magix-web3.
          </footer>
        </main>
      </div>

      <Dialog
        isOpen={reset.isOpen}
        onClose={reset.close}
        type="confirm"
        title="//RÉINITIALISER"
        confirmText="RÉINITIALISER"
        onConfirm={() => {
          controlsStore.set(DEFAULT_CONTROLS);
          log("Contrôles réinitialisés", "warn");
          toast("Contrôles remis par défaut.", "warn");
        }}
      >
        Remettre tous les contrôles de l'oeil à leurs valeurs par défaut?
      </Dialog>
    </div>
  );
}

export default function Admin() {
  useEffect(() => {
    document.title = "OEIL // Admin";
  }, []);
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
