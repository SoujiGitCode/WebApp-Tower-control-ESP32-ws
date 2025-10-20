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
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Device, DevicesData, DeviceThresholdConfig, Sensor } from "../../api/index";
import { toast } from "react-toastify";

interface DeviceCardProps {
  device: Device;
  deviceConfig?: DeviceThresholdConfig;
  isLoadingValues?: boolean;
}

const DeviceCard = ({ device, deviceConfig, isLoadingValues = false }: DeviceCardProps) => {
  const { darkMode } = useAppContext();
  const navigate = useNavigate();

  const handleNavigateToRealTime = () => {
    navigate(`/real-time-data/${device.device_id}`, {
      state: { deviceConfig }
    });
  };

  // Función para obtener el color del sensor según su estado de alarma
  const getSensorColor = (sensor: Sensor) => {
    if (sensor.alarm_triggered) {
      return "#ef4444"; // Rojo para alarma
    }
    return "#22c55e"; // Verde para normal
  };

  // Verificar si hay alguna alarma activa en el dispositivo
  const hasActiveAlarms = device.sensors.some(sensor => sensor.alarm_triggered);

  // Verificar si faltan sensores
  const expectedSensors = device.device_config === "3_sensores" ? 3 : 4;
  const missingSensors = expectedSensors - device.sensors.length;
  const hasMissingSensors = missingSensors > 0;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.3s ease",
        border: hasActiveAlarms ? "2px solid #ef4444" : "1px solid",
        borderColor: hasActiveAlarms ? "#ef4444" : "divider",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
        // Efecto de parpadeo si hay alarmas
        ...(hasActiveAlarms && {
          animation: 'pulse 1.5s infinite',
          '@keyframes pulse': {
            '0%': { boxShadow: '0 0 5px #ef4444' },
            '50%': { boxShadow: '0 0 20px #ef4444' },
            '100%': { boxShadow: '0 0 5px #ef4444' },
          },
        }),
      }}
      onClick={handleNavigateToRealTime}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header con icono y ID */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <TowerIcon sx={{ mr: 1, fontSize: 32, color: hasActiveAlarms ? "error.main" : "primary.main" }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              Nivel #{device.device_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {device.units} • {device.device_config === "3_sensores" ? "3 Sensores" : "4 Sensores"}
            </Typography>
          </Box>
          {hasActiveAlarms && (
            <Chip
              icon={<WarningIcon />}
              label="ALARMA"
              color="error"
              size="small"
              sx={{ 
                fontWeight: 600,
                animation: 'blink 1s infinite',
                '@keyframes blink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0.6 },
                },
              }}
            />
          )}
        </Box>

        {/* Alerta de sensores faltantes */}
        {hasMissingSensors && (
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ 
              mb: 2,
              fontSize: '0.875rem',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="body2" fontWeight="600">
              ⚠️ Sensores incompletos
            </Typography>
            <Typography variant="caption">
              Se esperan <strong>{expectedSensors} sensores</strong> pero solo se {device.sensors.length === 1 ? 'detectó' : 'detectaron'} <strong>{device.sensors.length}</strong>.
              {missingSensors === 1 ? ' Falta 1 sensor.' : ` Faltan ${missingSensors} sensores.`}
            </Typography>
          </Alert>
        )}

        {/* Grid de sensores */}
        <Grid container spacing={2}>
          {device.sensors.map((sensor) => (
            <Grid item xs={6} key={sensor.id}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 1,
                  bgcolor: sensor.alarm_triggered ? "rgba(239, 68, 68, 0.1)" : "action.hover",
                  borderRadius: 1,
                  border: sensor.alarm_triggered ? "2px solid #ef4444" : "none",
                }}
              >
                <Typography
                  variant="caption"
                  color={sensor.alarm_triggered ? "error.main" : "text.secondary"}
                  display="block"
                  fontWeight={sensor.alarm_triggered ? 600 : 400}
                >
                  {sensor.name}
                </Typography>
                {isLoadingValues ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    sx={{ color: getSensorColor(sensor) }}
                  >
                    {sensor.value.toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Botón de acción */}
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <Chip
            icon={<RealtimeIcon />}
            label="Ver datos en tiempo real"
            clickable
            color={hasActiveAlarms ? "error" : "primary"}
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
  
  // Estados simplificados
  const [devicesData, setDevicesData] = useState<Device[]>([]);
  const [statistics, setStatistics] = useState<{ total_devices: number; connected_clients: number; total_alarms: number } | null>(null);
  const [loadingWS, setLoadingWS] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [expectedLevelsCount, setExpectedLevelsCount] = useState<number | null>(null);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  // Delay mínimo de loading para evitar mostrar error prematuramente
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 1500); // 1.5 segundos de delay mínimo

    return () => clearTimeout(timer);
  }, []);

  // Cargar expected levels count desde localStorage
  useEffect(() => {
    const storedLevelsCount = localStorage.getItem('tower_levels_count');
    if (storedLevelsCount) {
      setExpectedLevelsCount(parseInt(storedLevelsCount, 10));
      console.log('📊 Expected levels count:', storedLevelsCount);
    }
  }, []);

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

  // Conectar WebSocket para obtener datos en tiempo real
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;

    const connectWebSocket = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`🚫 Máximo de ${MAX_RECONNECT_ATTEMPTS} intentos de reconexión alcanzado`);
        setLoadingWS(false);
        return;
      }

      try {
        setLoadingWS(true);
        reconnectAttempts++;

        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          console.log("🔌 Dashboard WebSocket conectado");
          setLoadingWS(false);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            if (event.data === "Connected" || event.data.toString().trim() === "Connected") {
              console.log("🔌 Mensaje de conexión recibido");
              return;
            }

            const data = JSON.parse(event.data) as DevicesData;
            console.log("📡 Datos WebSocket recibidos:", data);
            
            setDevicesData(data.devices);
            setStatistics(data.statistics);
          } catch (err) {
            console.warn("⚠️ Error parseando datos WebSocket:", event.data);
          }
        };

        ws.onclose = () => {
          console.log("🔌 Dashboard WebSocket desconectado");
          setLoadingWS(false);
          
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
          
          if (!devMode && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            setError("No se pudo conectar al servidor WebSocket");
          }
        };

        setWsConnection(ws);
      } catch (err) {
        console.warn("⚠️ Error creando conexión WebSocket:", err);
        setLoadingWS(false);
        reconnectAttempts++;
      }
    };

    if (currentUser) {
      console.log("🚀 Iniciando conexión WebSocket...");
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
        {/* Loading inicial (mostrar siempre durante el delay mínimo SOLO si no hay datos) */}
        {(!devicesData || devicesData.length === 0) && (
          <>
            {(loadingWS || !minLoadingComplete) && (
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
                  Conectando con el servidor...
                </Typography>
              </Box>
            )}

            {/* Error de carga (solo mostrar después del delay mínimo) */}
            {error && minLoadingComplete && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}

        {/* Mostrar niveles */}
        {devicesData && devicesData.length > 0 && (
          <>
            {/* Header con estadísticas */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                Niveles de Monitoreo
              </Typography>
              
              {/* Warning si faltan niveles (Gateway puede tener 1-4 niveles) */}
              {expectedLevelsCount && devicesData.length < expectedLevelsCount && (
                <Alert 
                  severity="warning" 
                  icon={<WarningIcon />}
                  sx={{ 
                    mb: 2,
                    fontWeight: 500,
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                >
                  <Typography variant="body1" fontWeight="600">
                    Niveles incompletos detectados
                  </Typography>
                  <Typography variant="body2">
                    Se {expectedLevelsCount === 1 ? 'espera' : 'esperan'} <strong>{expectedLevelsCount} {expectedLevelsCount === 1 ? 'nivel' : 'niveles'}</strong> pero solo se {devicesData.length === 1 ? 'detectó' : 'detectaron'} <strong>{devicesData.length}</strong>.
                    {expectedLevelsCount - devicesData.length === 1 
                      ? ' Falta 1 nivel.' 
                      : ` Faltan ${expectedLevelsCount - devicesData.length} niveles.`}
                  </Typography>
                </Alert>
              )}
              
              {statistics && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Chip 
                    label={`Total de niveles: ${statistics.total_devices}`}
                    color="primary"
                    variant="outlined"
                  />
                  {statistics.total_alarms > 0 && (
                    <Chip 
                      icon={<WarningIcon />}
                      label={`Alarmas activas: ${statistics.total_alarms}`}
                      color="error"
                      sx={{ 
                        fontWeight: 600,
                        animation: 'blink 1s infinite',
                        '@keyframes blink': {
                          '0%, 50%': { opacity: 1 },
                          '51%, 100%': { opacity: 0.7 },
                        },
                      }}
                    />
                  )}
                  {loadingWS && (
                    <>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Actualizando datos...
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>

            {/* Grid de niveles */}
            <Grid container spacing={3}>
              {devicesData.map((device) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={device.device_id}>
                  <DeviceCard 
                    device={device}
                    isLoadingValues={loadingWS}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Estado cuando no hay dispositivos */}
        {!loadingWS && (!devicesData || devicesData.length === 0) && !error && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <TowerIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay niveles disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Esperando datos del servidor...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
