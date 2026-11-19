import { useEffect, useRef, useState } from "react";
import Panel from "../ui/Panel";
import Segmented from "../ui/Segmented";
import Input from "../ui/Input";
import Slider from "../ui/Slider";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { mediaKind } from "../../lib/media";

/** Image / video shown inside the pupil while F (or the button) is held. */
export default function MediaPanel({ controls, update, sendMedia, sendMediaFile }) {
  const [held, setHeld] = useState(false);
  const [file, setFile] = useState(null); // { name, url, kind }
  const fileInput = useRef(null);
  const heldRef = useRef(false);

  const hold = (down) => {
    if (down === heldRef.current) return;
    heldRef.current = down;
    setHeld(down);
    sendMedia(down);
  };

  // F works on the dashboard too (except while typing).
  useEffect(() => {
    const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    const down = (e) => e.key.toLowerCase() === "f" && !e.repeat && !typing(e) && hold(true);
    const up = (e) => e.key.toLowerCase() === "f" && hold(false);
    const blur = () => hold(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => file && URL.revokeObjectURL(file.url), [file]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile({ name: f.name, url: URL.createObjectURL(f), kind: mediaKind(f.type) });
    sendMediaFile(f);
    update({ mediaSource: "file" }, `Média pupille → ${f.name}`);
  };

  return (
    <Panel
      id="media"
      title="Média dans la pupille"
      code="//09"
      actions={<Badge color={held ? "success" : "common"} pulse={held}>{held ? "Affiché" : "Touche F"}</Badge>}
    >
      <div className="flex flex-col gap-5">
        <Segmented
          label="Source"
          color="accent"
          value={controls.mediaSource}
          onChange={(v) => update({ mediaSource: v }, `Média pupille → ${v}`)}
          options={[
            { value: "demo", label: "Démo" },
            { value: "file", label: "Fichier" },
            { value: "url", label: "URL" },
          ]}
        />

        {controls.mediaSource === "file" && (
          <div className="flex flex-col gap-2">
            <input ref={fileInput} type="file" accept="image/*,video/*" className="sr-only" onChange={onFile} />
            <Button size="sm" variant="neutral" onClick={() => fileInput.current?.click()}>
              Choisir une image ou une vidéo…
            </Button>
            {file ? (
              <div className="flex items-center gap-3 border border-primary/30 p-2">
                {file.kind === "video" ? (
                  <video src={file.url} muted loop autoPlay playsInline className="w-16 h-16 object-cover rounded-full" />
                ) : (
                  <img src={file.url} alt="" className="w-16 h-16 object-cover rounded-full" />
                )}
                <span className="font-mono text-xs text-foreground/80 break-all">{file.name}</span>
              </div>
            ) : (
              <p className="font-serif text-xs text-foreground/50">Aucun fichier: la démo est affichée.</p>
            )}
          </div>
        )}

        {controls.mediaSource === "url" && (
          <Input
            label="URL de l'image ou de la vidéo"
            placeholder="https://… .jpg / .png / .mp4 / .webm"
            value={controls.mediaUrl}
            onChange={(e) => update({ mediaUrl: e.target.value })}
            hint="Le serveur doit autoriser le CORS. Vidéo détectée par l'extension."
          />
        )}

        <Slider
          label="Taille du disque (indépendante de la pupille)"
          value={controls.mediaSize}
          min={0.05}
          max={0.55}
          step={0.01}
          color="accent"
          format={(v) => v.toFixed(2)}
          onChange={(v) => update({ mediaSize: v })}
        />

        <Button
          variant="kitsch"
          className="w-full touch-none select-none"
          active={held}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            hold(true);
          }}
          onPointerUp={() => hold(false)}
          onPointerCancel={() => hold(false)}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && hold(true)}
          onKeyUp={(e) => (e.key === " " || e.key === "Enter") && hold(false)}
          onBlur={() => hold(false)}
        >
          Maintenir: afficher (F)
        </Button>
      </div>
    </Panel>
  );
}
