import GameCard from "../card/game-card";

const PlayerDeck = ({ gameData, setActions }) => {
  const playCard = (card) => {
    const request = {
      endpoint: "game",
      action: "play",
      params: { uid: card.uid },
    };
    setActions((prev) => [...prev, request]);
    setTimeout(() => {}, 300);
  };
  const getContainerClasses = (count) => {
    if (count <= 3) return "gap-4 ";
    if (count === 4) return "gap-2 ";
    if (count === 5) return "gap-1 ";
    if (count === 6) return "-space-x-4";
    return "-space-x-8"; // 7+ cards
  };
  return (
    <div
      className={`
         flex w-full absolute justify-center items-center
         ${getContainerClasses(gameData?.hand?.length)}
         `}
    >
      {gameData?.hand?.map((card) => {
        return (
          <GameCard
            key={card.uid}
            id={card.id}
            cost={card.cost}
            uid={card.uid}
            atk={card.atk}
            hp={card.hp}
            position="hand"
            mechanics={card.mechanics}
            baseHP={card.baseHP}
            yourTurn={gameData?.yourTurn}
            onClick={() => {
              playCard(card);
            }}
          />
        );
      })}
    </div>
  );
};
export default PlayerDeck;
