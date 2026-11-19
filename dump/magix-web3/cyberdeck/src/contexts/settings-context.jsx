import { useState, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '../config/defaultSettings';
import { useSound } from '../hooks/useSound';
import { SettingsContext } from "../hooks/useSetting";
/**
 * Provider pour les settings du jeu
 * Permet aux components qui en ont de besoin de l'utiliser
 * Permet aussi d'update en temps reel certaines choses dans avoir a utiliser ses valeurs ici
 * (ex:primary color)
 * @param {*} param0 
 * @returns 
 */
export const SettingsProvider = ({ children }) => {
    // Variables de bases (Constantes)
    const PRIMARY_COLORS = {
        "military": "var(--destructive)",
        "claires": "var(--secondary)",
        "alt": "var(--accent)"
    };
    // le useState principal des settings
    const [settings, setSettings] = useState(() => {
        // Initialize from localStorage or use defaults
        const saved = localStorage.getItem('gameSettings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });
    const {setMusicVolume,setMasterVolume,toggleMute} = useSound();
    // Save dans le localstorage quand un setting change
    useEffect(() => {
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }, [settings]);

    // Utilisation de useEffect a chaque changements différents de catégorie
    useEffect(() => {
        document.documentElement.style.setProperty('--primary', settings.general.primaryColor);

    }, [settings.general]);


    //Fonctions
    //Général
    const updateSetting = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: { ...prev[category], [key]: value }
        }));
    };
    const changeThemeColor = (color) => {
        document.documentElement.style.setProperty('--primary', PRIMARY_COLORS[color]);
    };
    const checkForSavedThemeColor = () => {
        const savedColor = localStorage.getItem('primaryColor');
        if (savedColor) {
            settings.general.themeColor = savedColor;
        }
    };
    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };
    const toggleColorblindMode = () => {
        updateSetting('general', !settings.general.colorblindMode);
    };

    const toggleMinimap3D = () => {
        updateSetting('general','minimap3D', !settings.general.minimap3D);
    };
    const toggleMinimapActions = () => {
        updateSetting('general','minimapInteractive', !settings.general.minimapInteractive);
    };
    const toggleGlitchEffects = () => {
    };
    // Audio
    const toggleSound = () => {
        updateSetting('audio','soundEnabled', !settings.audio.soundEnabled);
        toggleMute();
    };
    const setVolumeMaster = (newVolume) => {
        updateSetting('audio','masterVolume', newVolume); //audio accepte entre 0 et 1
        setMasterVolume((parseFloat(newVolume) / 100));
    };
    const setVolumeMusic = (newVolume) => {
        updateSetting('audio','musicVolume', newVolume);
        setMusicVolume((parseFloat(newVolume) / 100));
    };
    const setVolumeSfx = (newVolume) => {
        updateSetting('audio','sfxVolume', newVolume);

    }


    return (
        <SettingsContext.Provider value={{
            //States
            settings,
            updateSetting,
            //foncitons
            toggleMinimap3D,
            toggleMinimapActions,
            toggleGlitchEffects,
            toggleSound,
            resetSettings,
            changeThemeColor,
            checkForSavedThemeColor,
            setVolumeMaster,
            setVolumeMusic,
            setVolumeSfx,
            toggleColorblindMode,
            //constantes

            PRIMARY_COLORS,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

