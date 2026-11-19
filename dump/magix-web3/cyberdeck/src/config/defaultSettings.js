/**
 * Configuration par défaut pour tous les paramètres du jeu
 * Organisé par catégories correspondant aux sections de l'UI
 */

export const DEFAULT_SETTINGS = {
    // ===== GÉNÉRAL =====
    general: {
        minimap3D: true,
        minimapInteractive: true,
        colorblindMode: false,
        glitchEffects: true,
        primaryColor: 'var(--destructive)', // military
    },

    // ===== AUDIO =====
    // Note: Audio est géré par SoundProvider, ces valeurs sont pour référence/backup
    audio: {
        soundEnabled: true,
        masterVolume: 1.0,
        musicVolume: 1.0,
        sfxVolume: 0.7,
        voiceVolume: 1.0,
    },

    // ===== VIDEO =====
    video: {
        quality: 'high', // 'low', 'medium', 'high', 'ultra'
        resolution: 'auto',
        fullscreen: false,
        vsync: true,
        fps: 60,
    },

    // ===== MULTIPLAYER =====
    multiplayer: {
        showPlayerNames: true,
        voiceChat: true,
        textChat: true,
        crossplay: true,
    },

    // ===== ABOUT/MISC =====
    misc: {
        language: 'fr',
        showTutorials: true,
        autoSave: true,
    }
};

/**
 * Constantes pour les choix de couleurs de thème
 */
export const PRIMARY_COLORS = {
    "military": "var(--destructive)",
    "claires": "var(--secondary)",
    "alt": "var(--accent)"
};

/**
 * Constantes pour les choix de qualité vidéo
 */
export const VIDEO_QUALITY_OPTIONS = ['low', 'medium', 'high', 'ultra'];

/**
 * Constantes pour les résolutions
 */
export const RESOLUTION_OPTIONS = ['auto', '1280x720', '1920x1080', '2560x1440', '3840x2160'];