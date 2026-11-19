import { useContext, useRef, useState } from "react";
import { GlitchContext } from "../../contexts/GlitchContext";

const Selector = ({
  className = "",
  items = [],
  defaultIndex = 0,
  onValueChange = () => {
    console.log("implement me!");
  },
}) => {
  const [currentItem, setCurrentItem] = useState(defaultIndex);
  const { triggerGlitch } = useContext(GlitchContext);
  const valueRef = useRef();
  const next = () => {
    triggerGlitch({
      type: ["block", "displacement", "noise"],
      target: valueRef,
      duration: 100,
      strength: 1.4,
      color: "#FF0000",
      easing: "elastic",
    });
    const newItem = (currentItem + 1) % items.length;
    setCurrentItem(newItem);
    onValueChange?.(items[newItem], newItem);
  };
  const previous = () => {
    triggerGlitch({
      type: ["block", "displacement", "noise"],
      target: valueRef,
      duration: 100,
      strength: 1.4,
      color: "#FF0000",
      easing: "elastic",
    });
    const newItem = (currentItem - 1 + items.length) % items.length;
    setCurrentItem(newItem);
    onValueChange?.(items[newItem], newItem);
  };
  return (
    <div
      className={`flex items-center gap-4 text-primary font-serif ${className}`}
    >
      <button onClick={previous}>{`<`}</button>
      {/* Current selection */}
      <div className="min-w-64 text-center" ref={valueRef}>
        {items[currentItem]}
      </div>
      <button onClick={next}>{`>`}</button>
    </div>
  );
};

export default Selector;
