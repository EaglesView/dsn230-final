import { useState } from "react";
import Panel from "../ui/Panel";
import Tabs from "../ui/Tabs";
import Button from "../ui/Button";
import Checkbox from "../ui/Checkbox";
import Toggle from "../ui/Toggle";
import Slider from "../ui/Slider";
import Selector from "../ui/Selector";
import Segmented from "../ui/Segmented";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import Stat from "../ui/Stat";
import Sparkline from "../ui/Sparkline";
import XYPad from "../ui/XYPad";
import { ProgressBar, AxisMeter } from "../ui/ProgressBar";
import { Dialog, useDialog } from "../ui/Dialog";
import { useToast } from "../ui/Toast";

const VARIANTS = ["neomilitarism", "neokitsch", "kitsch", "entropism", "tech", "neutral"];
const TONES = ["primary", "secondary", "accent", "legendary", "success", "rare", "common"];
const wave = (n, f, p = 0) => Array.from({ length: n }, (_, i) => Math.sin(i * f + p) * 0.8);

function Row({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-secondary/70">{title}</p>
      {children}
    </div>
  );
}

function ButtonsTab() {
  return (
    <div className="flex flex-col gap-6">
      <Row title="Variantes (magix-web3)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
      </Row>
      <Row title="Tailles / états">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Petit</Button>
          <Button>Moyen</Button>
          <Button size="lg">Grand</Button>
          <Button active>Actif</Button>
          <Button disabled>Désactivé</Button>
        </div>
      </Row>
    </div>
  );
}

function FormsTab() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [t, setT] = useState(true);
  const [v, setV] = useState(50);
  const [v2, setV2] = useState(0.4);
  const [sel, setSel] = useState("Rouge");
  const [seg, setSeg] = useState("b");
  const [txt, setTxt] = useState("");
  const [pad, setPad] = useState({ x: 0.3, y: -0.2 });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-5">
        <Row title="Checkbox">
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Coché" checked={a} onChange={setA} />
            <Checkbox label="Décoché" checked={b} onChange={setB} />
            <Checkbox label="Désactivé" checked disabled />
          </div>
        </Row>
        <Row title="Interrupteur">
          <div className="flex flex-wrap gap-6">
            <Toggle label="Interrupteur" checked={t} onChange={setT} />
            <Toggle label="Désactivé" checked={false} disabled />
          </div>
        </Row>
        <Row title="Sliders">
          <Slider label="Entier" value={v} onChange={setV} unit="%" />
          <Slider label="Décimal" value={v2} onChange={setV2} min={0} max={1} step={0.01} color="success" format={(x) => x.toFixed(2)} />
          <Slider label="Désactivé" value={30} disabled />
        </Row>
      </div>
      <div className="flex flex-col gap-5">
        <Row title="Sélecteur horizontal (magix-web3)">
          <Selector label="Thème" items={["Rouge", "Cyan", "Violet", "Or"]} value={sel} onChange={setSel} />
        </Row>
        <Row title="Groupe segmenté">
          <Segmented value={seg} onChange={setSeg} color="secondary" options={[{ value: "a", label: "Alpha" }, { value: "b", label: "Bravo" }, { value: "c", label: "Charlie" }, { value: "d", label: "Off", disabled: true }]} />
        </Row>
        <Row title="Champ texte">
          <Input label="Adresse IP" placeholder="192.168.1.100" value={txt} onChange={(e) => setTxt(e.target.value)} hint="Placeholder, aide et focus." />
        </Row>
        <Row title="Pavé XY">
          <div className="max-w-56">
            <XYPad value={pad} onChange={setPad} />
          </div>
        </Row>
      </div>
    </div>
  );
}

function DataTab() {
  return (
    <div className="flex flex-col gap-6">
      <Row title="Tuiles">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Visiteurs" value="128" sub="aujourd'hui" color="success" />
          <Stat label="Latence" value="14 ms" sub="OSC → TD" color="secondary" />
          <Stat label="Scène" value="03" color="legendary" />
          <Stat label="Erreurs" value="2" sub="dernière heure" color="primary" />
        </div>
      </Row>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Row title="Barres de progression">
          {["primary", "secondary", "success", "legendary"].map((c, i) => (
            <ProgressBar key={c} label={c} value={25 + i * 22} color={c} />
          ))}
        </Row>
        <Row title="Jauges signées">
          <AxisMeter label="X" value={-0.62} color="primary" />
          <AxisMeter label="Y" value={0.35} color="secondary" />
          <AxisMeter label="Z" value={0.9} color="accent" />
        </Row>
      </div>
      <Row title="Sparkline">
        <Sparkline
          label="Démo"
          series={[
            { label: "A", data: wave(80, 0.2), color: "var(--secondary)" },
            { label: "B", data: wave(80, 0.13, 1), color: "var(--accent)" },
          ]}
        />
      </Row>
    </div>
  );
}

function FeedbackTab() {
  const ok = useDialog();
  const confirm = useDialog();
  const hard = useDialog();
  const kitsch = useDialog();
  const toast = useToast();
  return (
    <div className="flex flex-col gap-6">
      <Row title="Badges">
        <div className="flex flex-wrap gap-2">
          {TONES.map((t, i) => (
            <Badge key={t} color={t} pulse={i === 0}>
              {t}
            </Badge>
          ))}
        </div>
      </Row>
      <Row title="Dialogues (magix-web3)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <Button onClick={ok.open}>OK</Button>
          <Button onClick={confirm.open}>Confirmer</Button>
          <Button variant="neokitsch" onClick={hard.open}>Hard mode</Button>
          <Button variant="kitsch" onClick={kitsch.open}>Kitsch</Button>
        </div>
      </Row>
      <Row title="Notifications">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Button variant="neutral" size="sm" onClick={() => toast("Paramètre sauvegardé.", "info")}>Info</Button>
          <Button variant="tech" size="sm" onClick={() => toast("ESP32 connecté.", "ok")}>Succès</Button>
          <Button variant="neokitsch" size="sm" onClick={() => toast("Batterie faible sur la Wiimote.", "warn")}>Alerte</Button>
          <Button size="sm" onClick={() => toast("Connexion perdue avec TouchDesigner.", "error")}>Erreur</Button>
        </div>
      </Row>

      <Dialog isOpen={ok.isOpen} onClose={ok.close} title="//INFO">
        Ce paramètre sera effectif au prochain rechargement de l'affichage.
      </Dialog>
      <Dialog isOpen={confirm.isOpen} onClose={confirm.close} type="confirm" title="//CONFIRMATION" onConfirm={() => toast("Confirmé.", "ok")}>
        Envoyer la scène 2 à tous les affichages?
      </Dialog>
      <Dialog isOpen={hard.isOpen} onClose={hard.close} type="confirm" hardMode variant="neokitsch" title="//ARRÊT D'URGENCE" onConfirm={() => toast("Arrêt simulé.", "warn")}>
        Ce dialogue ne se ferme pas en cliquant à côté ni avec Échap.
      </Dialog>
      <Dialog isOpen={kitsch.isOpen} onClose={kitsch.close} variant="kitsch" title="//KITSCH">
        Variante violette.
      </Dialog>
    </div>
  );
}

export default function ComponentLab() {
  return (
    <Panel id="composants" title="Banc d'essai des composants" code="//08">
      <Tabs
        tabs={[
          { label: "Boutons", content: <ButtonsTab /> },
          { label: "Formulaires", content: <FormsTab /> },
          { label: "Données", content: <DataTab /> },
          { label: "Retours", content: <FeedbackTab /> },
        ]}
      />
    </Panel>
  );
}
