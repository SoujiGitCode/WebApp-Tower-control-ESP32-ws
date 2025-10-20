import axios, { AxiosResponse } from "axios";
import { getDefaultConfig } from "../config/appConfig";
import Swal from "sweetalert2";

// ========== TIPOS Y INTERFACES ==========
export type UserRole = "USER" | "ADMIN";

export interface User {
  username: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthUser extends User {
  sessionId: string;
}

export interface TowerInfo {
  id: string;
  name: string;
  slang: string;
  location: string;
  priority: number;
  type: string;
  loadcells_amount: number;
}

export interface WiFiConfig {
  ssid: string;
  password: string;
}

// ========== TIPOS PARA THRESHOLDS ==========
export interface ThresholdValues {
  low_low: number;
  low: number;
  high: number;
  high_high: number;
}

export interface AlarmTimes {
  time_low_low: number;
  time_low: number;
  time_high: number;
  time_high_high: number;
}

export interface DeviceThresholdConfig {
  device_id: number;
  active: boolean;
  thresholds: ThresholdValues;
  alarm_times: AlarmTimes;
}

export interface DevicesStatusResponse {
  devices: DeviceThresholdConfig[];
  total_devices: number;
}

// Legacy interface para compatibilidad con setter individual
export interface Threshold {
  device_id: number;
  low_low: number;
  low: number;
  high: number;
  high_high: number;
  active: boolean;
  window_minutes?: number; // Ventana de tiempo en minutos
  time_low?: number; // Mantener por compatibilidad (deprecated)
}

export interface DeviceStatus {
  id: number;
  name: string;
  status: "online" | "offline" | "error";
  last_seen?: number;
  battery_level?: number;
}

// ========== NUEVOS TIPOS PARA MULTI-DEVICE ==========
export interface Sensor {
  id: number;
  name: string; // "Alfa", "Beta", "Gamma" o "Norte", "Sur", "Este", "Oeste"
  value: number;
  alarm_triggered: boolean;
}

export interface Device {
  device_id: number;
  units: string; // "newtons", "kg", etc
  device_config: "3_sensores" | "4_sensores";
  sensors: Sensor[];
}

export interface Statistics {
  total_devices: number;
  connected_clients: number;
  total_alarms: number;
}

export interface DevicesData {
  devices: Device[];
  statistics: Statistics;
}

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
}

export interface LoginResponse {
  status: "success" | "error";
  message: string;
  user?: {
    username: string;
    role: string;
  };
  sessionId?: string;
}

// ========== CONFIGURACIÓN DE AXIOS ==========
class ApiClient {
  private baseURL: string;
  private axiosInstance;

  constructor(baseURL?: string) {
    // Usar configuración automática si no se proporciona URL
    const config = getDefaultConfig();
    this.baseURL = baseURL || config.baseURL;
    
    console.log(`🚀 ApiClient inicializado con baseURL: ${this.baseURL}`);
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Interceptor para agregar token automáticamente
    this.axiosInstance.interceptors.request.use((config) => {
      const sessionId = this.getSessionId();
      console.log(`🔍 Interceptor - URL: ${config.url}, SessionId: ${sessionId ? "EXISTS" : "NULL"}`);
      
      if (sessionId && config.headers) {
        config.headers.Authorization = `Bearer ${sessionId}`;
        console.log(`🔑 Bearer token agregado: Bearer ${sessionId.substring(0, 10)}...`);
      } else {
        console.log("⚠️ No se agregó Bearer token");
      }
      
      return config;
    });

    // Interceptor para detectar sesión expirada desde el backend
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Verificar si la respuesta indica sesión expirada
        if (response.data?.session_expired === true) {
          console.error('🚨 Sesión expirada detectada desde el backend');
          this.handleSessionExpired();
        }
        return response;
      },
      (error) => {
        // Verificar si el error indica sesión expirada
        if (error.response?.data?.session_expired === true) {
          console.error('🚨 Sesión expirada detectada en error desde el backend');
          this.handleSessionExpired();
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== MANEJO DE SESIÓN EXPIRADA ==========
  private handleSessionExpired(): void {
    // Limpiar sesión local
    this.removeSessionId();
    this.removeCurrentUser();

    // Mostrar alerta al usuario
    Swal.fire({
      icon: 'warning',
      title: '🔐 Sesión Expirada',
      text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      confirmButtonText: 'Ir a Login',
      confirmButtonColor: '#ef4444',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(() => {
      // Redirigir a login después de cerrar la alerta
      window.location.href = '/login';
    });
  }

  // ========== GESTIÓN DE SESIÓN LOCAL ==========
  getSessionId(): string | null {
    return localStorage.getItem("sessionId");
  }

  setSessionId(sessionId: string): void {
    localStorage.setItem("sessionId", sessionId);
  }

  removeSessionId(): void {
    localStorage.removeItem("sessionId");
  }

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: AuthUser): void {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

  removeCurrentUser(): void {
    localStorage.removeItem("currentUser");
  }

  isLoggedIn(): boolean {
    return this.getSessionId() !== null && this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "ADMIN";
  }

  isUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "USER";
  }

  // ========== ACTUALIZAR IP BASE ==========
  updateBaseURL(newIP: string): void {
    this.baseURL = `http://${newIP}`;
    this.axiosInstance.defaults.baseURL = this.baseURL;
  }

  // ========== HELPER PARA CREAR FORM DATA ==========
  private createFormData(data: Record<string, any>): URLSearchParams {
    const formData = new URLSearchParams();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, String(data[key]));
      }
    }
    return formData;
  }

  // ========== AUTENTICACIÓN ==========
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const formData = this.createFormData({ username, password });
      const response: AxiosResponse<LoginResponse> =
        await this.axiosInstance.post("/api/login", formData);

      if (
        response.data.status === "success" &&
        response.data.sessionId &&
        response.data.user
      ) {
        const authUser: AuthUser = {
          username: response.data.user.username,
          role: response.data.user.role as UserRole,
          isActive: true,
          sessionId: response.data.sessionId,
        };

        this.setSessionId(response.data.sessionId);
        this.setCurrentUser(authUser);
      }

      return response.data;
    } catch (error) {
      console.error("Error en login:", error);
      return {
        status: "error",
        message: "Error de conexión al servidor",
      };
    }
  }

  logout(): void {
    this.removeSessionId();
    this.removeCurrentUser();
  }

  // ========== INFORMACIÓN DE LA TORRE ==========
  async getTowerInfo(): Promise<ApiResponse<TowerInfo>> {
    try {
      const response: AxiosResponse<ApiResponse<TowerInfo>> =
        await this.axiosInstance.get("/api/get/tower-info");
      return response.data;
    } catch (error) {
      console.error("Error al obtener info de la torre:", error);
      return {
        status: "error",
        message: "Error al obtener información de la torre",
      };
    }
  }

  async setTowerInfo(towerInfo: TowerInfo): Promise<ApiResponse<TowerInfo>> {
    try {
      const formData = this.createFormData(towerInfo);
      const response: AxiosResponse<ApiResponse<TowerInfo>> =
        await this.axiosInstance.post("/api/set/tower-info", formData);
      return response.data;
    } catch (error) {
      console.error("Error al configurar info de la torre:", error);
      return {
        status: "error",
        message: "Error al configurar información de la torre",
      };
    }
  }

  // ========== CONFIGURACIÓN WIFI ==========
  async setWiFiConfig(wifiConfig: WiFiConfig): Promise<ApiResponse> {
    try {
      const formData = this.createFormData(wifiConfig);
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post("/api/set/wifi", formData);
      return response.data;
    } catch (error) {
      console.error("Error al configurar WiFi:", error);
      return {
        status: "error",
        message: "Error al configurar WiFi",
      };
    }
  }

  // ========== CONTROL DE LEDs ==========
  async toggleLed(nodeNumber: number, ledState: boolean): Promise<ApiResponse> {
    try {
      const formData = this.createFormData({
        nodo: nodeNumber,
        led: ledState.toString(),
      });
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post("/api/led", formData);
      return response.data;
    } catch (error) {
      console.error("Error al controlar LED:", error);
      return {
        status: "error",
        message: "Error al controlar LED",
      };
    }
  }

  // ========== GESTIÓN DE USUARIOS (Solo Admin) ==========
  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response: AxiosResponse<ApiResponse<User[]>> =
        await this.axiosInstance.get("/api/users/list");
      return response.data;
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return {
        status: "error",
        message: "Error al obtener lista de usuarios",
      };
    }
  }

  async updateUser(
    username: string,
    password?: string,
    role?: UserRole,
    isActive?: boolean
  ): Promise<ApiResponse> {
    try {
      const updateData: Record<string, any> = { username };
      if (password) updateData.password = password;
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive.toString();

      const formData = this.createFormData(updateData);
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post("/api/users/update", formData);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      return {
        status: "error",
        message: "Error al actualizar usuario",
      };
    }
  }

  async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    try {
      const formData = this.createFormData({
        username,
        oldPassword,
        newPassword,
      });
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post("/api/users/change-password", formData);
      return response.data;
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      return {
        status: "error",
        message: "Error al cambiar contraseña",
      };
    }
  }

  // ========== RESET DE FÁBRICA (Solo Admin) ==========
  async factoryReset(adminPassword?: string): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      if (adminPassword) {
        formData.append('admin_password', adminPassword);
      }
      
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post("/api/factory-reset", formData);
      return response.data;
    } catch (error) {
      console.error("Error en factory reset:", error);
      return {
        status: "error",
        message: "Error al ejecutar reset de fábrica",
      };
    }
  }

  // ========== GESTIÓN DE THRESHOLDS ==========
  async getThresholds(): Promise<ApiResponse<Threshold[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Threshold[]>> =
        await this.axiosInstance.get("/api/thresholds");
      return response.data;
    } catch (error) {
      console.error("Error al obtener thresholds:", error);
      return {
        status: "error",
        message: "Error al obtener thresholds",
      };
    }
  }

  async setThresholds(threshold: Threshold): Promise<ApiResponse> {
    try {
      const formData = this.createFormData({
        device_id: threshold.device_id,
        low_low: threshold.low_low,
        low: threshold.low,
        high: threshold.high,
        high_high: threshold.high_high,
        active: threshold.active.toString(),
        window_minutes: threshold.window_minutes || 3,
      });
      
      console.log("🎯 Enviando thresholds:", {
        device_id: threshold.device_id,
        window_minutes: threshold.window_minutes || 3,
        thresholds: { 
          low_low: threshold.low_low, 
          low: threshold.low, 
          high: threshold.high, 
          high_high: threshold.high_high 
        }
      });
      
      const response: AxiosResponse<ApiResponse> =
        await this.axiosInstance.post("/api/thresholds", formData);
      return response.data;
    } catch (error) {
      console.error("Error al configurar thresholds:", error);
      return {
        status: "error",
        message: "Error al configurar thresholds",
      };
    }
  }

  // ========== ESTADO DE DISPOSITIVOS ==========
  async getDevicesStatus(): Promise<ApiResponse<DevicesStatusResponse>> {
    try {
      console.log("🔍 Llamando /api/devices/status...");
      const sessionId = this.getSessionId();
      console.log("🔑 SessionId disponible:", sessionId ? "SÍ" : "NO");
      
      const response: AxiosResponse<ApiResponse<DevicesStatusResponse>> =
        await this.axiosInstance.get("/api/devices/status");
      
      console.log("✅ Respuesta /api/devices/status:", response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error al obtener estado de dispositivos:", error);
      console.error("❌ Status:", error.response?.status);
      console.error("❌ Headers enviados:", error.config?.headers);
      return {
        status: "error",
        message: `Error al obtener estado de dispositivos: ${error.response?.status || error.message}`,
      };
    }
  }

  // ========== FUNCIONES DE WEBSOCKET ==========
  createWebSocketConnection(ip?: string): WebSocket {
    const wsIP = ip || this.baseURL.replace("http://", "");
    const wsUrl = `ws://${wsIP}:8080`;
    console.log(`🔌 Conectando WebSocket a: ${wsUrl}`);
    return new WebSocket(wsUrl);
  }

  getWebSocketUrl(ip?: string): string {
    const wsIP = ip || this.baseURL.replace("http://", "");
    return `ws://${wsIP}:8080`;
  }
}

// ========== INSTANCIA GLOBAL ==========
export const apiClient = new ApiClient();

// ========== FUNCIONES DE AUTENTICACIÓN HELPERS ==========
export const auth = {
  login: (username: string, password: string) =>
    apiClient.login(username, password),
  logout: () => apiClient.logout(),
  isLoggedIn: () => apiClient.isLoggedIn(),
  isAdmin: () => apiClient.isAdmin(),
  isUser: () => apiClient.isUser(),
  getCurrentUser: () => apiClient.getCurrentUser(),
  getSessionId: () => apiClient.getSessionId(),
};

// ========== FUNCIONES DE API PRINCIPALES ==========
export const api = {
  // Torre
  getTowerInfo: () => apiClient.getTowerInfo(),
  setTowerInfo: (towerInfo: TowerInfo) => apiClient.setTowerInfo(towerInfo),

  // WiFi
  setWiFiConfig: (config: WiFiConfig) => apiClient.setWiFiConfig(config),

  // LEDs
  toggleLed: (nodeNumber: number, ledState: boolean) =>
    apiClient.toggleLed(nodeNumber, ledState),

  // Usuarios
  getUsers: () => apiClient.getUsers(),
  updateUser: (
    username: string,
    password?: string,
    role?: UserRole,
    isActive?: boolean
  ) => apiClient.updateUser(username, password, role, isActive),
  changePassword: (
    username: string,
    oldPassword: string,
    newPassword: string
  ) => apiClient.changePassword(username, oldPassword, newPassword),

  // Thresholds
  getThresholds: () => apiClient.getThresholds(),
  setThresholds: (threshold: Threshold) => apiClient.setThresholds(threshold),

  // Dispositivos
  getDevicesStatus: () => apiClient.getDevicesStatus(),

  // Sistema
  factoryReset: (adminPassword?: string) => apiClient.factoryReset(adminPassword),

  // Configuración
  updateBaseURL: (newIP: string) => apiClient.updateBaseURL(newIP),

  // Sesión
  getSessionId: () => apiClient.getSessionId(),
  setSessionId: (sessionId: string) => apiClient.setSessionId(sessionId),
  removeSessionId: () => apiClient.removeSessionId(),

  // WebSocket
  createWebSocketConnection: (ip?: string) =>
    apiClient.createWebSocketConnection(ip),
  getWebSocketUrl: (ip?: string) => apiClient.getWebSocketUrl(ip),
};

export default apiClient;
