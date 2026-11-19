import { useSound } from "../../hooks/useSound";
import "../../styles/shapes.css"

const variantStyles = {
    neomilitarism: {
        bg: "bg-primary/50",
        hover: "group-hover:bg-primary",
        text: "text-primary font-bold font-serif group-active:text-secondary",
        texthover: "group-hover:font-medium group-hover:text-background"
    },
    neokitsch: {
        bg: "bg-legendary/50",
        hover: "group-hover:bg-legendary",
        text: "text-legendary font-serif group-active:px-10",
        texthover: "group-hover:font-bold group-hover:text-background"
    },
    kitsch: {
        bg: "bg-accent/50",
        hover: "group-hover:bg-accent",
        text: "text-secondary font-sans group-active:text-secondary",
        texthover: "group-hover:font-bold"
    },
    entropism: {
        bg: "bg-rare/50",
        hover: "group-hover:bg-rare",
        text: "text-background font-mono group-active:text-secondary",
        texthover: "group-hover:font-bold"
    },
    tech: {
        bg: "bg-success/50",
        hover: "group-hover:bg-success",
        text: "text-success font-bold font-serif group-active:font-bold",
        texthover: "group-hover:font-medium group-hover:text-background"
    },
    neutral: {
        bg: "bg-secondary/50",
        hover: "group-hover:bg-secondary",
        text: "text-secondary font-bold font-serif group-active:font-bold",
        texthover: "group-hover:font-medium group-hover:text-background"
    },
};

const Button = ({ children, className, variant = "neomilitarism", onClick = (() => { }) }) => {
    const {playSound} = useSound();
    const currentVariant = variantStyles[variant] || variantStyles.destructive;
    const handleClick = () => {
        onClick();
        playSound('sfx','select');
    }
    const handleHover = () => {
        playSound('sfx','hover')
    }
    return (
        <button 
        onClick={()=>{handleClick()}} 
        onMouseEnter={()=>handleHover()}
        className={`group ${className} cursor-pointer flex items-center h-12`}>
            {/** container principal graphique */}
            <div className={`w-4 h-full cut-sm-bl ${currentVariant.bg}`}>.</div>
            <div className={`transition-colors duration-100 ${currentVariant.bg} ${currentVariant.hover} flex-1 cut-xxs-br`}>
                <p className={`transition-all duration-150 ease-cubic w-full text-left px-4 group-hover:px-12 ${currentVariant.text} ${currentVariant.texthover} `}>
                    {children}
                </p>
            </div>
        </button>
    );
}

export default Button;