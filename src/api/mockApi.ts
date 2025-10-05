// Mock API para desarrollo y testing
import {
  ApiResponse,
  LoginResponse,
  TowerInfo,
  WiFiConfig,
  User,
  UserRole,
  AuthUser,
  Device,
  DevicesData,
} from "./index";

// ========== DATOS MOCK ==========
const mockUsers = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "ADMIN" as UserRole,
    isActive: true,
  },
  user: {
    username: "user",
    password: "user123",
    role: "USER" as UserRole,
    isActive: true,
  },
};

const mockTowerInfo: TowerInfo = {
  id: "TOWER-001",
  name: "Torre Principal",
  slang: "TP-01",
  location: "Sector Norte - Edificio A",
  priority: 1,
  type: "Monitoreo Estructural",
  loadcells_amount: 4,
};

// Datos mock para multi-device
const mockDevicesData: DevicesData = {
  devices: [
    {
      id: 1,
      unit_symbol: "N",
      unit_name: "newtons",
      Norte: 690,
      Sur: 1584,
      Este: 1210,
      Oeste: 1051,
    },
    {
      id: 78, // ID cambiado para demostrar flexibilidad
      unit_symbol: "N",
      unit_name: "newtons",
      Norte: 446,
      Sur: 101,
      Este: 1188,
      Oeste: 546,
    },
    {
      id: 3,
      unit_symbol: "N",
      unit_name: "newtons",
      Norte: 483,
      Sur: 239,
      Este: 1496,
      Oeste: 21,
    },
    {
      id: 4,
      unit_symbol: "N",
      unit_name: "newtons",
      Norte: 1829,
      Sur: 1747,
      Este: 1162,
      Oeste: 1965,
    },
  ],
  total_devices: 4,
  timestamp: Date.now(),
};

let mockCurrentUser: AuthUser | null = null;
let mockSessionId: string | null = null;

// ========== FUNCIONES HELPER ==========
const delay = (ms: number = 500) => {
  return new Promise((resolve: any) => setTimeout(resolve, ms));
};

const generateSessionId = (): string => {
  return "mock_session_" + Math.random().toString(36).substr(2, 9);
};

const createSuccessResponse = <T>(
  data?: T,
  message: string = "Success"
): ApiResponse<T> => ({
  status: "success",
  message,
  data,
});

const createErrorResponse = (message: string): ApiResponse => ({
  status: "error",
  message,
});

// Helper para Object.values compatible
const getObjectValues = (obj: any) => {
  const values = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      values.push(obj[key]);
    }
  }
  return values;
};

// Helper para Object.assign compatible
const assignObject = (target: any, source: any) => {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
  return target;
};

// ========== MOCK API CLASS ==========
export class MockApiClient {
  private baseURL: string = "http://192.168.4.1"; // Mock base URL

  // ========== GESTIÓN DE SESIÓN LOCAL (igual que la real) ==========
  getSessionId(): string | null {
    return localStorage.getItem("sessionId");
  }

  setSessionId(sessionId: string): void {
    localStorage.setItem("sessionId", sessionId);
    mockSessionId = sessionId;
  }

  removeSessionId(): void {
    localStorage.removeItem("sessionId");
    mockSessionId = null;
  }

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: AuthUser): void {
    localStorage.setItem("currentUser", JSON.stringify(user));
    mockCurrentUser = user;
  }

  removeCurrentUser(): void {
    localStorage.removeItem("currentUser");
    mockCurrentUser = null;
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
    console.log(`🔧 [MOCK] Base URL actualizada a: ${this.baseURL}`);
  }

  // ========== AUTENTICACIÓN ==========
  async login(username: string, password: string): Promise<LoginResponse> {
    await delay(800); // Simular latencia de red

    console.log(`🔐 [MOCK] Intentando login: ${username}`);

    const usersList = getObjectValues(mockUsers);
    const user = usersList.find(
      (u: any) => u.username === username && u.password === password
    );

    if (user) {
      const sessionId = generateSessionId();
      const authUser: AuthUser = {
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        sessionId,
      };

      this.setSessionId(sessionId);
      this.setCurrentUser(authUser);

      console.log(`✅ [MOCK] Login exitoso para ${username} (${user.role})`);

      return {
        status: "success",
        message: "Login successful",
        user: {
          username: user.username,
          role: user.role,
        },
        sessionId,
      };
    } else {
      console.log(`❌ [MOCK] Login fallido para ${username}`);
      return {
        status: "error",
        message: "Invalid credentials",
      };
    }
  }

  logout(): void {
    console.log(`🚪 [MOCK] Logout realizado`);
    this.removeSessionId();
    this.removeCurrentUser();
  }

  // ========== INFORMACIÓN DE LA TORRE ==========
  async getTowerInfo(): Promise<ApiResponse<TowerInfo>> {
    await delay(300);
    console.log(`📡 [MOCK] Obteniendo información de la torre`);
    return createSuccessResponse(
      mockTowerInfo,
      "Tower info retrieved successfully"
    );
  }

  async setTowerInfo(towerInfo: TowerInfo): Promise<ApiResponse<TowerInfo>> {
    await delay(500);
    console.log(`📝 [MOCK] Configurando información de la torre:`, towerInfo);

    // Simular guardado (en la realidad se guardaría en el ESP32)
    assignObject(mockTowerInfo, towerInfo);

    return createSuccessResponse(
      mockTowerInfo,
      "Tower info updated successfully"
    );
  }

  // ========== CONFIGURACIÓN WIFI ==========
  async setWiFiConfig(wifiConfig: WiFiConfig): Promise<ApiResponse> {
    await delay(1000);
    console.log(`📶 [MOCK] Configurando WiFi:`, {
      ssid: wifiConfig.ssid,
      password: "***",
    });

    if (!wifiConfig.ssid || wifiConfig.password.length < 8) {
      return createErrorResponse("SSID vacío o contraseña muy corta");
    }

    return createSuccessResponse(
      undefined,
      "Configuración WiFi guardada exitosamente"
    );
  }

  // ========== CONTROL DE LEDs ==========
  async toggleLed(nodeNumber: number, ledState: boolean): Promise<ApiResponse> {
    await delay(200);
    console.log(
      `💡 [MOCK] Controlando LED - Nodo: ${nodeNumber}, Estado: ${
        ledState ? "ON" : "OFF"
      }`
    );

    if (nodeNumber < 1 || nodeNumber > 4) {
      return createErrorResponse(
        `Número de nodo inválido. Debe ser entre 1 y 4`
      );
    }

    const action = ledState ? "encendido" : "apagado";
    return createSuccessResponse(
      undefined,
      `LED del nodo ${nodeNumber} ${action}`
    );
  }

  // ========== GESTIÓN DE USUARIOS ==========
  async getUsers(): Promise<ApiResponse<User[]>> {
    await delay(300);
    console.log(`👥 [MOCK] Obteniendo lista de usuarios`);

    const usersList = getObjectValues(mockUsers);
    const users = usersList.map((u: any) => ({
      username: u.username,
      role: u.role,
      isActive: u.isActive,
    }));
    return createSuccessResponse(users, "Users retrieved successfully");
  }

  async updateUser(
    username: string,
    password?: string,
    role?: UserRole,
    isActive?: boolean
  ): Promise<ApiResponse> {
    await delay(500);
    console.log(`👤 [MOCK] Actualizando usuario: ${username}`);

    const usersList = getObjectValues(mockUsers);
    const user = usersList.find((u: any) => u.username === username);
    if (!user) {
      return createErrorResponse("Usuario no encontrado");
    }

    if (password) user.password = password;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    return createSuccessResponse(undefined, "User updated successfully");
  }

  async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    await delay(500);
    console.log(`🔑 [MOCK] Cambiando contraseña para: ${username}`);

    const usersList = getObjectValues(mockUsers);
    const user = usersList.find((u: any) => u.username === username);
    if (!user) {
      return createErrorResponse("Usuario no encontrado");
    }

    if (user.password !== oldPassword) {
      return createErrorResponse("Contraseña actual incorrecta");
    }

    if (newPassword.length < 6) {
      return createErrorResponse(
        "La nueva contraseña debe tener al menos 6 caracteres"
      );
    }

    user.password = newPassword;
    return createSuccessResponse(undefined, "Password changed successfully");
  }

  // ========== DATOS DE DISPOSITIVOS ==========
  async getDevices(): Promise<Device[]> {
    await delay(300);
    console.log(
      `📊 [MOCK] Obteniendo datos de dispositivos desde: ${this.baseURL}`
    );

    // Generar datos aleatorios para simular datos en tiempo real
    const devicesData = this.generateRandomDevicesData();
    return devicesData.devices;
  }

  // ========== RESET DE FÁBRICA ==========
  async factoryReset(): Promise<ApiResponse> {
    await delay(1500);
    console.log(`🏭 [MOCK] Ejecutando reset de fábrica...`);

    // Simular reset - en la realidad reiniciaría el ESP32
    this.logout();

    return createSuccessResponse(
      undefined,
      "Dispositivo reiniciado a valores de fábrica"
    );
  }

  // ========== FUNCIONES DE WEBSOCKET MOCK ==========
  createWebSocketConnection(ip?: string): MockWebSocket {
    const wsIP = ip || this.baseURL.replace("http://", "");
    const wsUrl = `ws://${wsIP}:8080`;
    console.log(`🎭 [MOCK] Creando WebSocket mock a: ${wsUrl}`);
    return new MockWebSocket(wsUrl);
  }

  getWebSocketUrl(ip?: string): string {
    const wsIP = ip || this.baseURL.replace("http://", "");
    return `ws://${wsIP}:8080`;
  }

  generateRandomDevicesData(): DevicesData {
    const devices = mockDevicesData.devices.map((device) => ({
      ...device,
      Norte: Math.floor(Math.random() * 2000) + 100,
      Sur: Math.floor(Math.random() * 2000) + 100,
      Este: Math.floor(Math.random() * 2000) + 100,
      Oeste: Math.floor(Math.random() * 2000) + 100,
    }));

    return {
      devices,
      total_devices: devices.length,
      timestamp: Date.now(),
    };
  }
}

// ========== MOCK WEBSOCKET CLASS ==========
class MockWebSocket {
  public readyState: number = 1; // OPEN
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  private interval: any = null;
  public url: string;

  constructor(url: string) {
    this.url = url;
    console.log(`🎭 [MOCK WebSocket] Conectando a ${url}`);

    // Simular conexión exitosa
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
      this.startSendingData();
    }, 100);
  }

  private startSendingData() {
    this.interval = setInterval(() => {
      if (this.onmessage && this.readyState === 1) {
        const data = mockApiClient.generateRandomDevicesData();
        const event = new MessageEvent("message", {
          data: JSON.stringify(data),
        });
        this.onmessage(event);
      }
    }, 1000); // Enviar datos cada segundo
  }

  send(data: string) {
    console.log(`🎭 [MOCK WebSocket] Enviando:`, data);
  }

  close() {
    console.log(`🎭 [MOCK WebSocket] Cerrando conexión`);
    this.readyState = 3; // CLOSED
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.onclose) {
      this.onclose(new CloseEvent("close"));
    }
  }
}

// ========== INSTANCIA MOCK ==========
export const mockApiClient = new MockApiClient();

// ========== FUNCIONES DE AUTENTICACIÓN MOCK ==========
export const mockAuth = {
  login: (username: string, password: string) =>
    mockApiClient.login(username, password),
  logout: () => mockApiClient.logout(),
  isLoggedIn: () => mockApiClient.isLoggedIn(),
  isAdmin: () => mockApiClient.isAdmin(),
  isUser: () => mockApiClient.isUser(),
  getCurrentUser: () => mockApiClient.getCurrentUser(),
  getSessionId: () => mockApiClient.getSessionId(),
};

// ========== FUNCIONES DE API MOCK ==========
export const mockApi = {
  // Torre
  getTowerInfo: () => mockApiClient.getTowerInfo(),
  setTowerInfo: (towerInfo: TowerInfo) => mockApiClient.setTowerInfo(towerInfo),

  // WiFi
  setWiFiConfig: (config: WiFiConfig) => mockApiClient.setWiFiConfig(config),

  // LEDs
  toggleLed: (nodeNumber: number, ledState: boolean) =>
    mockApiClient.toggleLed(nodeNumber, ledState),

  // Usuarios
  getUsers: () => mockApiClient.getUsers(),
  updateUser: (
    username: string,
    password?: string,
    role?: UserRole,
    isActive?: boolean
  ) => mockApiClient.updateUser(username, password, role, isActive),
  changePassword: (
    username: string,
    oldPassword: string,
    newPassword: string
  ) => mockApiClient.changePassword(username, oldPassword, newPassword),

  // Sistema
  factoryReset: () => mockApiClient.factoryReset(),

  // Configuración
  updateBaseURL: (newIP: string) => mockApiClient.updateBaseURL(newIP),

  // WebSocket
  createWebSocketConnection: (ip?: string) =>
    mockApiClient.createWebSocketConnection(ip),
  getWebSocketUrl: (ip?: string) => mockApiClient.getWebSocketUrl(ip),
  generateRandomDevicesData: () => mockApiClient.generateRandomDevicesData(),
};

// ========== INFO DE CREDENCIALES PARA DESARROLLO ==========
export const MOCK_CREDENTIALS = {
  admin: { username: "admin", password: "admin123" },
  user: { username: "user", password: "user123" },
};

console.log(`🎭 [MOCK API] Sistema mock inicializado`);
console.log(`🔑 [MOCK] Credenciales disponibles:`, MOCK_CREDENTIALS);
