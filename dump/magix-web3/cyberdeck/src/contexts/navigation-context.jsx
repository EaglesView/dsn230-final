import { useContext, useState, useEffect } from "react";
import { GlitchContext } from "./GlitchContext";
import { useSound } from "../hooks/useSound";
import { useNavigation, NavigationContext } from "../hooks/useNavigation";
import { APIRequestRAW } from "../hooks/useGameAPI";

/**
 * Provider pour la navigation entre layouts
 * @param {Object} props
 * @param {Object} props.initialSession - Session initiale depuis PHP
 * @param {React.ReactNode} props.children
 */
export const NavigationProvider = ({ children, initialSession = null }) => {
  const { triggerGlitch } = useContext(GlitchContext);

  // State pour le layout actuel
  const [currentLayout, setCurrentLayout] = useState(
    initialSession ? "lobby" : "login",
  );
  // State pour les données utilisateur
  const [userData, setUserData] = useState(initialSession);
  const { playSound } = useSound();
  // Durée par défaut des transitions
  const transitionDuration = 1500;

  // Réagir aux changements de session
  useEffect(() => {
    const checkSessionValidity = async () => {
      await APIRequestRAW({
        endpoint: "check-key",
        params: { key: userData.key },
      }).then((response) => {
        if (response != "VALID_KEY") {
          setUserData(null);
          setCurrentLayout("login");
        }
      });
    };
    checkSessionValidity();
  }, [currentLayout, userData]);

  /**
   * Fonction de transition entre layouts
   * @param {string} targetLayout - Le layout cible ('login', 'lobby', 'game')
   * @param {Object} params - Paramètres de transition
   * @param {boolean} params.withGlitch - Activer l'effet glitch (défaut: true)
   * @param {string|string[]} params.glitchType - Type(s) d'effet glitch
   * @param {number} params.duration - Durée personnalisée (défaut: 1500ms)
   */
  const transitionTo = (targetLayout, params = {}) => {
    const {
      withGlitch = true,
      glitchType = ["noise", "block"],
      duration = transitionDuration,
    } = params;
    playSound("sfx", "transition");
    if (withGlitch) {
      triggerGlitch({
        type: glitchType,
        duration: duration,
        strength: 0.85,
        color: "#FFFFFF",
        easing: "easeInOut",
      });

      setTimeout(() => setCurrentLayout(targetLayout), duration);
    } else {
      setCurrentLayout(targetLayout);
    }
  };

  /**
   * Mettre à jour les données utilisateur (après login)
   * @param {Object} newData - Nouvelles données utilisateur
   */
  const updateUserData = (newData) => {
    setUserData(newData);
  };

  /**
   * Effacer les données utilisateur (logout)
   */
  const clearUserData = () => {
    setUserData(null);
  };

  // Valeur du contexte exposée aux composants
  const navigationValue = {
    currentLayout,
    userData,
    transitionTo,
    updateUserData,
    clearUserData,
  };

  return (
    <NavigationContext.Provider value={navigationValue}>
      {children}
    </NavigationContext.Provider>
  );
};
