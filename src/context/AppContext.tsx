import { createContext, useState, useContext, ReactNode } from 'react';

interface AppContextProps {
    loggedIn: boolean;
    setLoggedIn: (value: boolean) => void;
    esp32IP: string;
    setEsp32IP: (value: string) => void;
    darkMode: boolean;
    setDarkMode: (value: boolean) => void;
    devMode: boolean;
    setDevMode: (value: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [esp32IP, setEsp32IP] = useState('192.168.4.1');
    const [darkMode, setDarkMode] = useState(true);
    const [devMode, setDevMode] = useState(false);

    return (
        <AppContext.Provider value={{ loggedIn, setLoggedIn, esp32IP, setEsp32IP, darkMode, setDarkMode, devMode, setDevMode }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};
