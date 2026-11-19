import loading_gif from "../../assets/loading2.gif"
import { Dialog } from "../ui/dialog";
import fluff_barcode from "../../assets/fluff/barcode2.png"

const DialogConnection = ({ dialog }) => {
    return (
        <Dialog
            isOpen={dialog.isOpen}
            onClose={dialog.close}
            title="CONNECTION À LA PARTIE"
            type="custom"
            variant="neomilitarism"
            onConfirm={() => { }}
            hardMode
        >
            <div className={`h-96 w-96 flex items-center justify-center `}>
                <div className="absolute -z-10 inset-0 bg-background/80 mix-blend-multiply w-full h-full">

                </div>
                <img src={loading_gif} className="mix-blend-screen  brightness-100" />
                <div className="absolute bg-primary w-64 h-64 mix-blend-darken">
                    {/**jen reviens pas jai figure out comment filtrer la couleur en screen */}
                </div>
            </div>
            <div className="flex flex-col">
                <p className="text-secondary italic text-xl">
                    Connection en cours...
                </p>
                <p className="text-lg font-bold">
                    ARASAKA_FIGHT_TERMINAL_001
                    </p>
                    <p className="font-mono text-xs">
                    PENDING CURRENT TRAINING SESSION...
                    </p>
                    <img src={fluff_barcode} className=" pt-2 w-full h-12 opacity-50 mix-blend-screen"/>
            </div>
        </Dialog>
    )
}

export default DialogConnection;