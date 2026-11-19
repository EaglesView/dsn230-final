import { useRef } from "react";
import Button from "../../ui/button";
import Input from "../../ui/input";
import { useNavigation } from "../../../hooks/useNavigation";
const ChatBoxLobby = () => {
  const chatRef = useRef(null);
  const { userData } = useNavigation();
  const sessionKey = userData?.key;
  //QUESTION: Pourquoi la barre de chat est fixe dans le canvas a un endroit?
  const applyStyles = () => {
    let styles = {
      fontColor: "#5EF6FF",
      backgroundColor: "#0E0E17",
      fontGoogleName: "Rajdhani",
      fontSize: "14px",
      hideIcons: true,
      inputBackgroundColor: "F75049",
      inputFontColor: "#5EF6FF",

      padding: "0px",
      memberListFontColor: "#ff00dd",
      borderColor: "F75049",
      memberListBackgroundColor: "white",
      hideScrollBar: true, // pour cacher le scroll bar
    };

    setTimeout(() => {
      chatRef.current.contentWindow.postMessage(JSON.stringify(styles), "*");
    }, 100);
  };
  return (
    <div className="border-2 border-primary flex-0 p-0 flex flex-col h-full">
      <iframe
        className="h-full w-full"
        ref={chatRef}
        onLoad={applyStyles()}
        src={`https://magix.apps-de-cours.com/server/chat/${sessionKey}`}
      ></iframe>
    </div>
  );
};

export default ChatBoxLobby;
