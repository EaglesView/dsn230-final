import { useContext, useEffect, useRef, useState } from "react";
import cardListData from "../../../assets/data/card-list.json";
import StatItem from "./stat-item";
import { GlitchContext } from "../../../contexts/GlitchContext";
import { React } from "react";
import { PRIMARY } from "../../../utils/utils";
const GameCard = ({
  position = "hand",
  atk = "99",
  hp = "99",
  id = 0,
  uid = 1,
  cost = 1,
  mechanics = ["Lorem:Ipsum dolor es"],
  onClick = () => console.log("implement the onClick of the card!"),
  selectedCard = null,
  yourTurn = true, //to keep the cards up by default
}) => {
  /**
   * Une carte du jeu Cyberdeck.
   * Cette carte comporte plusieurs états:
   * - Position : La position de la carte dans le jeu
   *      - "hand" : carte dans la main du joueur
   *      - "board": carte dans le board de jeu
   *      - "presentation": carte sans actions
   * - stats de carte (atk,hp,cost)
   *
   * Layout:
   * - Les stats sont en haut complètement
   */
  const [isHovered, setIsHovered] = useState(false);
  const hoverGlitchRef = useRef();
  const [mouseDown, setMouseDown] = useState(false);
  const [health, setHealth] = useState(0);
  const [animate, setAnimate] = useState(false); //workaround a cause de toute la cochonnerie de mon code
  const { triggerGlitch } = useContext(GlitchContext);
  const prevTurnRef = useRef(yourTurn);
  const cardData = cardListData[uid.toString()];
  //ca skip les optimisations de vite mais jai 109 cartes a gérer!!
  const imagePath = `/src/assets/cards/${cardData.image_url.split("/").pop()}`;
  const TRANSITION_DURATION = 200;

  useEffect(() => {
    if (prevTurnRef.current !== yourTurn) {
      setAnimate(true);
      const timer = setTimeout(() => {
        setAnimate(false);
      }, 2000);
      prevTurnRef.current = yourTurn;
      return () => {};
    }
    if (health != hp) {
      setHealth(hp);
      triggerGlitch({
        type: ["block", "displacement", "noise"],
        target: hoverGlitchRef,
        duration: 500,
        strength: 1.4,
        color: PRIMARY,
        easing: "elastic",
      });
    }
  }, [yourTurn, health, triggerGlitch, hp]);
  useEffect(() => {}, [mouseDown, selectedCard]);
  const handleMouseEnter = () => {
    if (position != "hand") return;
    if (!yourTurn) return;
    setIsHovered(true);
    triggerGlitch({
      type: ["block", "chromatic", "pixelation"],
      target: hoverGlitchRef,
      pixelSize: 8.0,
      phosphorSize: 3.0, // Size of phosphor dots (1-10)
      phosphorSpacing: 1.2, // Spacing between dots (0.5-2.0)
      bloomIntensity: 0.6, // Glow around phosphors (0-1)
      scanlineInteraction: 0.8, // Scanline brightness boost (0-1)
      colorBleeding: 0.3,
      duration: 300,
      color: PRIMARY,
    });
  };
  const handleMouseLeave = () => {
    if (position != "hand") return;
    setIsHovered(false);
    triggerGlitch({
      type: ["block", "chromatic"],
      target: hoverGlitchRef,
      phosphorSize: 10.0, // Size of phosphor dots (1-10)
      phosphorSpacing: 0.5, // Spacing between dots (0.5-2.0)
      bloomIntensity: 0.6, // Glow around phosphors (0-1)
      scanlineInteraction: 0.8, // Scanline brightness boost (0-1)
      colorBleeding: 0.3,
      duration: 100,
      color: PRIMARY,
    });
  };
  const handleMouseDown = () => {
    if (position != "hand") return;
    if (!yourTurn) return;
    setMouseDown(true);
    triggerGlitch({
      type: ["block", "vhs"],
      target: hoverGlitchRef,
      noiseIntensity: 0.9,
      duration: 1000,
      color: PRIMARY,
    });
  };
  const handleMouseUp = () => {
    if (!yourTurn) return;
    if (position != "hand") return;
    setMouseDown(false);
  };
  const handleClick = () => {
    console.log(position);
    switch (position) {
      case "board":
        triggerGlitch({
          type: ["chromatic", "pixelation"],
          target: hoverGlitchRef,
          noiseIntensity: 0.9,
          pixelSize: 8.0,
          duration: 100,
          color: PRIMARY,
        });
        onClick();
        break;

      case "ennemy":
        triggerGlitch({
          type: ["chromatic", "noise", "block"],
          target: hoverGlitchRef,
          noiseIntensity: 0.9,
          duration: 100,
          color: PRIMARY,
        });
        onClick();
        break;

      case "hand":
        triggerGlitch({
          type: ["chromatic", "pixelation"],
          target: hoverGlitchRef,
          noiseIntensity: 0.9,
          pixelSize: 8.0,
          duration: 2000,
          color: PRIMARY,
        });
        onClick();
        break;
    }
  };
  return (
    <div
      id={`${uid}`}
      className={`
      w-[200px] 3xl:w-[300px] h-[300px] drop-shadow-xl
      ${selectedCard == uid && " drop-shadow-primary"}
      ${mechanics.includes("Taunt") && "drop-shadow-legendary"}
      ${yourTurn ? "up-card" : position == "ennemy" ? "default-card" : "down-card"}
      ${animate ? "animate-up-card" : "animate-down-card"}
      ${isHovered ? "z-10" : "z-0"}
      `}
    >
      <div
        className={`
          card-cut w-full h-full
          3xl:h-[450px] transition-all duration-50 ease-in-out
          bg-gradient-to-br from-15% from-primary to-90% hover:to-95% to-primary/10 hover:to-primary/40
          flex items-center justify-center
          translate-3d   ${yourTurn && "has-hover:rotate-x-0 has-hover:rotate-y-0 has-hover:translate-y-0"} rotate-x-30 rotate-y-15  translate-y-10 perspective-near

          `}
      >
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          ref={hoverGlitchRef}
          className={`card-cut w-[98%] h-[98%] transition-transform duration-500 select-none ease-initial bg-background/90 ${position == "ennemy" ? "" : "group"}  flex ${position == "hand" ? "flex-col" : "flex-col-reverse"} items-center justify-between active:-translate-z-2`}
        >
          {/** Section pour ATK et HP */}
          <div
            className={`
              w-full ${position == "hand" ? "h-6" : "h-18"}
              transition-all duration-${TRANSITION_DURATION}
              group-hover:text-secondary group-hover:text-shadow-lg
              text-shadow-secondary/20 group-hover:fill-secondary
              gap-1 flex items-center justify-between
              `}
          >
            <StatItem
              iconSrc="/src/assets/icons/bro-fist-svgrepo-com.svg"
              transition_duration={TRANSITION_DURATION}
              typeOf="atk"
              position={position}
              value={atk}
            />
            <StatItem
              iconSrc="/src/assets/icons/health-filled-svgrepo-com.svg"
              transition_duration={TRANSITION_DURATION}
              typeOf="health"
              position={position}
              value={hp}
            />
          </div>
          <div className="relative w-full h-full">
            <div
              className={`
                ${position == "hand" ? "text-[1.5rem]" : "text-[2.2rem]"} transition-all duration-300
                font-serif font-black text-secondary/75 group-hover:bg-background/80  group-hover:text-primary group-hover:text-shadow-lg text-shadow-secondary/10
                `}
            >
              {position == "hand" ? (
                <div className="bg-primary/50  group-hover:bg-transparent  w-full h-14 group-hover:backdrop-blur-sm text-secondary group-hover:text-primary flex items-center justify-between px-1">
                  <p>{cost}</p>
                  <p>{cardData?.name}</p>
                </div>
              ) : (
                cardData?.name
              )}
              <div />

              <div
                style={{ backgroundImage: `url("${imagePath}")` }}
                className={`transition-all duration-200 cubic absolute bg-cover flex scale-100 group-hover:scale-150 -z-10 w-full h-full inset-0`}
              >
                <div
                  className={`transition-all duration-[${TRANSITION_DURATION}]  group-hover:opacity-100 opacity-0 relative w-full h-full translate-y-20 group-active:translate-y-0`}
                >
                  {isHovered & (mouseDown == false) & (position == "hand") && (
                    <div
                      className={`flex transition-all duration-[${TRANSITION_DURATION}] items-start justify-center w-full h-full bg-background/50 group-active:bg-background/75 opacity-0 group-hover:opacity-100 z-0`}
                    >
                      <p className="absolute w-full transition-all ease-in-out duration-500 scale-100 group-hover:scale-[50%] font-serif text-secondary font-bold">
                        {mechanics}
                      </p>
                    </div>
                  )}
                  {mouseDown & (position == "hand") && (
                    <p className="absolute w-full h-full text-center flex items-center justify-center font-serif text-primary text-4xl font-bold">
                      PLAY
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
