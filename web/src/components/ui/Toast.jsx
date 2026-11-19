import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(() => {});
const STYLE = {
  info: "border-secondary text-secondary",
  ok: "border-success text-success",
  warn: "border-legendary text-legendary",
  error: "border-primary text-primary",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, level = "info", ms = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-4), { id, msg, level }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in border-l-4 ${STYLE[t.level] ?? STYLE.info} bg-background/95 px-4 py-3 font-serif text-base shadow-lg shadow-black/50 cut-corner-br`}
          >
            <span className="font-sans text-[10px] tracking-[0.2em] uppercase opacity-70 block">{t.level}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
