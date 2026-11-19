import { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './button';
import { GlitchContext } from '../../contexts/GlitchContext';
import { useSound } from '../../hooks/useSound';

//TODO: Faire des variants Globales
const variantStyles = {
    neomilitarism: {
        border: "border-destructive",
        text: "text-destructive",
        bg: "bg-background"
    },
    neokitsch: {
        border: "border-legendary",
        text: "text-legendary",
        bg: "bg-background"
    },
    kitsch: {
        border: "border-accent",
        text: "text-accent",
        bg: "bg-background"
    },
    entropism: {
        border: "border-rare",
        text: "text-rare",
        bg: "bg-background"
    },
};

/**
 * Component de Dialog pour le jeu
 * 
 * Hautement inspiré de quand j'ai fait du shadCn, mais avec la twist homemade custom.
 * 
 * @param {boolean} isOpen - Si le dialogue est ouvert
 * @param {function} onClose - Callback quand le dialog ferme
 * @param {string} title - Titre du Dialog
 * @param {string} type - Le type de Dialog: 'ok', 'confirm', 'custom' //custom pas implemente yet
 * @param {string} variant - La variant visuelle
 * @param {function} onConfirm - Callback pour l'action de confirmer
 * @param {React.ReactNode} children - Contenu du Dialog
 */
export const Dialog = ({
    isOpen,
    onClose,
    title,
    type = 'ok',
    variant = 'neomilitarism',
    onConfirm,
    confirmText = "CONFIRMER",
    children,
    hardMode = false
}) => {
    const { triggerGlitch } = useContext(GlitchContext);
    const { playSound } = useSound();

    const glitchRef = useRef(null);

    const currentVariant = variantStyles[variant] || variantStyles.neomilitarism;

    //UseEffect pour catch les changements du dialog
    useEffect(() => {
        if (isOpen) {
            //un ptit glitch a l'ouverture
            triggerGlitch({
                type: ['chromatic', 'displacement', 'block', 'noise'],
                target: glitchRef,
                duration: 250,
                strength: 0.6,
                color: '#FF3636'
            });
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        triggerGlitch({
            type: ['chromatic', 'displacement', 'block', 'noise'],
            target: glitchRef,
            duration: 250,
            strength: 0.6,
            color: '#FF3636'
        });
        playSound('sfx','closeDialog');
        if(!hardMode){
        onClose();
        }
    }

    /**
     * Permet de fermer le dialog si le user clique ailleurs
     * 
     * tsey, c'est fâchant quand ca fait pas ca right?
     * @param {event} e l'event 
     */
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !hardMode) {
            handleClose();
        }
    };

    /**
     * Handle le confirm du Dialog
     */
    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        handleClose();
    };

    /**
     * createPortal permet de render tes children dans d'autres parties du dom (dans ce cas, le document body)
     */
    return createPortal(
        <div
            className={`cursor-cell fixed inset-0 z-50 flex items-center justify-center ${!hardMode && "bg-background/80"} `}
            onClick={handleBackdropClick}
            ref={glitchRef}

        >
            <div
                className={`border-2 ${currentVariant.border} ${currentVariant.bg} min-w-96  animate-in fade-in duration-200`}>
                <DialogHeader title={title} variant={currentVariant} onClose={onClose} hardMode={hardMode} />
                <DialogContent variant={currentVariant}>
                    {children}
                </DialogContent>
                {type !== 'custom' && (
                    <DialogFooter
                        type={type}
                        variant={variant}
                        onClose={handleClose}
                        onConfirm={handleConfirm}
                        confirmText={confirmText}
                        hardMode={hardMode}
                    />
                )}
            </div>
        </div>,
        document.body
    );
};

/**
 * Sémantique du Dialog
 * @param {*} param0 
 * @returns 
 */
const DialogHeader = ({ title, variant, onClose, hardMode }) => {
    return (
        <div className={`border-b-2 ${variant.border} flex items-center justify-between px-6 py-3`}>
            <h2 className={`font-serif text-xl ${variant.text} font-bold`}>
                {title}
            </h2>
            {!hardMode && (
                <button
                    onClick={onClose}
                    className={`${variant.text} hover:opacity-70 transition-opacity text-2xl font-mono leading-none`}
                >
                    ×
                </button>
            )}

        </div>
    );
};

/**
 *  Sémantique du Dialog
 * @param {*} param0 
 * @returns 
 */
const DialogContent = ({ children, variant }) => {
    return (
        <div className={`p-6 ${variant.text} font-serif`}>
            {children}
        </div>
    );
};

/**
 *  Sémantique du Dialog
 * @param {*} param0 
 * @returns 
 */
const DialogFooter = ({ type, variant, onClose, onConfirm, confirmText,hardMode }) => {
    const cancelRef = useRef(null);

    return (
        <div className="px-6 pb-6 flex gap-4 justify-end">
            {type === 'confirm' && (
                <Button
                    variant={variant}
                    className="w-48"
                    ref={cancelRef}
                    onClick={onClose}
                >
                    {hardMode?"QUITTER":"ANNULER"}
                </Button>
            )}
            <Button
                variant={"neokitsch"}
                className="w-48"
                onClick={type === 'confirm' ? onConfirm : onClose}
            >
                {type === 'confirm' ? confirmText || "CONFIRMER" : confirmText || 'OK'}
            </Button>
        </div>
    );
};

/**
 * Hook pour utiliser le Dialog
 * @returns {object} - { isOpen, open, close, toggle }
 */
export const useDialog = () => {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(prev => !prev);

    return {
        isOpen,
        open,
        close,
        toggle
    };
};