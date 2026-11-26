import { useEffect, useRef, useState } from "react";
import { createRenderer } from "../three/createRenderer";
import { EyeScene } from "../three/EyeScene";

/**
 * Mounts the 3D eye. Changing the backend or the model remounts with a fresh
 * canvas (a canvas can't switch from a WebGL to a WebGPU context).
 */
export default function EyeCanvas(props) {
  const { backend, model } = props.controls;
  return <EyeCanvasInner key={`${backend}:${model}`} {...props} />;
}

function EyeCanvasInner({ controls, onTelemetry, className = "relative w-full h-full" }) {
  const hostRef = useRef(null);
  const eyeRef = useRef(null);
  const controlsRef = useRef(controls);
  const telemetryRef = useRef(onTelemetry);
  const [status, setStatus] = useState({ phase: "init", error: null });

  controlsRef.current = controls;
  telemetryRef.current = onTelemetry;

  useEffect(() => {
    const host = hostRef.current;
    // A fresh canvas per mount keeps StrictMode's double-mount from sharing a context.
    const canvas = document.createElement("canvas");
    canvas.className = "block w-full h-full";
    host.appendChild(canvas);

    let disposed = false;
    let renderer;
    let eye;
    let ro;

    (async () => {
      try {
        const made = await createRenderer(controlsRef.current.backend, canvas);
        renderer = made.renderer;
        if (disposed) return renderer.dispose();

        eye = new EyeScene(made);
        await eye.init();
        if (disposed) return eye.dispose();
        eyeRef.current = eye;
        eye.setControls(controlsRef.current);

        ro = new ResizeObserver(([entry]) => {
          const { width, height } = entry.contentRect;
          eye.resize(width, height);
        });
        ro.observe(host);
        eye.resize(host.clientWidth, host.clientHeight);

        setStatus({ phase: "loading", error: null });
        eye
          .load(controlsRef.current.model)
          .then(() => !disposed && setStatus({ phase: "ready", error: null }))
          .catch((err) => !disposed && setStatus({ phase: "error", error: String(err) }));

        let last = performance.now();
        let frames = 0;
        let fpsStart = last;
        renderer.setAnimationLoop(() => {
          const now = performance.now();
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          eye.frame(dt);
          frames++;
          if (now - fpsStart >= 500) {
            telemetryRef.current?.({
              fps: Math.round((frames * 1000) / (now - fpsStart)),
              backend: made.actual,
              gaze: [eye.output.x, eye.output.y],
              ready: !!eye.model,
              pupil: eye.handles.setPupil ? eye.pupil : null,
              press: eye.handles.applyPress ? eye.press : null,
              media: eye.handles.setMedia ? eye.mediaK : null,
              wave: eye.handles.applyWave ? eye.waveK : null,
            });
            frames = 0;
            fpsStart = now;
          }
        });
      } catch (err) {
        if (!disposed) setStatus({ phase: "error", error: String(err?.message ?? err) });
      }
    })();

    return () => {
      disposed = true;
      ro?.disconnect();
      renderer?.setAnimationLoop(null);
      eye?.dispose();
      eyeRef.current = null;
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    eyeRef.current?.setControls(controls);
  }, [controls]);

  return (
    <div ref={hostRef} className={className} data-phase={status.phase}>
      {status.phase !== "ready" && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <p
            className={`font-sans text-xs tracking-[0.3em] uppercase ${
              status.error ? "text-primary" : "text-secondary animate-blink"
            }`}
          >
            {status.error ? `ERREUR // ${status.error}` : "CHARGEMENT DE L'OEIL…"}
          </p>
        </div>
      )}
    </div>
  );
}
