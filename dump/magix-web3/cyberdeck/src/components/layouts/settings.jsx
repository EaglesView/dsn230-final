import { useContext, useEffect, useRef, useState } from "react";
import ThemedLayout from "./themed-layout";
import { GlitchContext } from "../../contexts/GlitchContext";
import Checkbox from "../ui/checkbox";
import Slider from "../ui/slider";
import Selector from "../ui/horizontal-selector";
import { useSettings } from "../../hooks/useSetting";
import { Dialog, useDialog } from "../ui/dialog";
const SectionItem = ({ parameterName, defaultValue, args = {}, actionType = "checkbox", action = () => { console.log("Implement me! im action of settings.jsx") } }) => {
    return (
        <div className="w-full px-2 h-12 border-1 border-primary flex items-center justify-between">
            <p className="text-primary font-serif text-3xl">
                {parameterName}
            </p>
            {actionType == "checkbox" ? (
                <>
                    <Checkbox onCheck={action} defaultValue={defaultValue} />
                </>
            ) : actionType == "slider" ? (
                <>
                    <Slider onChange={action} increment={5} onValueChange={action} onValueCommit={() => { console.log("implement me! im in settings.jsx") }} />
                </>
            ) : actionType == "selector" ? (
                <>
                    <Selector items={Object.keys(args)} defaultIndex={0} onValueChange={action} />
                </>
            ) : (
                <>
                </>
            )}
        </div>
    )
}
const GeneralSection = () => {
    const {
        settings,
        changeThemeColor,
        PRIMARY_COLORS,
        updateSetting,

    } = useSettings();
    const dialog = useDialog();
    // Use case pour le glitch effects:
    // il restart uniquement quand on reload la page, le user doit savoir
    // pour pas penser que cest broken
    const glitchEffects = () => {
        if (settings.general.glitchEffects == false) {
            // yest sur le bord de le réactiver
            if (dialog) {
                dialog.open()
            }
        }
        updateSetting('general', 'glitchEffects', !settings.general.glitchEffects);

    }
    const DialogNotice = ({ dialog }) => {

        return (
            <Dialog
                isOpen={dialog?.isOpen}
                onClose={dialog?.close}
                title="//IMPORTANT"
                type="confirm"
                variant="neomilitarism"
                onConfirm={() => {/** ok */ }}
                confirmText="OK"
            >
                <div>
                    CE PARAMÈTRE SERA EFFECTIF LORS DU RECHARGEMENT DE LA PAGE
                    <div className=" w-full flex justify-between pt-12">
                        <Checkbox defaultValue={false} onCheck={()=>{/**Tu penses que je vais faire mieux que microsoft moi? MWAAHHAHA */}}/>
                        <p>
                            Ne plus afficher ce message
                        </p>
                    </div>
                </div>
            </Dialog>
        )
    }
    return (

        <div className=" w-full p-4 pt-0 h-full flex flex-col items-center justify-center">
            <DialogNotice dialog={dialog}/>
            <h1 className="font-serif font-medium text-primary w-full text-5xl">
                Paramètres généraux
            </h1>

            <div className="w-full h-full border-2 border-primary">
                <SectionItem parameterName={"Effets de Glitch"} actionType="checkbox" defaultValue={settings.general.glitchEffects} action={() => { glitchEffects() }} />

                <SectionItem parameterName={"Minicarte 3D en jeu"} actionType="checkbox" defaultValue={settings.general.minimap3D} action={() => updateSetting('general', 'minimap3D', !settings.general.minimap3D)} />
                <SectionItem parameterName={"Minicarte Interactive pendant le jeu"} defaultValue={settings.general.minimapInteractive} actionType="checkbox" action={() => updateSetting('general', 'minimapInteractive', !settings.general.minimapInteractive)} />
                <SectionItem parameterName={"Slider"} actionType="slider" />
                <SectionItem parameterName={"Couleur de Thème"} actionType="selector" args={PRIMARY_COLORS} action={changeThemeColor} />
            </div>
        </div>
    )
}
const AudioSection = () => {
    const {
        settings,
        updateSetting,
        toggleSound,
        setVolumeMaster,
        setVolumeMusic

    } = useSettings();
    return (
        <div className=" w-full p-4 pt-0 h-full flex flex-col items-center justify-center">
            <h1 className="font-serif font-medium text-primary w-full text-5xl">
                Paramètres Audio
            </h1>

            <div className="w-full h-full border-2 border-primary">
                {/**TODO: Wrapper div pour le son avtivé, pour prouver que ca marche */}
                <SectionItem parameterName={"Son Activé"} actionType="checkbox" defaultValue={settings.audio.soundEnabled} action={() => toggleSound()} />

                <SectionItem parameterName={"Son Général"} actionType="slider" defaultValue={settings.audio.masterVolume} action={(newVolume)=>setVolumeMaster(newVolume)} />
                <SectionItem parameterName={"Son Musique"} actionType="slider" defaultValue={settings.audio.musicVolume} action={(newVolume)=>setVolumeMusic(newVolume)} />
            </div>
        </div>
    )
}
const VideoSection = () => {
    const {
        settings,
        updateSetting,
    } = useSettings();
    return (
        <div className=" w-full h-full flex items-center justify-center">
            SETTINGS
        </div>
    )
}
const MultiplayerSection = () => {
    const {
        settings,
        updateSetting,
    } = useSettings();
    return (
        <div className=" w-full h-full flex items-center justify-center">
            SETTINGS
        </div>
    )
}
const AboutSection = () => {

    const {
        settings,
        updateSetting,
    } = useSettings();
    return (
        <div className=" w-full h-full flex items-center justify-center">
            SETTINGS
        </div>
    )
}
const SettingsLayout = () => {

    const LAYOUTS = [GeneralSection, AudioSection, VideoSection, MultiplayerSection, AboutSection];
    const sectionRef = useRef();
    const [currentSection, setCurrentSection] = useState(0);
    const { triggerGlitch } = useContext(GlitchContext);
    const ORDER = ["general", "audio", "video", "multiplayer", "about"];


    useEffect(() => {
        switch (currentSection) {
            case 0:     //general

                break;
            case 1:     //audio

                break;
            case 2:     //video

                break;
            case 3:     //multiplayer

                break;
            case 4:     //about

                break;
        }
    }, [currentSection])

    const changeSection = (direction) => {
        triggerGlitch({
            type: ['rgbsplit', 'chromatic', 'displacement'],
            target: sectionRef,
            duration: 250,
            strength: 0.5
        });
        if (direction == "left") {
            if (currentSection == 0) {

                setCurrentSection(4)
            } else {
                setCurrentSection((currentSection - 1));
            }
        } else if (direction == "right") {
            if (currentSection == ORDER.length - 1) {
                setCurrentSection(0)
            } else {
                setCurrentSection((currentSection + 1))
            }
        }
    }
    let CurrentLayout = LAYOUTS[currentSection]

    return (
        <ThemedLayout >
            <p className="text-5xl w-full pl-4 text-primary font-sans">
                SETTINGS
            </p>
            <div className="w-full h-full  p-4">
                <div className="absolute select-none w-full h-12 left-0 -translate-y-3 flex items-center justify-center">
                    <div className=" w-[450px] h-12 select-all flex items-center justify-between">
                        <a
                            onClick={() => changeSection("left")}
                            className="cursor-crosshair bg-[url('/src/assets/icons/arrow-narrow-left-svgrepo-com.svg')] w-12 h-12 bg-contain invert-50 hover:invert">

                        </a>
                        <a
                            onClick={() => changeSection("right")}
                            className="cursor-crosshair bg-[url('/src/assets/icons/arrow-narrow-right-svgrepo-com.svg')] w-12 h-12 bg-contain invert-50 hover:invert">

                        </a>
                    </div>

                </div>
                <section
                    ref={sectionRef}
                    className="w-full z-10 h-full border-2 border-primary bg-primary/5 cut-top-bevld">
                    <CurrentLayout />
                </section>
            </div>
        </ThemedLayout>
    );
}

export default SettingsLayout;