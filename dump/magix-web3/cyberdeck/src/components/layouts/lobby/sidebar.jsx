import { useNavigation } from "../../../hooks/useNavigation";
import Button from "../../ui/button";

const Sidebar = ({ dialog }) => {
    const { transitionTo } = useNavigation();
    return (
        <div className="flex flex-row h-full ">
            <div className="border-2 border-primary w-64 p-2">
                {/*Sidebar Header */}
                <div className="border-2 border-primary w-full text-secondary p-2 font-sans text-xl">
                    CYBERDECK
                    <span className="font-bold text-success">PRO</span>
                </div>
                {/*Boutons de la Sidebar */}
                {/*TODO: Faire le vrai layout de transition avant */}
                <Button
                    onClick={() => transitionTo('gameSetup')}
                    variant="neomilitarism"
                    className={`container transition-colors duration-300 w-full text-lg hover:text-secondary`}>
                    Jouer
                </Button>
                <Button
                    onClick={() => transitionTo('deck')}
                    variant="neomilitarism"
                    className={`container transition-colors duration-300 w-full text-lg hover:text-secondary`}>
                    Gerer son Deck
                </Button>
                <Button
                    onClick={() => transitionTo('settings')}
                    variant="neomilitarism"
                    className={`container transition-colors duration-300 w-full text-lg hover:text-secondary`}>
                    Paramètres
                </Button>
                <Button variant="neomilitarism" onClick={dialog.open} className={`container transition-colors duration-300 w-full text-lg hover:text-secondary`}>
                    Quitter
                </Button>
            </div>
        </div>
    );
}

export default Sidebar;