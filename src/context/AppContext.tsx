import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { auth, api, AuthUser, UserRole } from "../api/index";
import { mockAuth, mockApi } from "../api/mockApi";
import { getAppConfig, getDefaultConfig } from "../config/appConfig";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

interface AppContextProps {
  // Estados de autenticación
  loggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  isAdmin: boolean;
  isUser: boolean;

  // Funciones de autenticación
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // API actual (real o mock según devMode)
  currentApi: typeof api;

  // Estados existentes
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
  // Obtener configuración inicial
  const defaultConfig = getDefaultConfig();
  const appConfig = getAppConfig();
  const isDevelopmentMode = appConfig.defaultMode === 'development';
  
  // Seleccionar auth según el modo (necesario ANTES de los estados)
  const currentAuth = isDevelopmentMode ? mockAuth : auth;
  
  // Estados de autenticación - INICIALIZAR desde la sesión existente
  const [loggedIn, setLoggedIn] = useState(() => currentAuth.isLoggedIn());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => currentAuth.getCurrentUser());

  // Estados existentes - usando configuración
  const [esp32IP, setEsp32IP] = useState(defaultConfig.esp32IP);
  const [darkMode, setDarkMode] = useState(true);
  const [devMode, setDevMode] = useState(isDevelopmentMode);

  // Variables del formulario
  const [interval, setInterval] = useState(10);
  const [valueCount, setValueCount] = useState(10);
  const [min, setMin] = useState(7);
  const [max, setMax] = useState(70);
  const [chartMax, setChartMax] = useState(0);
  const [dataFormat, setDataFormat] = useState("Kilogramos Fuerza");

  // Computed values para roles
  const isAdmin = currentUser?.role === "ADMIN";
  const isUser = currentUser?.role === "USER";

  // Seleccionar API según el modo (usa currentAuth definido arriba)
  const currentApi = devMode ? mockApi : api;

  // Función de login
  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await currentAuth.login(username, password);
      if (response.status === "success") {
        // Iniciar sesión en localStorage ANTES de setLoggedIn
        const sessionStart = Date.now();
        localStorage.setItem('session_start_time', sessionStart.toString());
        console.log('🔑 Login exitoso - session_start_time guardado:', sessionStart);
        
        setLoggedIn(true);
        setCurrentUser(currentAuth.getCurrentUser());
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en login:", error);
      return false;
    }
  };

  // Función de logout
  const logout = () => {
    currentAuth.logout();
    setLoggedIn(false);
    setCurrentUser(null);
  };

  // Hook de timeout de sesión - PRODUCCIÓN (30 minutos)
  useSessionTimeout({
    isLoggedIn: loggedIn,
    logout: logout,
    sessionDuration: 30 * 60 * 1000, // 30 minutos
    warningTime: 2 * 60 * 1000, // Advertencia 2 minutos antes
  });

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    const currentAuthService = devMode ? mockAuth : auth;
    const isUserLoggedIn = currentAuthService.isLoggedIn();
    const user = currentAuthService.getCurrentUser();

    if (isUserLoggedIn && user) {
      setLoggedIn(true);
      setCurrentUser(user);
    }
  }, [devMode]); // Dependencia de devMode para re-evaluar cuando cambie

  // Actualizar IP base de la API cuando cambie esp32IP
  useEffect(() => {
    const currentApiService = devMode ? mockApi : api;
    currentApiService.updateBaseURL(esp32IP);
  }, [esp32IP, devMode]);

  return (
    <AppContext.Provider
      value={{
        // Estados de autenticación
        loggedIn,
        setLoggedIn,
        currentUser,
        setCurrentUser,
        isAdmin,
        isUser,
        login,
        logout,

        // API actual
        currentApi,

        // Estados existentes
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
  if (!context)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
};
