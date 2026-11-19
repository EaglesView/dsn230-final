/**
 * Carte d'interface
 * 
 * PAS UNE CARTE DE JEU
 * 
 * Pour la carte de jeu, utiliser `<PlayCard/>`
 * @returns Carte UI 
 */
const Card = (children, className) => {
    return (
        <div
            className={`border-2 border-primary ${className}`}
        >
            {children}
        </div>
    );
}

export default Card;