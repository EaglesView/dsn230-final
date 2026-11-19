import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

// Repris de magix-web3 (components/ui/dialog.jsx), sans le glitch.
const VARIANTS = {
  neomilitarism: { border: "border-primary", text: "text-primary" },
  neokitsch: { border: "border-legendary", text: "text-legendary" },
  kitsch: { border: "border-accent", text: "text-accent" },
  entropism: { border: "border-rare", text: "text-rare" },
};

/**
 * @param type     "ok" | "confirm" | "custom"
 * @param hardMode can't be dismissed by backdrop / Esc / ×
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  type = "ok",
  variant = "neomilitarism",
  onConfirm,
  confirmText,
  cancelText = "ANNULER",
  hardMode = false,
  children,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.neomilitarism;
  const boxRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement;
    boxRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && !hardMode && closeRef.current?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [isOpen, hardMode]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4"
      onClick={(e) => e.target === e.currentTarget && !hardMode && onClose?.()}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`w-full max-w-lg border-2 ${v.border} bg-background outline-none`}
      >
        <div className={`flex items-center justify-between border-b-2 ${v.border} px-5 py-3`}>
          <h2 className={`font-serif text-xl font-bold ${v.text}`}>{title}</h2>
          {!hardMode && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className={`${v.text} text-2xl leading-none hover:opacity-70 cursor-pointer`}
            >
              ×
            </button>
          )}
        </div>
        <div className={`p-5 font-serif text-lg ${v.text}`}>{children}</div>
        {type !== "custom" && (
          <div className="flex flex-wrap justify-end gap-3 px-5 pb-5">
            {type === "confirm" && (
              <Button variant={variant} className="w-44" onClick={onClose}>
                {hardMode ? "QUITTER" : cancelText}
              </Button>
            )}
            <Button
              variant="neokitsch"
              className="w-44"
              onClick={() => {
                if (type === "confirm") onConfirm?.();
                onClose?.();
              }}
            >
              {confirmText ?? (type === "confirm" ? "CONFIRMER" : "OK")}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function useDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((o) => !o),
  };
}
