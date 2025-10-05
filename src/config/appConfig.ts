// ========== CONFIGURACIÓN DE IPs ==========

export interface AppConfig {
  production: {
    esp32IP: string;
    baseURL: string;
    websocketPort: number;
  };
  development: {
    esp32IP: string;
    baseURL: string;
    websocketPort: number;
  };
  defaultMode: 'production' | 'development';
}

export const APP_CONFIG: AppConfig = {
  production: {
    esp32IP: "192.168.50.22",
    baseURL: "http://192.168.50.22",
    websocketPort: 8080,
  },
  development: {
    esp32IP: "192.168.4.1", 
    baseURL: "http://192.168.4.1",
    websocketPort: 8080,
  },
  // Cambiar aquí para establecer el modo por defecto
  defaultMode: 'production', // 'production' | 'development'
};

// ========== FUNCIÓN PARA SOBRESCRIBIR CONFIGURACIÓN ==========

/**
 * Permite sobrescribir la configuración desde main.tsx
 * Útil para configurar dinámicamente las IPs y el modo
 */
export const setAppConfig = (overrides: {
  defaultMode?: 'production' | 'development';
  production?: Partial<AppConfig['production']>;
  development?: Partial<AppConfig['development']>;
}) => {
  if (overrides.defaultMode) {
    APP_CONFIG.defaultMode = overrides.defaultMode;
  }
  
  if (overrides.production) {
    APP_CONFIG.production = { ...APP_CONFIG.production, ...overrides.production };
    // Actualizar baseURL si se cambió la IP
    if (overrides.production.esp32IP) {
      APP_CONFIG.production.baseURL = `http://${overrides.production.esp32IP}`;
    }
  }
  
  if (overrides.development) {
    APP_CONFIG.development = { ...APP_CONFIG.development, ...overrides.development };
    // Actualizar baseURL si se cambió la IP
    if (overrides.development.esp32IP) {
      APP_CONFIG.development.baseURL = `http://${overrides.development.esp32IP}`;
    }
  }
  
  console.log('📝 Configuración actualizada:', APP_CONFIG);
};

// ========== FUNCIONES HELPER ==========

/**
 * Obtiene la configuración actual (permite acceso después de setAppConfig)
 */
export const getAppConfig = () => APP_CONFIG;

export const getConfigForMode = (isDevelopment: boolean) => {
  return isDevelopment ? APP_CONFIG.development : APP_CONFIG.production;
};

export const getDefaultConfig = () => {
  return APP_CONFIG.defaultMode === 'development' 
    ? APP_CONFIG.development 
    : APP_CONFIG.production;
};

// ========== CONFIGURACIÓN AVANZADA ==========

export interface AdvancedConfig {
  // Timeouts
  apiTimeout: number;
  websocketReconnectInterval: number;
  
  // Debugging
  enableDebugLogs: boolean;
  enableApiLogs: boolean;
  
  // Features
  enableMockData: boolean;
  enableAutoLogin: boolean;
  
  // UI
  defaultTheme: 'light' | 'dark';
  animationsEnabled: boolean;
}

export const ADVANCED_CONFIG: AdvancedConfig = {
  apiTimeout: 10000, // 10 segundos
  websocketReconnectInterval: 5000, // 5 segundos
  
  enableDebugLogs: APP_CONFIG.defaultMode === 'development',
  enableApiLogs: APP_CONFIG.defaultMode === 'development',
  
  enableMockData: APP_CONFIG.defaultMode === 'development',
  enableAutoLogin: false,
  
  defaultTheme: 'dark',
  animationsEnabled: true,
};

// ========== EXPORTACIONES PARA MAIN.TSX ==========

export const initializeAppConfig = () => {
  const config = getDefaultConfig();
  
  console.log(`🚀 App iniciada en modo: ${APP_CONFIG.defaultMode}`);
  console.log(`🌐 ESP32 IP: ${config.esp32IP}`);
  console.log(`📡 Base URL: ${config.baseURL}`);
  console.log(`🔌 WebSocket: ws://${config.esp32IP}:${config.websocketPort}`);
  
  return {
    mode: APP_CONFIG.defaultMode,
    config,
    advancedConfig: ADVANCED_CONFIG,
  };
};

export default APP_CONFIG;