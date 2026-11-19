import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Header from "./components/game/header";
import LoginForm from "./components/game/login-form";
import { GlitchProvider } from "./contexts/GlitchContext";
import LayoutManager from "./components/layouts/layout-manager";
import { NavigationProvider } from "./contexts/navigation-context";
import { SoundProvider } from "./contexts/SoundContext";
import { SettingsProvider } from "./contexts/settings-context";

function App() {
  const [sessionData, setSessionData] = useState(null); //pour la session php
  const [isCheckingSession, setIsCheckingSession] = useState(true); //pour le useEffect

  //Vérifier la connection PHP:
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:8000/session.php", {
          credentials: "include",
        });
        const data = await response.json();

        console.log("Session check response:", data); // Debug

        //on devrais y voir {isLoggedIn,username,visibility,key}
        if (data.isLoggedIn) {
          setSessionData({
            username: data.username,
            visibility: data.visibility,
            key: data.key,
          });
        } else {
          //TODO: Dialog derreur?
          console.log("AYOOOOYEEE PAS BON");
        }
      } catch (e) {
        console.error(`Erreur de check de session: `, e);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);
  if (isCheckingSession) {
    //TODO: Faire dequoi de nice ici, pt un component
    return <div> Verification en cours</div>;
  }

  return (
    <SoundProvider>
      <SettingsProvider>
        <GlitchProvider>
          <NavigationProvider initialSession={sessionData}>
            <LayoutManager />
          </NavigationProvider>
        </GlitchProvider>
      </SettingsProvider>
    </SoundProvider>
  );
}

export default App;
