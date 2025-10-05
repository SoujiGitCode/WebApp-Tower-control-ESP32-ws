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
    // Variables del formulario
    interval: number;
    setInterval: (value: number) => void;
    valueCount: number;
    setValueCount: (value: number) => void;
    min: number;
    setMin: (value: number) => void;
    max: number;
    setMax: (value: number) => void;
    chartMax: number;
    setChartMax: (value: number) => void;
    dataFormat: string;
    setDataFormat: (value: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [esp32IP, setEsp32IP] = useState('192.168.4.1');
    const [darkMode, setDarkMode] = useState(true);
    const [devMode, setDevMode] = useState(false);

    // Variables del formulario
    const [interval, setInterval] = useState(10);
    const [valueCount, setValueCount] = useState(10);
    const [min, setMin] = useState(7);
    const [max, setMax] = useState(70);
    const [chartMax, setChartMax] = useState(0);
    const [dataFormat, setDataFormat] = useState('Kilogramos Fuerza');

    return (
        <AppContext.Provider
            value={{
                loggedIn,
                setLoggedIn,
                esp32IP,
                setEsp32IP,
                darkMode,
                setDarkMode,
                devMode,
                setDevMode,
                interval,
                setInterval,
                valueCount,
                setValueCount,
                min,
                setMin,
                max,
                setMax,
                chartMax,
                setChartMax,
                dataFormat,
                setDataFormat,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};
