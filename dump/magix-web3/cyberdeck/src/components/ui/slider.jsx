import { useState } from "react";
import { useSound } from "../../hooks/useSound";

const Slider = ({ action = () => { }, min = 0, max = 100, defaultValue = 50, onValueChange = () => { }, onValueCommit = () => { console.log("implement me im in slider.jsx!") }, withValue = true, increment = 0 }) => {
    const [value, setValue] = useState(defaultValue);
    const fillPercent = ((value - min) / (max - min)) * 100;
    const { playSound } = useSound();
    const handleChange = (event) => {
        const newValue = event.target.value;
        setValue(newValue);
        onValueChange?.(newValue);
        action(newValue);
    }
    const handleCommit = (event) => {
        const newValue = event.target.value;
        onValueCommit?.(newValue);
    }
    const handleInnerChange = (event) => {
        
            handleChange(event);
            playSound('sfx', 'tick');

        
    }
    return (
        <div className="h-full min-w-[300px] max-w-[500px] w-1/2 flex items-center justify-end gap-4">

            <input
                type="range"
                onChange={handleInnerChange}
                min={min}
                max={max}
                value={value}
                step={increment > 0 ? increment : 1}  // Add this!

                onPointerUp={handleCommit}
                className={`appearance-none peer w-[250px]`}
                style={{ '--fill-percent': `${fillPercent}%` }}  // Set CSS variable
            />
            {/**Ligne du slider */}
            {withValue && (
                <p className="font-serif text-primary text-2xl min-w-8">
                    {value}
                </p>
            )}
        </div>
    );
}

export default Slider;