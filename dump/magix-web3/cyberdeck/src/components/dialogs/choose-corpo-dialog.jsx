import { Dialog } from "../ui/dialog";
import arasakalogosmall from "../../assets/arasaka-vertical.png";
import militechlogosmall from "../../assets/militech-vertical.png";
import kangtaologosmall from "../../assets/kangtao-vertical.png";
import { useContext, useEffect, useRef, useState } from "react";
import { GlitchContext } from "../../contexts/GlitchContext";

//import arasakalogo from "../../assets/arasaka-long.png";
//import militechlogo from "../../assets/militech-long.png";
//import kangtaologo from "../../assets/kangtao-long.webp";
const DialogCorpo = ({ dialog }) => {
    const [hovered, setHovered] = useState(null); //lequel est hovered
    const { triggerGlitch } = useContext(GlitchContext);

    const MILITECH = {
        "Corporation": "MILITECH",
        "Industry": "Arms manufacturing, Military vehicle production, Mercenary contracting",
        "Established": "1996 (Restructured in 2002)",
        "HQ": "Washington D.C. , NUSA",
        "CEO": "Lucas Harford",
        "Value": "€$432+ Billion nationalized, €$1.2 Trillion with NUSA"
    }
    const ARASAKA = {
        "Corporation": "ARASAKA (荒坂社, アラサカ社)",
        "Industry": "Corporate security, Manufacturing, Banking",
        "Established": "1915",
        "HQ": "Chuo-ku, Tokyo, Japan",
        "CEO": "Saburo Arasaka",
        "Value": "¥98 Trillion (890 Billion)"

    }
    const KANGTAO = {
        "Corporation": "KANG TAO (康陶)",
        "Industry": "Corporate weapons manufacturer",
        "Established": "1990's (Restructured in 2050)",
        "HQ": "Shenyang,China",
        "CEO": "Shiming Xu",
        "Value": "€$525 Billion"
    }
    const CorpoDetail = ({ name, value }) => {
        const glitchRef = useRef();
        const [writtenValue, setWrittenValue] = useState("");
        const [counter, setCounter] = useState(1);

        useEffect(() => {
            const len = value.length
            const interval = setInterval(() => {
                if (counter < len) {
                    setCounter(prev => {
                        setWrittenValue(value.slice(0, prev + 1));
                        return prev + 1;
                    });
                    console.log(`${name}:${counter}`)
                } else {
                    clearInterval(interval);
                }

            },
                25
            );





            triggerGlitch({

                type: ['block'],
                target: glitchRef,
                duration: 300,
                strength: 0.5,
                color: '#FF0000'
            })
            return () => clearInterval(interval);
        }, [value])
        return (
            <div ref={glitchRef}>
                <p className="corpodescription"

                >
                    {name}: {writtenValue}
                </p>
            </div>

        )
    }
    return (
        <Dialog
            isOpen={dialog.isOpen}
            onClose={dialog.close}
            title="CHOISIR UNE CORPORATION"
            type="custom"
            variant="neomilitarism"
            onConfirm={() => { }}
            confirmText="CONNECTION"
        >
            <div className="flex flex-col">
                <div className="flex flex-row items-center justify-evenly  min-w-[1000px] max-w-[4000px]">
                    <img src={arasakalogosmall} className="cursor-crosshair transition-all w-[200px] h-auto duration-300 brightness-100 hover:brightness-200"
                        onMouseEnter={() => setHovered(ARASAKA)}
                        onMouseLeave={() => setHovered(null)}
                    />
                    <img src={militechlogosmall} className="cursor-crosshair transition-all w-[200px] h-auto duration-300 brightness-100 hover:brightness-200"
                        onMouseEnter={() => setHovered(MILITECH)}
                        onMouseLeave={() => setHovered(null)}
                    />
                    <img src={kangtaologosmall} className="cursor-crosshair transition-all max-w-[200px] max-h-[150px] aspect-auto h-auto duration-300 brightness-100 hover:brightness-200"
                        onMouseEnter={() => setHovered(KANGTAO)}
                        onMouseLeave={() => setHovered(null)}
                    />

                </div>
                <div className="flex w-full h-full justify-between">
                    <div className="flex flex-col h-full justify-end" >
                        <CorpoDetail name={"Corporation"} value={hovered ? hovered.Corporation : "..."} />
                        <CorpoDetail name={"CEO"} value={hovered ? hovered.CEO : "..."} />
                        <CorpoDetail name={"Manufacturing/Industry"} value={hovered ? hovered.Industry : "..."} />
                        <CorpoDetail name={"Net Value"} value={hovered ? hovered.Value : "..."} />
                        <CorpoDetail name={"Headquarters"} value={hovered ? hovered.HQ : "..."} />
                    </div>

                </div>

            </div>

        </Dialog>
    )
}

export default DialogCorpo;