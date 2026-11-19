export default function Panel({ title, code, actions, children, className = "", bodyClassName = "", id }) {
  return (
    <section
      id={id}
      className={`relative border border-primary/60 bg-primary/5 cut-corner-br scroll-mt-24 ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-primary/40 px-4 py-2 min-h-11">
        <h2 className="font-sans text-xs sm:text-sm tracking-[0.2em] uppercase text-primary">
          {code && <span className="text-secondary/70 mr-2">{code}</span>}
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
