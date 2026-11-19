import { useContext, useRef, useState } from "react";
import Header from "../game/header";
import { Dialog, useDialog } from "../ui/dialog";
import Input from "../ui/input";
import { GlitchContext } from "../../contexts/GlitchContext";
import pvpImage from "../../assets/pvp.webp";
import trainingImage from "../../assets/training.jpg";
import privateImage from "../../assets/private_match.png";



import DialogConnection from "../dialogs/game-connect-dialog";
import DialogCorpo from "../dialogs/choose-corpo-dialog";
import DialogPrivate from "../dialogs/private-match-dialog";
import { useNavigation } from "../../hooks/useNavigation";
import { useSound } from "../../hooks/useSound";




const GameMode = ({ onClick, name, description, image_url }) => {
    const [hovered, setIsHovered] = useState(false);
    const { triggerGlitch } = useContext(GlitchContext); //bien sur je lajoutes partout!!
    const { playSound } = useSound();
    const moderef = useRef()
    const handleClick = () => {
        onClick();
        playSound('sfx', 'select');
    }
    const handleMouseEnter = (ref) => {
        playSound('sfx', 'hover');
        setIsHovered(true);
        triggerGlitch({
            type: ['displacement', 'noise'],
            target: ref,
            duration: 250,
            strength: 1.5,
            color: '#FF0000',
            easing: 'elastic'
        })
    }
    return (
        <div
            className="group relative hover:cursor-cell h-[90%] w-1/4 border-2 border-primary overflow-hidden"
            ref={moderef}
            onMouseEnter={() => handleMouseEnter(moderef)}
            onClick={() => handleClick()}
        >
            <div
                className="absolute inset-0 z-0 transition-all pulsate duration-300 select-none h-full aspect-video bg-cover -translate-x-100 group-hover:-translate-x-175 brightness-100 group-hover:brightness-25"
                style={{ backgroundImage: `url('${image_url}')` }}
            >
                {name}
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="text-secondary text-center text-xl font-serif">
                    {description}
                </p>
            </div>
            <div className="relative text-primary text-4xl w-full p-1 h-full text-right font-sans flex items-end justify-end">
                {name}
            </div>
        </div>
    )
}

const GameSetupLayout = () => {
    const pvpRef = useRef();
    const trainingRef = useRef();
    const privateRef = useRef();
    const dialogP = useDialog()
    const dialogConnection = useDialog();
    const dialogC = useDialog()
    const { transitionTo } = useNavigation();

    const handleJoinGame = async (type, mode = "STANDARD", privateKey = null) => {
        dialogConnection.open();
        const formData = new FormData();
        formData.append('action', 'join');
        formData.append('type', type);
        formData.append('mode', mode);
        if (privateKey) formData.append('privateKey', privateKey);

        const response = await fetch('/backend/game.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Redirect to game
            dialogConnection.close();
            transitionTo('game');
        } else {
            alert('Error: ' + data.message);
        }
    };
    return (
        <div className="cursor-cell font-mono text-4xl bg-background w-screen h-screen flex items-center flex-col justify-between">
            <DialogPrivate dialog={dialogP} />
            <DialogCorpo dialog={dialogC} />
            <DialogConnection dialog={dialogConnection} />
            <Header />
            {/**Section de choix de type de partie */}
            <h1 className="text-7xl text-primary font-medium font-sans">
                Type de partie
            </h1>
            <div className="flex w-full h-full justify-evenly items-center">
                <GameMode
                    ref={pvpRef}
                    onClick={dialogC.open}
                    name="PVP"
                    image_url={pvpImage}
                    description={'Aidez Votre Corporation préféré en vous battant pour la grande guerre Corporative! Êtes-vous plus Militech ou Arasaka? Kang Tao peut-être?'}
                />
                <GameMode
                    ref={trainingRef}//handleJoinGame("TRAINING")
                    onClick={() => { handleJoinGame("TRAINING") }}
                    name="TRAINING"
                    image_url={trainingImage}

                    description={'Aidez Votre Corporation préféré en vous battant pour la grande guerre Corporative! Êtes-vous plus Militech ou Arasaka? Kang Tao peut-être?'}
                />
                <GameMode
                    ref={privateRef}
                    onClick={dialogP.open}
                    name="PRIVÉE"
                    image_url={privateImage}

                    description={'Aidez Votre Corporation préféré en vous battant pour la grande guerre Corporative! Êtes-vous plus Militech ou Arasaka? Kang Tao peut-être?'}
                />

            </div>
        </div>
    );
}

export default GameSetupLayout;