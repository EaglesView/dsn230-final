import { useContext, useRef, useState } from "react";
import { GlitchContext } from "../../contexts/GlitchContext";
import { useSound } from "../../hooks/useSound";

const Checkbox = ({ defaultValue=true, onCheck = () => { console.log("Implement me!!!") }, id = "default-checkbox" }) => {
    const { triggerGlitch } = useContext(GlitchContext);
    const {playSound} = useSound();
    
    const [checked, setChecked] = useState(defaultValue);
    const checkRef = useRef();
    const handleCheck = () => {
        setChecked(prev => !prev);
        playSound('sfx',(checked?'select':'closeDialog'));
        triggerGlitch({
            type: ['noise', 'block','rgbsplit'],
            target: checkRef,
            duration: 100,
            strength: 1.9
        });
        onCheck();
    };
    return (
        <div className="flex items-center justify-center">
            <input
                id={id}
                type="checkbox"
                className="appearance-none sr-only peer"
                checked={checked}
            />
            <label
                htmlFor={id}
                onClick={handleCheck}
                ref={checkRef}
                className="
                w-8 h-8 
                transition-all duration-100 ease-in-out
                bg-primary/30 
                cut-sm-br 
                border-primary border-1
                peer-checked:bg-primary
                peer-checked:scale-90
                cursor-crosshair
                "
            >
                {checked && (
                    <p className="text-2xl font-sans text-background select-none w-full text-center font-black">
                        ✓
                    </p>
                )}

            </label>
        </div>
    );
}

export default Checkbox;