import { useEffect, useRef, useState } from "react";
import { APIRequest } from "../../hooks/useGameAPI";
import GameBoard from "../game/card-containers/game-board";
import { PanelDroit, PanelGauche } from "../game/game-panels";
import PlayerHealthBar from "../game/player-health";
import { useSound } from "../../hooks/useSound";
import PlayerDeck from "../game/card-containers/player-deck";
import Map3D from "../game/map/map";

const GameLayout = () => {
  const [gameState, setGameState] = useState(null);
  const [latestAction, setLatestAction] = useState(null);
  const [actions, setActions] = useState([]);
  const { playSound } = useSound();
  const timerRef = useRef(null);
  useEffect(() => {
    const pollGameState = async () => {
      const formData = new FormData();
      formData.append("action", "state");

      fetch("/backend/game.php", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((response) => {
          timerRef.current = setTimeout(pollGameState, 2000);
          if (response.status === "success") {
            setGameState(response.data);
          }
        });
    };
    timerRef.current = setTimeout(pollGameState, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  useEffect(() => {
    if (gameState?.latestActions) {
      if (
        gameState.latestActions[gameState?.latestActions?.length - 1] !=
        latestAction
      ) {
        setLatestAction(
          gameState.latestActions[gameState.latestActions.length - 1],
        );
        // Animations de jeux lorsque des changements!
        const actionType = latestAction?.action?.type;
        switch (actionType) {
          case "ATTACK":
            console.log(
              `${latestAction.action.targetuid} a été attaqué par ${latestAction.action.uid}`,
            );
            break;
          case "SURRENDER":
          case "PLAY":
          case "HERO_POWER":
            break;
          default:
            break;
          //condition du hero power - le faire pour chaque type de héros
        }
      }
    }

    //Ca fait une seule request par gamestate
    if (actions.length > 0) {
      const response = async () => {
        console.log(actions[actions.length - 1]);
        const response = await APIRequest(actions[actions.length - 1]);
        const newActions = actions.slice(0, -1);
        setActions(newActions);
        return response;
      };
      response()
        .then(() => {
          console.log("response then!");
        })
        .finally(() => {
          console.log("response finally!");
        });
    }

    console.log(gameState);
  }, [latestAction, actions, gameState]);

  return (
    <div className="bg-background w-screen h-screen overscroll-none flex items-center flex-col justify-between">
      {gameState != "LAST_GAME_LOST" ? (
        <>
          {/* Header (avec le deck ennemi)*/}
          <div className="w-full h-24 bg-primary/20 border-b-2 border-primary/80">
            <div className="flex justify-center px-6 items-center">
              <div className="mix-blend-normal flex items-center justify-center w-[90%] max-w-md text-primary text-xl h-full bg-[url('../assets/heroes/default-hero.jpg')] bg-center cut-xxs-br">
                <div className="w-full h-full bg-gradient-to-r from-30% from-background/90 to-background/40 flex items-center flex-col justify-center ">
                  <PlayerHealthBar
                    cur_h={gameState?.opponent?.hp}
                    max_h={gameState?.maxHp}
                  />
                  <div className="flex w-full justify-between items-center">
                    <div className="flex flex-col items-center justify-center w-full">
                      <p className="pt-8">
                        {gameState?.opponent?.username} -{" "}
                        <span className="text-primary">
                          {gameState?.opponent?.heroClass}
                        </span>
                      </p>
                      <p>{gameState?.opponent?.welcomeText}</p>
                    </div>
                    <div className="text-3xl text-primary h-full text-right pr-4 w-full">
                      {gameState?.opponent?.mp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Contenu du jeu */}
          <GameBoard gameData={gameState} setActions={setActions} />
          <div className="absolute w-screen h-screen ">
            {/**Section pour la minimap 3D */}
            <Map3D />
          </div>
          <div className="flex justify-between max-h-48 py-2 gap-2 w-full bg-primary/10 border-t-2 border-primary/80">
            {/*Panel Gauche */}
            <PanelGauche gameData={gameState} />
            {/* Deck du joueur */}
            <PlayerDeck setActions={setActions} gameData={gameState} />
            {/*Panel Droit */}
            <PanelDroit gameData={gameState} />
          </div>
        </>
      ) : gameState == "LAST_GAME_WON" ? (
        <>GAME WON</>
      ) : (
        <>GAME OVER BISH</>
      )}
    </div>
  );
};

export default GameLayout;
