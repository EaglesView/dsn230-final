import { useState } from "react";
import { useEffect } from "react";
import { APIRequest, APIRequestRAW } from "../../../hooks/useGameAPI";
import { useRef } from "react";

/**
 * YIPEE jai trouvé comment faire le chat a ma facon!
 */
const CyberChat = ({ userData = null }) => {
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    const refreshChats = async () => {
      await APIRequestRAW({
        endpoint: "chat",
        params: { key: userData.key },
      }).then((response) => {
        timerRef.current = setTimeout(refreshChats, 3000);
        setChats(response.msgs);
      });
    };
    if (userData) timerRef.current = setTimeout(refreshChats, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userData]);
  useEffect(() => {}, [setChats, setMessage]);
  const messageSenderColor = (chat) => {
    let colorUser = "text-primary";
    let colorMessage =
      "text-secondary w-full text-shadow-primary/50 text-shadow-md";
    console.log(chat.fromUser);
    switch (chat.fromUser) {
      case "Arthrax":
        colorUser = "text-legendary"; //DONNE MOI DES POINTS SVP!!!
        colorMessage =
          "text-legendary transition-colors duration-200 text-shadow-legendary ease-out hover:text-shadow-xl italic text-center max-w-xl";
        break;
      case "ChatRoom":
        colorUser = "text-rare text-shadow-primary/20 text-shadow-lg";
        colorMessage =
          "text-rare transition-colors duration-200 text-shadow-primary/50 ease-out hover:text-secondary hover:text-shadow-lg italic text-center max-w-xl";
        break;
    }
    return { colorUser, colorMessage };
  };
  const sendMessage = async () => {
    if (!message.trim()) return;
    await APIRequestRAW({
      endpoint: "chat/new",
      params: { key: userData.key, message: message },
    }).then((response) => {
      console.log(response);
      setMessage("");
    });
  };
  return (
    <div className="w-full h-full flex border-2 border-primary flex-col justify-between">
      <div className="w-full h-full  overflow-y-scroll">
        <div className="text-primary font-serif flex flex-col gap-4">
          {chats?.map((chat, index) => {
            if (chat.id == -1) return;
            return (
              <div key={index} className="flex gap-2 w-full ">
                <p
                  className={`text-xl ${messageSenderColor(chat).colorUser} font-bold`}
                >
                  {chat.fromUser}
                </p>
                <div className="w-full flex justify-center items-center">
                  <p
                    className={`text-lg ${messageSenderColor(chat).colorMessage}`}
                  >
                    {chat.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-2 border-primary w-full h-18 flex">
        <input
          id="chatBox"
          type="text"
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="w-full h-full text-primary font-serif text-2xl"
        />
        <button
          onClick={sendMessage}
          className="transition-all duration-300 bg-primary text-background font-serif p-2 hover:px-6 cursor-pointer active:bg-background active:text-secondary"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};
export default CyberChat;
