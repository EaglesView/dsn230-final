import Header from "../game/header";

const ThemedLayout = ({ children, className = "", hasHeader = true }) => {
  return (
    <div
      className={`cursor-cell font-mono text-4xl bg-background w-screen h-screen flex  flex-col  ${className}`}
    >
      {hasHeader && <Header />}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ThemedLayout;
