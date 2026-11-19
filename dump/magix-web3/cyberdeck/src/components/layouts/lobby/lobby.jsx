import { Dialog, useDialog } from "../../ui/dialog";
import Sidebar from "./sidebar";
import ThemedLayout from "../themed-layout";
import { useNavigation } from "../../../hooks/useNavigation";
import { useState } from "react";
import { useEffect } from "react";
import CyberChat from "./cyber-chat";

const DialogQuitter = ({ dialog }) => {
  const { transitionTo, updateUserData } = useNavigation();
  const handleLogout = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_LOGOUT, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.status === "success") {
        // Si succes, mettre a jour a null
        updateUserData({
          username: null,
          visibility: 0,
          key: null,
        });

        // Faire la transition vers la page login
        transitionTo("login", {
          withGlitch: true,
          glitchType: ["noise", "displacement", "block"],
          duration: 1000,
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <Dialog
      isOpen={dialog.isOpen}
      onClose={dialog.close}
      title="QUITTER LE JEU"
      type="confirm"
      variant="neomilitarism"
      onConfirm={handleLogout}
      confirmText="QUITTER"
    >
      <p>
        êtes-vous sur de vouloir quitter? vous perdrez votre connexion ainsi que
        les données non sauvegardées
      </p>
      <p className="text-destructive mt-2">
        Vous serez renvoyés à la page de connexion
      </p>
    </Dialog>
  );
};

const LobbyLayout = () => {
  const [news, setNews] = useState([]);
  const dialog = useDialog();
  const { userData } = useNavigation();
  const openDialog = () => {
    dialog.open();
  };
  useEffect(() => {
    fetch("/api/news", {
      method: "POST",
      credentials: "include", // if you need cookies
    })
      .then((res) => res.json())
      .then((data) => {
        setNews(data);
      })
      .catch((err) => console.error(err));
  }, []);
  useEffect(() => {}, [news]);
  return (
    <ThemedLayout>
      <DialogQuitter dialog={dialog} />
      <div className="flex flex-row items-center justify-between flex-0 w-full h-full px-4 pb-4">
        <Sidebar dialog={dialog} />
        <div className="flex w-full h-full flex-col">
          <div className="flex w-full h-2/3 flex-row gap-1">
            <div className="w-full h-full  flex flex-col justify-start">
              <p className="text-primary text-5xl font-bold pb-2 font-serif">
                NOUVEAUTÉS MAGIX
              </p>
              <div className="border-2 border-primary w-full h-full p-4 overflow-y-scroll">
                <div className="flex w-full justify-around ">
                  <div className="flex flex-col gap-2 ">
                    {news.map((newsItem, index) => {
                      return (
                        <div
                          key={index}
                          className="flex flex-col p-2 border-2 border-primary"
                        >
                          <p className="text-3xl font-serif text-primary">
                            {newsItem.title}
                          </p>
                          <p className="text-xl text-secondary font-serif">
                            {newsItem.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full h-full flex flex-col justify-start">
              <p className="text-primary text-5xl font-bold pb-2 font-serif">
                NOUVEAUTÉS
              </p>
              <div className="border-2 border-primary w-full h-full p-4 overflow-y-scroll">
                bla
              </div>
            </div>
          </div>
          <div className="h-1/3 w-full">
            <CyberChat userData={userData} />
          </div>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default LobbyLayout;
