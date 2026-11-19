import { useContext, useEffect, useRef, useState } from "react";
import { GlitchContext } from "../../contexts/GlitchContext";

const PlayerHealthBar = ({ cur_h = 0, max_h = 35 }) => {
  const [health, setHealth] = useState(null);
  const healthRef = useRef();
  const { triggerGlitch } = useContext(GlitchContext);
  useEffect(() => {
    const newHealth = parseInt((cur_h / max_h) * 100);
    if (newHealth > health) {
      //Player a heal up
      triggerGlitch({
        type: ["block", "displacement", "noise"],
        target: healthRef,
        duration: 250,
        strength: 2.0,
        color: "#00FF00",
        easing: "elastic",
      });
    } else if (newHealth < health) {
      //Player took ouchie owie
      triggerGlitch({
        type: ["block", "displacement", "noise"],
        target: healthRef,
        duration: 500,
        strength: 2.0,
        color: "#FF0000",
        easing: "elastic",
      });
    }
    setHealth(parseInt((cur_h / max_h) * 100));
  }, [cur_h, max_h, health, triggerGlitch]);
  useEffect(() => {}, [health]);
  return (
    <div className="relative w-full">
      <div className="absolute z-[10] w-full h-6 bg-primary/10 cut-health">
        <div
          ref={healthRef}
          style={{ width: `${health}%` }}
          className={`absolute z-[11] transition-all duration-300  h-6 bg-destructive cut-health w-full text-background`}
        >
          {health}
        </div>
      </div>
    </div>
  );
};

export default PlayerHealthBar;
