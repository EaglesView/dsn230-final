import { useState, useRef, useContext, useEffect } from "react";
import Button from "../ui/button";
import { GlitchContext } from "../../contexts/GlitchContext";
import { Dialog, useDialog } from "../ui/dialog";
import { useNavigation } from "../../hooks/useNavigation";

const LoginForm = () => {
    //Le state mgmt
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const URL_API = import.meta.env.VITE_LOGIN;
    const { transitionTo, updateUserData } = useNavigation();
    const dialog = useDialog();
    
    // WebGL glitch effect
    const loginFormRef = useRef(null);
    const { triggerGlitch } = useContext(GlitchContext);
    useEffect(()=>{
        dialog.open()
    },[])
    const handleSubmit = async () => {
        //event.preventDefault();

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            const response = await fetch(URL_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData, // formdata pour que mon php le recoive sans decode en JSON
                credentials: 'include' // Envoyer et recevoir les cookies de session PHP
            });
            const data = await response.json();
            console.log('Response Data is:', data);

            // Check if login SUCCEEDED
            if (data.status === 'success') {
                // Mettre à jour les données utilisateur
                updateUserData({
                    username: data.username,
                    visibility: data.visibility,
                    key: data.key
                });

                // Transition vers lobby avec glitch
                transitionTo('lobby', {
                    withGlitch: true,
                    glitchType: ['noise', 'displacement', 'block']
                });
            } else {
                // Login échoué - glitch d'erreur
                triggerGlitch({
                    type: ['block', 'displacement', 'noise'],
                    target: loginFormRef,
                    duration: 1600,
                    strength: 1.4,
                    color: '#FF0000',
                    easing: 'elastic'
                });
            }

        } catch (error) {
            console.error(error); //pour l'instant, on pourra trier les erreurs plus tard
            // Trigger glitch on error
            triggerGlitch({
                type: ['chromatic', 'noise', 'block'],
                target: loginFormRef,
                duration: 500,
                strength: 1.0
            });
        }
    };
    return (
        <LoginDialog dialog={dialog} handleSubmit={handleSubmit} username={username} setUsername={setUsername} password={password} setPassword={setPassword} />
    );
}

export default LoginForm;
    const LoginDialog = ({dialog, handleSubmit,username,setUsername,password,setPassword}) => {
        return (
            <Dialog
                isOpen={dialog.isOpen}
                onClose={dialog.close}
                title="ARASAKA | LOGIN REQUIRED"
                type="confirm"
                variant="neomilitarism"
                onConfirm={handleSubmit}
                confirmText="LOGIN"
                hardMode
            >
                <div className="flex flex-col gap-2 text-lg text-primary font-serif">
                    <div className="flex gap-2 items-center justify-between">
                        <p>
                            USERNAME
                        </p>
                        <input
                            className="border-1 border-primary"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            name="username" />

                    </div>
                    <div className="flex gap-2 items-center justify-between">
                        <p>
                            PASSWORD
                        </p>
                        <input
                            className="border-1 border-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            name="password" />

                    </div>

                </div>
            </Dialog>
        )
    };

/**
 <div className="w-full flex-1 flex items-center justify-center">
            <div ref={loginFormRef} className="border-primary border-2 p-2">

                */{/**Partie du header  */}/*
                <div className="border-primary border-2 flex gap-2 h-full items-center justify-between px-12 text-primary font-serif text-xl">
                    <p>
                        ARASAKA0802
                    </p>
                    |
                    <p>
                        LOGIN REQUIRED
                    </p>
                </div>
                */{/**Partie du form  */}/*
                <div>
                    <form
                        onSubmit={handleSubmit}
                        method="POST"
                        className="flex flex-col p-6 gap-2 text-lg text-primary font-serif">
                        <div className="flex gap-2 items-center justify-between">
                            <p>
                                USERNAME
                            </p>
                            <input
                                className="border-1 border-primary"
                                onChange={(e) => setUsername(e.target.value)}
                                type="text"
                                name="username" />

                        </div>
                        <div className="flex gap-2 items-center justify-between">
                            <p>
                                PASSWORD
                            </p>
                            <input
                                className="border-1 border-primary"
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                name="password" />

                        </div>
                        <Button>
                            LOGIN
                        </Button>
                    </form>
                </div>
            </div>

        </div>
        
        */