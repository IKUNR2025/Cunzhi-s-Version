import React, {createContext, useContext, useMemo} from 'react';

const HeadshotContext = createContext();

const headshots = import.meta.glob("../assets/headshots/*.jpg", {eager: true});

export const HeadshotProvider = ({children}) => {
    const getMiniHeadshot = useMemo(() => (auid) => {
        if (!auid) return headshots['../assets/headshots/profile_icon.jpg']?.default;

        const fileName = String(auid).toLowerCase();
        const key = `../assets/headshots/${fileName}.jpg`;
        return headshots[key]?.default || headshots['../assets/headshots/profile_icon.jpg']?.default;
    }, []);

    return (
        <HeadshotContext.Provider value={{getMiniHeadshot}}>
            {children}
        </HeadshotContext.Provider>
    );
};

export const useHeadshots = () => {
    const context = useContext(HeadshotContext);
    if (!context) {
        throw new Error("useHeadshots must be used within a HeadshotProvider");
    }
    return context;
};