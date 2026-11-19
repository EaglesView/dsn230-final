import { APIRequest } from "../../hooks/useGameAPI";
import SurrenderDialog from "../dialogs/surrender-dialog";
import Button from "../ui/button";
import { useDialog } from "../ui/dialog";
import PlayerHealthBar from "./player-health";
/**
 * Le panel gauche du jeu, contient:
 * - La vie du joueur
 * - Nombre de cartes
 * - Le Hero Power (Blackwall Hack pour le joueur, random selon le joueur (sandevistan, blackwall, etc.))
 *
 * Le reste est du flafla.
 * @returns Panel droit du bottom bar du jeu
 */
export const PanelGauche = ({ gameData }) => {
  const dialog = useDialog();
  return (
    <div className=" w-1/6 z-10 py-1 pl-1 max-w-xl angled-tab-left">
      <SurrenderDialog dialog={dialog} />
      <div className="w-full h-full border-2 border-primary/80 bg-background/40 text-primary">
        {/* section qui contient la vie du player, */}
        <div className="w-full flex flex-col p-2 ">
          <div className="flex justify-start w-full pl-4 ">
            {/* Le MP*/}
            <div className="bg-secondary/30 text-secondary absolute -translate-y-10 text-5xl font-bold">
              {gameData?.mp}
            </div>
          </div>
          <PlayerHealthBar cur_h={gameData?.hp} max_h={gameData?.maxHp} />
          <Button className={"w-full pt-6"} onClick={dialog.open}>
            SURRENDER
          </Button>
          <span className="font-bold">
            {gameData?.yourTurn == true ? (
              <span className="text-secondary">VOTRE TOUR</span>
            ) : (
              <span className="text-primary">TOUR DE L'OPPONENT</span>
            )}
          </span>
          <span>
            MERCS :
            {gameData?.remainingCardsCount
              ? gameData?.remainingCardsCount
              : "0"}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Le panel droit du jeu, contient:
 * - Le temps de partie
 * - Le bouton de fin de tour
 * - Le Hero power
 *
 * Le reste est du flafla.
 * @returns Panel droit du bottom bar du jeu
 */
export const PanelDroit = ({ gameData }) => {
  return (
    <div className=" w-1/6 z-10  py-1 pr-1 max-w-xl angled-tab-right">
      <div className="w-full h-full border-2 border-primary/80 bg-background/40 px-2">
        <div className="flex justify-end w-full ">
          {/* Le Timer Absolu*/}
          <div className="bg-primary/30 text-primary absolute -translate-y-10 text-5xl font-bold">
            {gameData?.remainingTurnTime}
          </div>
        </div>
        <Button
          className={"w-full"}
          variant="tech"
          onClick={() => {
            APIRequest({ endpoint: "game", action: "end_turn" });
          }}
        >
          Fin de tour
        </Button>
        {/**TODO: Changer ca pour dequoi de cool */}
        <Button
          className={"w-full"}
          onClick={() => {
            gameData?.heroPowerAlreadyUsed &&
              console.log(
                APIRequest({ endpoint: "game", action: "hero_power" }),
              );
          }}
        >
          BLACKWALL HACK
        </Button>
      </div>
    </div>
  );
};
