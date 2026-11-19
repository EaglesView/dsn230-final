import { createContext, useContext } from "react";


export const NavigationContext = createContext(null);

/**
 * Hook pour accéder au NavigationContext
 */
export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error("useNavigation doit être utilisé dans un NavigationProvider");
    }
    return context;
};