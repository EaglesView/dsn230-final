import Header from "../game/header";
import LoginForm from "../game/login-form";

const LoginLayout = () => {
    return (
        <div className="font-mono text-4xl bg-background w-screen h-screen flex items-center flex-col justify-between">
            <Header />
            <LoginForm />
        </div>
    );
}

export default LoginLayout;