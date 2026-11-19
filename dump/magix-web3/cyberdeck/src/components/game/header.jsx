import { useContext, useRef } from "react";
import { GlitchContext } from "../../contexts/GlitchContext";
import { useNavigation } from "../../hooks/useNavigation";

const Header = ({ children }) => {
  const { currentLayout, transitionTo } = useNavigation();
  const { triggerGlitch } = useContext(GlitchContext);
  const navRef = useRef(null);
  return (
    <nav
      className=" w-full h-24 p-4"
      onClick={() => {
        currentLayout != "lobby" && transitionTo("lobby");
      }}
    >
      <div
        className="border-2 border-primary h-12 "
        ref={navRef}
        onMouseEnter={() => {
          if (currentLayout != "login") {
            triggerGlitch({
              type: ["chromatic", "displacement", "noise"],
              target: navRef,
              duration: 1000,
              strength: 1.2,
              color: "#FF0000",
            });
          }
        }}
      >
        {/* {children} */}
        <div className="flex gap-4 h-full items-center justify-start px-12 text-primary font-serif text-xl">
          <p>NIGHT CITY PORTAL</p>|<p>CONNECTED TO DATACENTER ARASAKA0802</p>|
          <p
            className="cursor-pointer hover:text-secondary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              transitionTo("mapviewer");
            }}
          >
            [MAP VIEWER]
          </p>
          |
          <p>
            BLACKWALL FIREWALL :
            {currentLayout == "login" ? (
              <span className="text-success">ACTIVE</span>
            ) : (
              <span className="font-bold text-destructive">BROKEN</span>
            )}
          </p>
        </div>
      </div>
    </nav>
  );
};

export default Header;
