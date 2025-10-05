import { useState, useEffect } from "react";
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
  const { currentUser, logout, isAdmin, currentApi, devMode, esp32IP } =
    useAppContext();
  // Separar estados: devices iniciales vs datos en tiempo real
  const [devicesConfig, setDevicesConfig] = useState<DeviceThresholdConfig[] | null>(null);
  const [devicesInfo, setDevicesInfo] = useState<Device[] | null>(null); // Info básica de devices desde API
  const [realTimeData, setRealTimeData] = useState<{ [deviceId: number]: Device } | null>(null); // Datos WS por device
  const [loadingDevices, setLoadingDevices] = useState(true); // Loading para devices desde API
  const [loadingWS, setLoadingWS] = useState(true); // Loading para WebSocket
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

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
    // Evitar llamadas duplicadas
    if (loadingDevices) {
      console.log("🔄 Ya hay una carga en progreso, omitiendo...");
      return;
    }
    
    setLoadingDevices(true);
    setError(null);
    
    try {
      console.log("🔍 Cargando devices desde API...");
      const response = await currentApi.getDevicesStatus();
      
      if (response.status === "success" && response.data) {
        console.log("✅ Devices cargados desde API:", response.data);
        
        // Extraer solo la información básica de los devices
        const basicDevices: Device[] = response.data.devices.map(config => ({
          id: config.device_id,
          unit_symbol: "N", // Default, se actualizará con WS
          unit_name: "Newton", // Default, se actualizará con WS  
          Norte: 0, // Se mostrarán como loading hasta obtener datos del WS
          Sur: 0,
          Este: 0,
          Oeste: 0
        }));
        
        setDevicesInfo(basicDevices);
        setDevicesConfig(response.data.devices);
      } else {
        console.warn("⚠️ No se pudieron cargar devices:", response.message);
        setError("No se pudieron cargar los dispositivos");
      }
    } catch (error) {
      console.error("❌ Error cargando devices desde API:", error);
      setError("Error al cargar dispositivos");
    } finally {
      // Quitar el loading inmediatamente después de obtener la lista de devices
      // No esperar al WebSocket
      setLoadingDevices(false);
    }
  };

  // Cargar configuración inicial de thresholds y devices
  useEffect(() => {
    // Solo cargar si tenemos usuario y no tenemos devices ya cargados
    if (currentUser && !devicesInfo) {
      console.log("🚀 Iniciando carga inicial de devices...");
      loadDevicesFromAPI();
    }
  }, [currentUser]); // Dependencias simplificadas

  // Conectar WebSocket para obtener datos en tiempo real
  useEffect(() => {
    let ws: any = null;
    let reconnectTimeout: number | null = null;

    const connectWebSocket = () => {
      try {
        setLoadingWS(true);

        // Usar la IP configurada en devMode o la IP por defecto
        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          console.log("🔌 Dashboard WebSocket conectado");
          setLoadingWS(false);
        };

        ws.onmessage = (event) => {
          try {
            // Filtrar el mensaje inicial "Connected" que no es JSON válido
            if (event.data === "Connected" || event.data.toString().trim() === "Connected") {
              console.log("🔌 Mensaje de conexión recibido, ignorando...");
              return;
            }

            const data = JSON.parse(event.data) as DevicesData;
            
            // Convertir array de devices en objeto indexado por ID para fácil acceso
            const deviceMap: { [deviceId: number]: Device } = {};
            data.devices.forEach(device => {
              deviceMap[device.id] = device;
            });
            
            setRealTimeData(deviceMap);
            
            // También actualizar la info básica de units si no la tenemos
            if (!devicesInfo || devicesInfo.length === 0) {
              setDevicesInfo(data.devices);
            }
          } catch (err) {
            console.warn("⚠️ Error parseando datos WebSocket (probablemente mensaje no-JSON):", event.data);
          }
        };

        ws.onclose = () => {
          console.log("🔌 Dashboard WebSocket desconectado");
          setLoadingWS(false);
          
          // En modo desarrollo, no intentar reconectar
          if (!devMode && !reconnectTimeout) {
            console.log("🔄 Reintentando conexión WebSocket en 5 segundos...");
            reconnectTimeout = window.setTimeout(() => {
              reconnectTimeout = null;
              connectWebSocket();
            }, 5000);
          }
        };

        ws.onerror = (error) => {
          console.warn("🔌 WebSocket error (normal en devMode):", error);
          setLoadingWS(false);
          
          // En devMode o si no tenemos devices, no mostrar error
          if (!devMode && (!devicesInfo || devicesInfo.length === 0)) {
            setError("Error de conexión con el servidor WebSocket");
          }
        };

        setWsConnection(ws);
      } catch (err) {
        console.warn("⚠️ Error creando conexión WebSocket:", err);
        setLoadingWS(false);
        
        // Solo mostrar error si es crítico y no estamos en devMode
        if (!devMode && (!devicesInfo || devicesInfo.length === 0)) {
          setError("No se pudo conectar al servidor WebSocket");
        }
      }
    };

    // Solo intentar WebSocket si tenemos usuario autenticado
    if (currentUser) {
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
  }, [currentApi, devMode, esp32IP, currentUser]);

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

        {/* Mostrar devices tan pronto como los tengamos de la API */}
        {devicesInfo && devicesInfo.length > 0 && (
          <>
            {/* Header con estadísticas */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                Dispositivos Activos
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body1" color="text.secondary">
                  Total de dispositivos: {devicesInfo.length}
                </Typography>
                {loadingWS && (
                  <>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Conectando datos en tiempo real...
                    </Typography>
                  </>
                )}
                {realTimeData && !loadingWS && (
                  <Typography variant="body2" color="success.main">
                    • Datos en tiempo real activos
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Grid de dispositivos */}
            <Grid container spacing={3}>
              {devicesInfo.map((device) => {
                const deviceConfig = devicesConfig?.find(config => config.device_id === device.id);
                // Combinar datos básicos con datos en tiempo real si están disponibles
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
