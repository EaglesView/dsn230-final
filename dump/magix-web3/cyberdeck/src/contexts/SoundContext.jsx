import { useEffect, useRef, useState } from "react";

/** ====== AUDIO IMPORTS ======= */
import selectSound from '../assets/sounds/sfx/select.mp3';
import gameSelectedSound from '../assets/sounds/sfx/game-selected.mp3';
import healSound from '../assets/sounds/sfx/heal.mp3';
import closeDialogSound from '../assets/sounds/sfx/close-dialog.mp3';
import transitionSound from '../assets/sounds/sfx/transition.mp3';
import hoverSound from '../assets/sounds/sfx/hover-item.wav'
import transitionAltSound from '../assets/sounds/sfx/transition.wav'
import sliderTick from '../assets/sounds/sfx/slidertick.wav'
/**==MUSIC== */
import placeholderMusic from '../assets/sounds/music/palceolder.mp3';
import {useSound,SoundContext} from '../hooks/useSound.js';

const VOL_SFX=0.7;
const VOL_MUSIC=0.3;


export const SoundProvider = ({ children }) => {
    //refs
    const audioRefs = useRef();
    const currentMusicRef = useRef(null);
    const previousVolumesRef = useRef({});

    //states
    const [isReady, setIsReady] = useState(false);
    const [muted, setMuted] = useState(false);
    const [masterVolume, setMasterVolumeState] = useState(1);
    const [musicVolumeState, setMusicVolumeState] = useState(1);
    const [currentTrack, setCurrentTrack] = useState(false);

    /**
     * pré-Initialise les chansons et les sons du jeu avec des Audio objects
     * Je place un commentaire pour ce init pour le SEO maxxing quand j'oublies ou mettre les sons
     * audio new audio 2025 how to place audio in cyberdeck howto js
     * @returns la liste de chansons et de sons du jeu
     */
    const initSoundTrackList = () => {
        return {
            sfx: {
                select: new Audio(selectSound),
                gameSelected: new Audio(gameSelectedSound),
                heal: new Audio(healSound),
                closeDialog: new Audio(closeDialogSound),
                transition: new Audio(transitionSound),
                transitionAlt: new Audio(transitionAltSound),
                hover: new Audio(hoverSound),
                tick:new Audio(sliderTick)
            },
            music: {
                placeholder: new Audio(placeholderMusic)
            }
        };
    }

    /** fonctions du provider */
    const playSound = (category, soundName, options = {}) => {
        if (!isReady) return;

        const audio = audioRefs.current[category]?.[soundName];
        if (!audio) {
            console.warn(`yooo jai une banane dans l'oreille(jentends pas): ${category}/${soundName}`);
            return;
        }

        if (muted) return; 
        audio.pause()//au cas ou tu spam le son
        audio.currentTime = 0;

        const volumeMultiplier = options.volume ?? 1; //applique un volume si cest dans les options
        audio.volume = (category === 'sfx' ? VOL_SFX : VOL_MUSIC) * masterVolume * volumeMultiplier;
        audio.play().catch(err => {
            console.warn('Erreur de Lecture:', err);
        });
    };
    /**
     * 
     * @param {trackName} trackName le string du nom du audio ()
     * @returns 
     */
    const playMusic = (trackName) => {
        if (!isReady) return;

        // arrete la musique qui joue live en premier
        if (currentMusicRef.current) {
            currentMusicRef.current.pause();
            currentMusicRef.current.currentTime = 0;
        }

        const audio = audioRefs.current.music?.[trackName];
        if (!audio) {
            console.warn(`Chanson pas trouvé?: ${trackName}`);
            return;
        }
        audio.volume = muted ? 0 : VOL_MUSIC * masterVolume;
        audio.play().catch(err => {
            console.warn('Erreur de Lecture:', err);
        });

        currentMusicRef.current = audio;
        setCurrentTrack(trackName);
    };
    /**
     * Arrête la track en cours.
     * pourrais mettre un paramètre de fade mais je n'ai pas de musique dans le jeu encore
     * 
     * @returns pas de musique.
     */
    //TODO: "Rajoute des chansons pour essayer de coder le fade"
    const stopMusic = () => {
        if (!currentMusicRef.current) return;


        currentMusicRef.current.pause();
        currentMusicRef.current.currentTime = 0;

        currentMusicRef.current = null;
        setCurrentTrack(null);
    };
    const setMusicVolume = (newVolume) => {
        console.log('volume set to ', newVolume);
        setMusicVolumeState(newVolume);
    }
    const setMasterVolume = (newVolume) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setMasterVolumeState(clampedVolume);
        console.log(`on update a ${clampedVolume}`)
        // update tout les sons avec leur ref (const pour linstant, modifiables par apres)
        Object.values(audioRefs.current.sfx || {}).forEach(audio => {
            audio.volume = VOL_SFX * clampedVolume;
        });
        Object.values(audioRefs.current.music || {}).forEach(audio => {
            audio.volume = VOL_MUSIC * clampedVolume;
        });
    };
    const toggleMute = () => {
        setMuted(prev => {
            const newMuted = !prev;
            console.log("MUTING!!")
            if (newMuted) {
                // Mute - store les values avant, et les mets a 0
                previousVolumesRef.current.sfx = {};
                previousVolumesRef.current.music = {};

                Object.entries(audioRefs.current.sfx || {}).forEach(([key, audio]) => {
                    previousVolumesRef.current.sfx[key] = audio.volume;
                    audio.volume = 0;
                });
                Object.entries(audioRefs.current.music || {}).forEach(([key, audio]) => {
                    previousVolumesRef.current.music[key] = audio.volume;
                    audio.volume = 0;
                });
            } else {
                // Unmute - remets les volumes sauvegardés
                Object.entries(audioRefs.current.sfx || {}).forEach(([key, audio]) => {
                    audio.volume = previousVolumesRef.current.sfx?.[key] ?? VOL_SFX * masterVolume;
                });
                Object.entries(audioRefs.current.music || {}).forEach(([key, audio]) => {
                    audio.volume = previousVolumesRef.current.music?.[key] ?? VOL_MUSIC * masterVolume;
                });
            }

            return newMuted;
        });
    };
    const value = {
        playSound,
        playMusic,
        stopMusic,
        musicVolumeState,
        setMasterVolume,
        setMusicVolume,
        toggleMute,
        muted,
        masterVolume,
        currentTrack,
        isReady
    };
    //ajout des refs au mount du component dans App
    useEffect(() => {
        audioRefs.current = initSoundTrackList()
        //configurer chaque mp3
        Object.values(audioRefs.current.sfx).forEach(audio => {
            audio.volume = VOL_SFX;
            audio.preload = 'auto';
        });
        Object.values(audioRefs.current.music).forEach(audio => {
            audio.volume = VOL_MUSIC;
            audio.loop = true;
            audio.preload = 'auto';
        });
        setIsReady(true);
        //cleanup useEffect
        return () => {
            Object.values(audioRefs.current.sfx).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            Object.values(audioRefs.current.music).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
        };
    }, [])
    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    )
};
// "on peu pu rien dire en 2025 sans mettre du eslint-disable-next-line partout" -Jean-Marc Bouchard, 2025
//update: jai mis useSound dans un hook a part, merci eslint tas gagné
