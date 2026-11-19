import { useContext, useEffect, useRef } from "react";
import { Dialog, useDialog } from "../ui/dialog";
import ThemedLayout from "./themed-layout";
import { useState } from "react";
import { APIRequestRAW } from "../../hooks/useGameAPI";
import { useNavigation } from "../../hooks/useNavigation";
import cardListData from "../../assets/data/card-list.json";
import corpoGangList from "../../assets/data/corpo.json";
import { GlitchContext } from "../../contexts/GlitchContext";
import { PRIMARY } from "../../utils/utils";
import Button from "../ui/button";
import Selector from "../ui/horizontal-selector";
/**
 * Est en réalité un corpo dialog, mais
 * pour la compréhension avec le prof vu que je changes le naming de beaucoup
 * d'éléments.
 */
const ClassDialog = ({ dialog }) => {
  return (
    <Dialog
      isOpen={dialog.isOpen}
      onClose={dialog.close}
      title="CHANGER DE GROUPE"
      type="custom"
      variant="neomilitarism"
      onConfirm={() => {}}
    >
      ICI SERA UNE LISTE DE CORPOS
    </Dialog>
  );
};
const CardInfoDialog = ({ dialog, cardData, mercData }) => {
  return (
    <Dialog
      isOpen={dialog.isOpen}
      onClose={dialog.close}
      title={`${mercData.name} - Fiche Détaillée`}
      type="custom"
      variant="neomilitarism"
      onConfirm={() => {}}
    >
      <div className="flex">
        <img
          src={`src/${mercData.image_url}`}
          className="h-full max-h-[500px] aspect-auto"
        />

        <div className="max-w-4xl text-2xl px-4">
          <h2 className="text-4xl font-bold pb-8">#--{mercData.name}--#</h2>
          <p>{mercData.description}</p>
          <h3 className={`font-bold `}>#--Forces / faiblesses--#</h3>
          <p className="font-bold">
            ATK:<span className="text-secondary pl-2">{cardData.atk}</span>
          </p>
          <p className="font-bold">
            HP:<span className="text-secondary pl-2">{cardData.hp}</span>
          </p>
          <p className="font-bold text-3xl">
            #--Abilities--#
            <span>
              {cardData.mechanics.length > 0 ? (
                cardData.mechanics.map((mechanic, index) => {
                  return (
                    <p className="font-bold text-2xl" key={index}>
                      {index} :
                      <span className="font-normal text-secondary pl-2">
                        {mechanic}
                      </span>
                    </p>
                  );
                })
              ) : (
                <p className={`font-bold`}>NONE</p>
              )}
            </span>
          </p>
        </div>
      </div>
      <div className="w-full flex bg-primary/10 h-12 justify-between px-6 items-center">
        <p>AJOUTER AU DECK</p>
        <div className="h-full">
          <Selector
            className="h-full "
            defaultIndex={0}
            items={[...Array(30).keys()]}
          />
        </div>
      </div>
    </Dialog>
  );
};

/** Un merc a engager */
const MercForHire = ({
  cardData,
  mercData = { name: "Hubert Lenoir", image_url: "/" },
}) => {
  const mercRef = useRef();
  const { triggerGlitch } = useContext(GlitchContext);
  const dialog = useDialog();
  const handleHover = () => {
    triggerGlitch({
      type: ["displacement", "noise"],
      target: mercRef,
      duration: 250,
      strength: 1.5,
      color: "#FF0000",
      easing: "elastic",
    });
  };
  const handleClick = () => {};
  const handleMouseUp = () => {
    triggerGlitch({
      type: ["block", "chromatic", "noise"],
      target: mercRef,
      duration: 200,
      strength: 3.0,
      color: PRIMARY,
      easing: "elastic",
    });
  };
  return (
    <div
      ref={mercRef}
      className={`w-64 h-64 border-2 border-primary `}
      onClick={handleClick}
      onMouseEnter={handleHover}
      onMouseUp={() => {}}
      id={mercData.id}
    >
      <CardInfoDialog dialog={dialog} mercData={mercData} cardData={cardData} />
      <div
        style={{ backgroundImage: `url("src/${mercData.image_url}")` }}
        className={`w-full h-full bg-cover  text-primary flex flex-col items-start justify-start`}
      >
        <div className="transition-all group p-1 duration-150 ease-out w-full h-full bg-transparent hover:bg-background/80 font-serif text-2xl flex flex-col justify-between font-medium">
          <p className="select-none font-bold text-3xl w-full bg-background p-1">
            {mercData.name}
          </p>
          <p className="opacity-0 group-hover:opacity-100 flex flex-col items-between justify-between   w-full gap-2">
            {cardData?.mechanics.map((mec, i) => {
              return (
                <span key={i} className="select-none">
                  {mec}
                </span>
              );
            })}
          </p>
          <Button onClick={dialog.open}>See More</Button>
        </div>
      </div>
    </div>
  );
};

/** Un component pour choisir le groupe qu'on veut etre dedans */
const GangCorpoSelector = () => {};
/**
 * Doit contenir
 * - Peut changer le héros (class, corpo/gang)
 * - Peut changer le talent (microchip)
 * - Peut changer les cartes:
 *  - Peut contenir plusieurs cartes avec le même ID
 *  - Rechercher des cartes serait intéressant
 *  - Montre les stats des cartes (mercs).
 *
 * ## La section Mercs for Hire:
 * La section contient les cartes que le joueur peut avoir.
 * Elle sera séparé en 10 sections comme le prof à fait.
 * Vu que j'ai un JSON séparé il me restera a ajouter la catégorie
 * dans laquelle la carte se trouve, et faire un component pour les
 * infos du merc (carte).
 *
 * ## La section Corpo:
 * Une bannière custom a l'effigie du groupe sera placé dans le haut de la page.
 * Un bouton pour changer de groupe/corpo sera possible, et triggera un dialog
 * de sélection.
 *
 * ## La section Talents (Microchips):
 * - le user pourra choisir entre les 6 talents possible.
 *
 * @returns
 */
const DeckEditorLayout = () => {
  const { userData } = useNavigation();
  const [deckData, setDeckData] = useState(null);
  const [userDeckData, setUserDeckData] = useState(null);
  const dialog = useDialog();
  const mercData = cardListData;
  const corpos = corpoGangList;
  useEffect(() => {
    const getDeckData = async () => {
      await APIRequestRAW({
        endpoint: "deck-data",
        params: { key: userData.key },
      }).then((response) => {
        setDeckData(response);
      });
    };
    const getUserDeckData = async () => {
      await APIRequestRAW({
        endpoint: "users/deck",
        params: { key: userData.key },
      }).then((response) => {
        setUserDeckData(response);
      });
    };
    getDeckData();
    getUserDeckData();
    return () => {};
  }, [userData.key]);
  useEffect(() => {}, [setDeckData]);
  const saveDeck = async () => {
    await APIRequestRAW({
      endpoint: "users/deck/save",
      params: { key: userData?.key },
    }).then((response) => {
      if (response == "DECK_SAVED") {
        //afficher un toast peut être? ou un dialog de succès!!
        console.log(`saved with success!!`);
      }
    });
  };
  /** Devrais simplement refetch le deck du joueur et le réafficher. */
  const resetChanges = () => {};
  return (
    <ThemedLayout>
      <ClassDialog dialog={dialog} />
      <div className="w-full h-full flex flex-col">
        <p className="text-secondary">
          CURRENT CORPO/GANG: <span className="text-primary">ARASAKA</span>
        </p>
        <h1>MERCS FOR HIRE</h1>
        <div className="w-full flex flex-wrap justify-evenly gap-5 border-2 border-primary overflow-y-scroll h-1/2">
          {deckData?.cards.map((card, index) => {
            if (index == 0) return;
            return (
              <MercForHire
                key={index}
                cardData={card}
                mercData={mercData[index]}
                deckData={deckData}
              />
            );
          })}
        </div>
      </div>
    </ThemedLayout>
  );
};

export default DeckEditorLayout;
