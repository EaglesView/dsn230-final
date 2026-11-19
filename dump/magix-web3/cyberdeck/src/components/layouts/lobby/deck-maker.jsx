import { useEffect, useRef, useState } from "react";
import { useNavigation } from "../../../hooks/useNavigation";

const DeckLayout = () => {
    const deckMakerRef = useRef(null);
    // Je reussis pas avec des classNames car l'api le permets pas,
    // alors je fais un useState pour la taille de la iFrame,
    // et un useEffect pour les changer. C'est overkill
    // mais en meme temps c'est le fun le bloat :))
    const [windowSize, setWindowSize] = useState([window.innerWidth, window.innerHeight]);
    const { userData } = useNavigation();
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        handleResize()
        //Cette partie la je mets un event listener qui call handleResize
        //apres ca, je retourne le unmont du binding.
        //le return arrive juste quand on s'en va.
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    const sessionKey = userData?.key
    const applyStyles = () => {
        let styles = {
            fontColor: "#5EF6FF",
            backgroundColor: "#0E0E17",
            fontGoogleName: "Rajdhani",
            fontSize: "16px",
            hideIcons: true,
            inputBackgroundColor: "F75049",
            inputFontColor: "#5EF6FF",
            height: "600px",
            padding: "5px",
            memberListFontColor: "#ff00dd",
            borderColor: "F75049",
            memberListBackgroundColor: "white",
            hideScrollBar: true, // pour cacher le scroll bar
        }

        setTimeout(() => {
            deckMakerRef.current.contentWindow.postMessage(JSON.stringify(styles), "*");
        }, 100);
    }
    return (
        <div className="w-full h-screen">
            <iframe width={windowSize.width} height={windowSize.height} ref={deckMakerRef} onLoad={applyStyles()} src={`https://magix.apps-de-cours.com/server/deck/${sessionKey}`}>
            </iframe>
        </div>
    );
}

export default DeckLayout;