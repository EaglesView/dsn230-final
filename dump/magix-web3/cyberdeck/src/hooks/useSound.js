import { createContext, useContext } from "react";

export const SoundContext = createContext(null);

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within SoundProvider');
    }
    return context;
};