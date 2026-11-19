import LoginLayout from "./login";
import LobbyLayout from "./lobby/lobby";
import GameLayout from "./game";
import DeckLayout from "./lobby/deck-maker";
import GameSetupLayout from "./game-setup";
import SettingsLayout from "./settings";
import { useNavigation } from "../../hooks/useNavigation";
import DeckEditorLayout from "./deck-editor";
import MapViewerLayout from "./map-viewer";
/**
 * Le layout manager gère les différents layouts pour les interchanger.
 * Il lit le layout actuel depuis NavigationProvider.
 */
const LayoutManager = () => {
  // Lire le layout actuel depuis NavigationProvider
  const { currentLayout } = useNavigation();

  /** Les layouts utilisés dans le jeu */
  const LAYOUTS = {
    login: LoginLayout,
    lobby: LobbyLayout,
    deck: DeckEditorLayout,
    game: GameLayout,
    gameSetup: GameSetupLayout,
    settings: SettingsLayout,
    mapviewer: MapViewerLayout,
  };

  // Obtenir le composant correspondant au layout actuel
  const CurrentLayoutComponent = LAYOUTS[currentLayout];

  // Rendre le layout actuel
  return <CurrentLayoutComponent />;
};

export default LayoutManager;
