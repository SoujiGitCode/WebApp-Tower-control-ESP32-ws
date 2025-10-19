import { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CellTower as TowerIcon,
  MoreVert as MoreIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Timeline as RealtimeIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Device, DevicesData, DeviceThresholdConfig } from "../../api/index";
import { toast } from "react-toastify";

interface DeviceCardProps {
  device: Device;
  deviceConfig?: DeviceThresholdConfig;
  isLoadingValues?: boolean; // Indica si los valores están cargando desde WS
}

const DeviceCard = ({ device, deviceConfig, isLoadingValues = false }: DeviceCardProps) => {
  const { darkMode } = useAppContext();
  const navigate = useNavigate();

  const handleNavigateToRealTime = () => {
    navigate(`/real-time-data/${device.id}`, {
      state: { deviceConfig }
    });
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
      }}
      onClick={handleNavigateToRealTime}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header con icono y ID */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <TowerIcon sx={{ mr: 1, fontSize: 32, color: "primary.main" }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              Device #{device.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {device.unit_name} ({device.unit_symbol})
            </Typography>
          </Box>
          {/* Total removido según solicitud */}
        </Box>

        {/* Grid de fuerzas direccionales */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Norte
              </Typography>
              {isLoadingValues ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h6" fontWeight="bold">
                  {device.Norte}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Sur
              </Typography>
              {isLoadingValues ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h6" fontWeight="bold">
                  {device.Sur}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Este
              </Typography>
              {isLoadingValues ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h6" fontWeight="bold">
                  {device.Este}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                textAlign: "center",
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Oeste
              </Typography>
              {isLoadingValues ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h6" fontWeight="bold">
                  {device.Oeste}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Botón de acción */}
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <Chip
            icon={<RealtimeIcon />}
            label="Ver datos en tiempo real"
            clickable
            color="primary"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToRealTime();
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin, currentApi, devMode, esp32IP, darkMode, setDarkMode } =
    useAppContext();
  // Separar estados: devices iniciales vs datos en tiempo real
  const [devicesConfig, setDevicesConfig] = useState<DeviceThresholdConfig[] | null>(null);
  const [devicesInfo, setDevicesInfo] = useState<Device[] | null>(null); // Info básica de devices desde API
  const [realTimeData, setRealTimeData] = useState<{ [deviceId: number]: Device } | null>(null); // Datos WS por device
  const [loadingDevices, setLoadingDevices] = useState(false); // Cambiar a false inicialmente
  const [loadingWS, setLoadingWS] = useState(true); // Loading para WebSocket
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  
  // Ref para evitar llamadas duplicadas
  const isLoadingRef = useRef(false);

  // Manejar menú
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    toast.info("Sesión cerrada correctamente");
  };

  // Cargar configuración de dispositivos (thresholds)
  const loadDevicesConfig = async () => {
    if (devMode) return; // En dev mode no cargar thresholds reales
    
    // Verificar que el usuario esté autenticado
    if (!currentUser || !currentApi.getSessionId()) {
      console.warn("⚠️ Usuario no autenticado, no se cargan thresholds");
      return;
    }
    
    try {
      console.log("🔍 Cargando configuración de dispositivos...");
      const response = await currentApi.getDevicesStatus();
      if (response.status === "success" && response.data) {
        console.log("✅ Thresholds cargados:", response.data);
        setDevicesConfig(response.data.devices);
      } else {
        console.warn("⚠️ No se pudieron cargar los thresholds:", response.message);
      }
    } catch (error) {
      console.error("❌ Error cargando thresholds:", error);
    }
  };

  // Cargar devices desde la API para renderizado inmediato
  const loadDevicesFromAPI = async () => {
    // Prevenir llamadas duplicadas con ref
    if (isLoadingRef.current) {
      console.log("🔄 Ya hay una carga en progreso, omitiendo...");
      return;
    }
    
    isLoadingRef.current = true;
    setLoadingDevices(true);
    setError(null);
    
    try {
      console.log("🔍 Cargando devices desde API thresholds...");
      const response = await currentApi.getDevicesStatus();
      
      if (response.status === "success" && response.data) {
        console.log("✅ Devices cargados desde thresholds:", response.data);
        
        // Crear devices basándose SOLO en los thresholds configurados
        const devicesFromThresholds: Device[] = response.data.devices.map(config => ({
          id: config.device_id,
          unit_symbol: "N", // Default hasta que lleguen datos del WS
          unit_name: "Newton", // Default hasta que lleguen datos del WS  
          Norte: 0, // Se mostrarán como loading hasta obtener datos del WS
          Sur: 0,
          Este: 0,
          Oeste: 0
        }));
        
        setDevicesInfo(devicesFromThresholds);
        setDevicesConfig(response.data.devices);
        console.log(`📊 ${devicesFromThresholds.length} devices configurados y listos para mostrar`);
      } else {
        console.warn("⚠️ No se pudieron cargar devices:", response.message);
        setError("No se pudieron cargar los dispositivos configurados");
      }
    } catch (error) {
      console.error("❌ Error cargando devices desde API:", error);
      setError("Error al cargar dispositivos");
    } finally {
      setLoadingDevices(false);
      isLoadingRef.current = false;
    }
  };

  // Cargar configuración inicial de thresholds y devices
  useEffect(() => {
    console.log("🎯 useEffect evaluando:", {
      currentUser: !!currentUser,
      devicesInfo: !!devicesInfo,
      isLoadingRef: isLoadingRef.current
    });
    
    // Solo cargar si tenemos usuario y no hemos cargado ya
    if (currentUser && !devicesInfo && !isLoadingRef.current) {
      console.log("🚀 Iniciando carga inicial de devices...");
      loadDevicesFromAPI();
    }
  }, [currentUser]); // Solo depender de currentUser

  // Conectar WebSocket para obtener datos en tiempo real
  useEffect(() => {
    let ws: any = null;
    let reconnectTimeout: number | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3; // Límite de reintentos

    const connectWebSocket = () => {
      // No intentar reconectar si ya agotamos los intentos
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`🚫 Máximo de ${MAX_RECONNECT_ATTEMPTS} intentos de reconexión alcanzado`);
        setLoadingWS(false);
        return;
      }

      try {
        setLoadingWS(true);
        reconnectAttempts++;

        // Usar la IP configurada en devMode o la IP por defecto
        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          console.log("🔌 Dashboard WebSocket conectado");
          setLoadingWS(false);
          reconnectAttempts = 0; // Reset attempts on successful connection
        };

        ws.onmessage = (event) => {
          try {
            // Filtrar el mensaje inicial "Connected" que no es JSON válido
            if (event.data === "Connected" || event.data.toString().trim() === "Connected") {
              console.log("🔌 Mensaje de conexión recibido, ignorando...");
              return;
            }

            const data = JSON.parse(event.data) as DevicesData;
            console.log("📡 Datos WebSocket recibidos:", data);
            
            // Solo actualizar datos en tiempo real para devices ya configurados
            const deviceMap: { [deviceId: number]: Device } = {};
            data.devices.forEach(device => {
              // Solo incluir devices que ya tenemos configurados en thresholds
              const isConfigured = devicesConfig?.some(config => config.device_id === device.id);
              if (isConfigured) {
                deviceMap[device.id] = device;
              }
            });
            
            setRealTimeData(deviceMap);
            console.log(`🔄 Actualizados ${Object.keys(deviceMap).length} devices con datos en tiempo real`);
          } catch (err) {
            console.warn("⚠️ Error parseando datos WebSocket (probablemente mensaje no-JSON):", event.data);
          }
        };

        ws.onclose = () => {
          console.log("🔌 Dashboard WebSocket desconectado");
          setLoadingWS(false);
          
          // Solo reintentar si no estamos en devMode y no hemos agotado los intentos
          if (!devMode && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !reconnectTimeout) {
            console.log(`🔄 Reintentando conexión WebSocket (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) en 5 segundos...`);
            reconnectTimeout = window.setTimeout(() => {
              reconnectTimeout = null;
              connectWebSocket();
            }, 5000);
          }
        };

        ws.onerror = (error) => {
          console.warn("🔌 WebSocket error:", error);
          setLoadingWS(false);
          
          // Solo mostrar error si es crítico y no estamos en devMode
          if (!devMode && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            setError("No se pudo conectar al servidor WebSocket después de varios intentos");
          }
        };

        setWsConnection(ws);
      } catch (err) {
        console.warn("⚠️ Error creando conexión WebSocket:", err);
        setLoadingWS(false);
        reconnectAttempts++;
      }
    };

    // Solo intentar WebSocket si tenemos usuario autenticado y devices configurados
    if (currentUser && devicesConfig && devicesConfig.length > 0) {
      console.log("🚀 Iniciando conexión WebSocket para obtener datos en tiempo real...");
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [currentApi, devMode, esp32IP, currentUser, devicesConfig]); // Agregamos devicesConfig como dependencia

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard de Monitoreo
          </Typography>

          {/* Info del usuario */}
          <Chip
            icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
            label={`${currentUser?.username} (${currentUser?.role})`}
            variant="outlined"
            size="small"
            sx={{
              color: "white",
              borderColor: "white",
              mr: 2,
              "& .MuiChip-icon": { color: "white" },
            }}
          />

          {/* Toggle Dark/Light Mode */}
          <IconButton
            onClick={() => setDarkMode(!darkMode)}
            sx={{
              color: "white",
              mr: 1,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {/* Solo mostrar Panel de Administración si es admin */}
            {isAdmin && (
              <MenuItem onClick={() => navigate("/admin")}>
                <AdminIcon sx={{ mr: 1 }} />
                Panel de Administración
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Contenido principal */}
      <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
        {/* Loading inicial SOLO si realmente no tenemos nada y estamos cargando */}
        {loadingDevices && (!devicesInfo || devicesInfo.length === 0) && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
            }}
          >
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Cargando lista de dispositivos...
            </Typography>
          </Box>
        )}

        {/* Error de carga */}
        {error && !loadingDevices && (!devicesInfo || devicesInfo.length === 0) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Mostrar devices basándose SIEMPRE en los thresholds configurados */}
        {devicesInfo && devicesInfo.length > 0 && (
          <>
            {/* Header con estadísticas */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                Dispositivos Configurados
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body1" color="text.secondary">
                  Total de dispositivos: {devicesInfo.length}
                </Typography>
                {loadingWS && (
                  <>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Obteniendo datos en tiempo real...
                    </Typography>
                  </>
                )}
                {realTimeData && Object.keys(realTimeData).length > 0 && !loadingWS && (
                  <Typography variant="body2" color="success.main">
                    • {Object.keys(realTimeData).length} dispositivos con datos en tiempo real
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Grid de dispositivos */}
            <Grid container spacing={3}>
              {devicesInfo.map((device) => {
                const deviceConfig = devicesConfig?.find(config => config.device_id === device.id);
                // Si tenemos datos en tiempo real, usarlos; sino usar datos básicos
                const deviceWithRealTimeData = realTimeData?.[device.id] || device;
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={device.id}>
                    <DeviceCard 
                      device={deviceWithRealTimeData} 
                      deviceConfig={deviceConfig}
                      isLoadingValues={!realTimeData || !realTimeData[device.id]}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

        {/* Estado cuando no hay dispositivos y ya terminó de cargar */}
        {!loadingDevices && (!devicesInfo || devicesInfo.length === 0) && !error && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <TowerIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay dispositivos configurados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure dispositivos desde el panel de administración
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
