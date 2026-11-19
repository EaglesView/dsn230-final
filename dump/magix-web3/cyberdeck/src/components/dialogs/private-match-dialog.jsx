import { Dialog } from "../ui/dialog";

const DialogPrivate = ({ dialog }) => {
    return (
        <Dialog
            isOpen={dialog.isOpen}
            onClose={dialog.close}
            title="MATCH PRIVÉ"
            type="confirm"
            variant="neomilitarism"
            onConfirm={() => { }}
            confirmText="CONNECTION"
        >
            <div className="w-full flex flex-col gap-2 items-center justify-center">
                <h3 className="text-4xl text-center w-full ">
                    CLÉ PRIVÉE:
                </h3>

                <input
                    className="border-1 border-primary"
                    onChange={() => { }}
                    type="text"
                    placeholder="PRIVATE_KEY_0010-1001"
                    name="username" />

            </div>
        </Dialog>

    )
}
export default DialogPrivate;