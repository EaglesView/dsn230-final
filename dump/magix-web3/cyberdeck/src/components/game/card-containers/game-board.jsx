import { useState } from "react";
import { APIRequest } from "../../../hooks/useGameAPI";
import GameCard from "../card/game-card";

const GameBoard = ({ gameData, setActions }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const selectForAttack = (card) => {
    setSelectedCard(card);
    console.log(`selected ${card.uid}`);
  };
  const attack = (card) => {
    if (selectedCard) {
      const request = {
        endpoint: "game",
        action: "attack",
        params: { uid: selectedCard.uid, targetUid: card.uid },
      };
      console.log("request is", request);
      setActions((prev) => [...prev, request]);
      console.log(`attacking ${card.uid} with ${selectedCard.uid}`);

      setSelectedCard(null);
    }
  };
  return (
    <div className="w-full h-full flex flex-col-reverse justify-between z-50">
      {/** Section du joueur */}
      <div className="w-full flex items-center justify-center gap-2 select-none ">
        {gameData?.board?.map((card) => {
          return (
            <GameCard
              key={card.uid}
              id={card.id}
              cost={card.cost}
              uid={card.uid}
              atk={card.atk}
              hp={card.hp}
              position={"board"}
              mechanics={card.mechanics}
              baseHP={card.baseHP}
              onClick={() => selectForAttack(card)}
              selectedCard={selectedCard?.uid}
            />
          );
        })}
      </div>
      {/**Section de l'opponent */}
      <div className="w-full flex items-center justify-center gap-2 select-none ">
        {gameData?.opponent?.board.map((card) => {
          return (
            <GameCard
              key={card.uid}
              id={card.id}
              cost={card.cost}
              uid={card.uid}
              atk={card.atk}
              hp={card.hp}
              position={"ennemy"}
              mechanics={card.mechanics}
              baseHP={card.baseHP}
              yourTurn={false}
              onClick={() => {
                attack(card);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
