import { useContext, useRef, useState } from "react";
import { GlitchContext } from "../../contexts/GlitchContext";
import fluffQR from "../../assets/fluff/qr2.png";
const PlayingCard = ({
  atk = "99",
  hp = "99",
  id = 0,
  cost = 1,
  uid = 1,
  baseHP = 1,
  mechanics = ["Blabla : Lorem ipsum ipsum dolor es"],
  onClick = () => console.log("implement me, come on!!"),
  location = "hand",
  state = "none",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { triggerGlitch } = useContext(GlitchContext); //bien sur je lajoutes partout!!
  const cardRef = useRef();
  const overlayRef = useRef();

  const handleMouseEnter = () => {
    setIsHovered(true);
    triggerGlitch({
      type: ["block", "displacement", "noise"],
      target: cardRef,
      duration: 250,
      strength: 0.4,
      color: "#FF0000",
      easing: "elastic",
    });
    triggerGlitch({
      type: ["block", "noise", "chromatic"],
      target: overlayRef,
      duration: 300,
      strength: 1.4,
      color: "#FF0000",
      easing: "elastic",
    });
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    triggerGlitch({
      type: ["block", "displacement", "noise"],
      target: cardRef,
      duration: 300,
      strength: 0.4,
      color: "#FF0000",
      easing: "elastic",
    });
  };
  const handleSelect = () => {
    if (isHovered) {
      setTimeout(
        triggerGlitch({
          type: ["block", "displacement", "noise"],
          target: cardRef,
          duration: 300,
          strength: 1.2,
          color: "#FF0000",
          easing: "elastic",
        }),
        100,
      );
    }
    onClick();
  };
  return (
    <div
      ref={cardRef}
      onClick={() => {
        handleSelect();
      }}
      id={`${uid}`}
      className={`card-cut cursor-crosshair  w-[150px] h-[240px] flex items-center justify-center
        ${isHovered && location == "hand" ? "down-card scale-y-110" : "up-card scale-y-100"}
        bg-primary/80 hover:bg-primary
        translate-y-0 active:-translate-y-12
        `}
    >
      <div
        className={`w-[99%] h-[99%] card-cut bg-background/80 px-2 flex flex-col gap-1 items-center
                ${isHovered && location == "hand" ? "down-card-sm scale-y-90" : "up-card-sm scale-y-100"}`}
      >
        <h2 className="text-secondary w-full font-serif font-medium  text-md">
          Titre de la carte
        </h2>
        <div className="w-full h-[1px] bg-secondary" />
        {/* Section des Attributs */}
        <div className="grid w-full  grid-cols-3 gap-2">
          <div className="  border-1 text-[0.6rem] text-primary border-primary">
            {cost && cost}
            {uid && ` - ${uid}`}
          </div>
          <div className="transition-colors duration-500 ease-out card-cut-land w-full h-6 bg-primary/50 hover:bg-primary flex items-center justify-center ">
            <div className="card-cut-land w-[90%] h-[90%] bg-background hover:bg-background/80 ">
              <h3 className="font-serif font-normal text-primary text-sm pl-1">
                ATK+<span className="font-bold">{atk}</span>
              </h3>
            </div>
          </div>
          <div className="transition-colors duration-500 ease-out card-cut-land w-full h-6 bg-legendary/50 hover:bg-legendary flex items-center justify-center">
            <div className="card-cut-land duration-50  w-[90%] h-[90%] bg-background hover:bg-background/80 ">
              <h3 className="font-serif font-normal text-legendary text-sm pl-2">
                HP+<span className="font-bold">{hp}</span>
              </h3>
            </div>
          </div>
        </div>
        {/**Image avec wrapper div pour le glitch*/}
        <div
          className="relative w-full aspect-square border-2 border-primary/80"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            ref={overlayRef}
            src="/public/vite.svg"
            className="w-full aspect-square h-auto"
          />
          {isHovered && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-2">
              <p className="font-serif text-secondary text-sm">
                {mechanics?.map((mechanic, index) => (
                  <span key={index}>{mechanic}</span>
                ))}
              </p>
            </div>
          )}
        </div>
        {/**du flafla de bas de card ici */}
        <div className="h-6 w-full flex gap-2">
          <img
            src={fluffQR}
            className=" aspect-square opacity-50 mix-blend-screen h-full"
          />
          <div className="flex flex-col">
            <p className="text-primary font-serif font-black text-[0.3rem]">
              ARASAKA TECHNOLOGIES{uid && ` - ${uid}`}
            </p>
            <p
              ref={overlayRef}
              className="text-primary font-mono font-black text-[0.5rem]"
            >
              {isHovered
                ? "<0x0E0E17A7> - 0E 0E 17 A7"
                : "<0xF75049FF> - F7 50 49 FF"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayingCard;
