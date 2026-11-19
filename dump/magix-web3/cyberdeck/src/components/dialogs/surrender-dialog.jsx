import { APIRequest } from "../../hooks/useGameAPI";
import { useNavigation } from "../../hooks/useNavigation";
import { Dialog } from "../ui/dialog";

const SurrenderDialog = ({ dialog }) => {
    const {transitionTo} = useNavigation();

    const handleSurrender = async() => {
        await APIRequest({
            endpoint:"game",
            action:"surrender"
        });
        transitionTo('lobby');
    }
    return (
        <Dialog
            isOpen={dialog.isOpen}
            onClose={dialog.close}
            title="ABANDONNER & QUITTER"
            type="confirm"
            variant="neomilitarism"
            onConfirm={() => {handleSurrender() }}
            confirmText="ABANDONNER"
        >
            ÊTES VOUS SÛRS DE VOULOIR ABANDONNER? VOUS SEREZ RENVOYÉ AU MENU PRINCIPAL.
        </Dialog>
    )
}
export default SurrenderDialog;