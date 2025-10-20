import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  MoreVert as MoreIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Device, DevicesData, Sensor } from "../../api/index";

// Importar componentes de visualización
import { TowerView } from "../../components/RealTimeData/TowerView";
import ThresholdSettings from "../../components/ThresholdSettings";

const RealTimeData = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, setDarkMode, currentApi, devMode, esp32IP, isAdmin, logout } = useAppContext();

  // Estados simplificados
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  // Delay mínimo de loading para evitar mostrar error prematuramente
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 1500); // 1.5 segundos de delay mínimo

    return () => clearTimeout(timer);
  }, []);

  // Handlers para settings
  const handleOpenSettings = () => setOpenSettings(true);
  const handleCloseSettings = () => setOpenSettings(false);

  // Handlers para el menú
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
    logout();
    handleMenuClose();
    toast.info("Sesión cerrada correctamente");
    navigate("/login");
  };

  const handleAdminPanel = () => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
    handleMenuClose();
    navigate("/admin");
  };

  // Función optimizada para navegar al dashboard
  const handleNavigateToHome = () => {
    if (isNavigating) return;
    
    console.log("🚀 Navegando al dashboard...");
    
    try {
      setIsNavigating(true);
      
      if (wsConnection) {
        wsConnection.close();
        setWsConnection(null);
      }
      
      setCurrentDevice(null);
      setError(null);
      setLoading(false);
      
      navigate("/dashboard", { 
        replace: true,
        state: { 
          timestamp: Date.now(),
          fromDevice: deviceId 
        }
      });
      
    } catch (error) {
      console.error("❌ Error durante la navegación:", error);
      window.location.href = "/dashboard";
    }
  };

  // Conectar WebSocket
  useEffect(() => {
    if (isNavigating) return;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;

    const connectWebSocket = async () => {
      if (isNavigating) return;
      
      try {
        setError(null);
        console.log("🔌 Intentando conectar WebSocket...");
        
        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          if (isNavigating) return;
          console.log("🔌 RealTimeData WebSocket conectado");
          setLoading(false);
        };

        ws.onmessage = (event: MessageEvent) => {
          if (isNavigating) return;
          try {
            if (event.data === "Connected" || event.data.toString().trim() === "Connected") {
              return;
            }

            const data = JSON.parse(event.data) as DevicesData;
            if (data && data.devices && Array.isArray(data.devices)) {
              // Buscar el device específico
              const device = data.devices.find(d => d.device_id === Number(deviceId));
              if (device) {
                setCurrentDevice(device);
                setLoading(false);
                setError(null);
              }
            }
          } catch (err) {
            console.error("Error parseando datos WebSocket:", err);
          }
        };

        ws.onclose = () => {
          console.log("🔌 RealTimeData WebSocket desconectado");
          setWsConnection(null);
          
          if (!isNavigating) {
            console.log("🔄 Programando reconexión en 2 segundos...");
            reconnectTimeout = setTimeout(() => {
              if (!isNavigating) {
                connectWebSocket();
              }
            }, 2000);
          }
        };

        ws.onerror = (error: Event) => {
          console.error("🔌 Error en RealTimeData WebSocket:", error);
          
          if (!devMode && !isNavigating) {
            setTimeout(() => {
              if (!currentDevice && !isNavigating) {
                setError("Error de conexión con el servidor");
              }
            }, 5000);
          }
          
          setWsConnection(null);
          setLoading(false);
        };

        setWsConnection(ws);
      } catch (err) {
        console.error("Error creando conexión WebSocket:", err);
        
        if (!devMode && !isNavigating) {
          setTimeout(() => {
            if (!currentDevice && !isNavigating) {
              setError("No se pudo conectar al servidor");
            }
          }, 5000);
        }
        
        setWsConnection(null);
        setLoading(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
        setWsConnection(null);
      }
    };
  }, [currentApi, devMode, esp32IP, isNavigating, deviceId]);

  // Mostrar loading (siempre mostrar al menos durante el delay mínimo)
  if ((loading && !currentDevice) || !minLoadingComplete) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: darkMode
            ? "linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #64748b 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
          p: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{ textAlign: "center", maxWidth: 400 }}>
          <CircularProgress
            size={60}
            sx={{ color: darkMode ? "#60a5fa" : "#3b82f6", mb: 3 }}
          />
          <Typography
            variant="h6"
            sx={{ 
              color: "text.primary", 
              fontWeight: 500,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              mb: 1
            }}
          >
            Cargando datos en tiempo real...
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: "text.secondary",
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Conectando con el nivel #{deviceId}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Manejo de errores (solo después del delay mínimo)
  if (error && !currentDevice && minLoadingComplete) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: darkMode
            ? "linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #64748b 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
          p: { xs: 2, sm: 3 },
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: { xs: '100%', sm: 400 }, 
            borderRadius: 2,
            width: '100%'
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
              sx={{ mt: 1 }}
            >
              Reintentar
            </Button>
          }
        >
          <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
            Error de Conexión
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Si no hay dispositivo actual (solo mostrar después del delay mínimo)
  if (!currentDevice && minLoadingComplete) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: darkMode
            ? "linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #64748b 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
          p: { xs: 2, sm: 3 },
        }}
      >
        <Alert 
          severity="warning" 
          sx={{ 
            maxWidth: { xs: '100%', sm: 400 }, 
            borderRadius: 2,
            width: '100%'
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/dashboard')}
              sx={{ mt: 1 }}
            >
              Volver al Dashboard
            </Button>
          }
        >
          <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
            Nivel No Encontrado
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
            No se pudo encontrar el nivel con ID: {deviceId}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Verificar si hay alarmas activas
  const hasActiveAlarms = currentDevice.sensors.some(sensor => sensor.alarm_triggered);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: darkMode
          ? "linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #64748b 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
      }}
    >
      {/* AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: darkMode
            ? "linear-gradient(90deg, #334155 0%, #475569 50%, #64748b 100%)"
            : "linear-gradient(90deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)",
          borderBottom: darkMode ? "1px solid #374151" : "1px solid #e2e8f0",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton
            edge="start"
            onClick={handleNavigateToHome}
            disabled={isNavigating}
            sx={{
              mr: 2,
              color: "text.primary",
              bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                bgcolor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                color: "text.disabled",
              },
              transition: "all 0.2s ease",
            }}
          >
            {isNavigating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <BackIcon />
            )}
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: hasActiveAlarms ? "error.main" : "text.primary",
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              Nivel #{currentDevice.device_id}
              {hasActiveAlarms && " 🚨"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                fontWeight: 500,
              }}
            >
              {currentDevice.units} • {currentDevice.device_config === "3_sensores" ? "3 Sensores" : "4 Sensores"}
            </Typography>
          </Box>
          {/* Botón de Settings - Solo para Admin */}
          {isAdmin && (
            <IconButton
              onClick={handleOpenSettings}
              sx={{
                color: "text.primary",
                bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                mr: 1,
                "&:hover": {
                  bgcolor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <SettingsIcon />
            </IconButton>
          )}
          {/* Toggle Dark/Light Mode */}
          <IconButton
            onClick={() => setDarkMode(!darkMode)}
            sx={{
              color: "text.primary",
              bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              mr: 1,
              "&:hover": {
                bgcolor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Menú de opciones */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              color: "text.primary",
              bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <MoreIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {/* Solo mostrar Panel de Administración si es admin */}
            {isAdmin && (
              <MenuItem onClick={handleAdminPanel}>
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

      {/* Contenido Principal */}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Vista de Torre con Tabs */}
          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                background: darkMode
                  ? "linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)"
                  : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                border: darkMode ? "1px solid #6b7280" : "1px solid #E2E8F0",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
                >
                  Vista de Torre (Tensión en Tiempo Real)
                </Typography>

                {/* Warning si faltan sensores (cada nivel puede tener 3-4 sensores) */}
                {(() => {
                  const expectedSensors = currentDevice.device_config === "3_sensores" ? 3 : 4;
                  const missingSensors = expectedSensors - currentDevice.sensors.length;
                  const hasMissingSensors = missingSensors > 0;

                  return hasMissingSensors ? (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mb: 3,
                        fontWeight: 500,
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <Typography variant="body1" fontWeight="600">
                        ⚠️ Sensores incompletos
                      </Typography>
                      <Typography variant="body2">
                        Se esperan <strong>{expectedSensors} sensores</strong> pero solo se {currentDevice.sensors.length === 1 ? 'detectó' : 'detectaron'} <strong>{currentDevice.sensors.length}</strong>.
                        {missingSensors === 1 ? ' Falta 1 sensor.' : ` Faltan ${missingSensors} sensores.`}
                      </Typography>
                    </Alert>
                  ) : null;
                })()}

                {/* Vista de Torre */}
                <TowerView 
                  device={currentDevice} 
                  darkMode={darkMode}
                />

                {/* Leyenda */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    background: darkMode
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.02)",
                    border: darkMode
                      ? "1px solid rgba(255,255,255,0.25)"
                      : "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 1.5,
                      fontWeight: 600,
                      color: "text.secondary",
                      textAlign: "center",
                    }}
                  >
                    Leyenda de Estados
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: { xs: 1, sm: 2 },
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      label="✅ Normal"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip
                      label="🚨 Alarma"
                      color="error"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Estado de Sensores */}
          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                background: darkMode
                  ? "linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)"
                  : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                border: darkMode ? "1px solid #6b7280" : "1px solid #E2E8F0",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ mb: 3, fontWeight: 600, color: "text.primary" }}
                >
                  Estado por Sensor
                </Typography>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {currentDevice.sensors.map((sensor, index) => {
                    // Definir colores y gradientes según el índice
                    const sensorStyles = [
                      {
                        icon: "🧭",
                        gradient: darkMode
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)"
                          : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)",
                      },
                      {
                        icon: "🧭",
                        gradient: darkMode
                          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)"
                          : "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)",
                      },
                      {
                        icon: "➡️",
                        gradient: darkMode
                          ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)"
                          : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)",
                      },
                      {
                        icon: "⬅️",
                        gradient: darkMode
                          ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)"
                          : "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)",
                      },
                    ];
                    
                    const style = sensorStyles[index] || sensorStyles[0];
                    const sensorColor = sensor.alarm_triggered ? "#ef4444" : "#22c55e";
                    
                    return (
                      <Grid item xs={12} sm={6} key={sensor.id}>
                        <Box
                          sx={{
                            p: { xs: 2, sm: 2.5 },
                            background: style.gradient,
                            border: `2px solid ${sensorColor}`,
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 25px -8px ${sensorColor}`,
                            },
                            // Efecto de parpadeo para alarmas activas
                            ...(sensor.alarm_triggered && {
                              animation: 'pulse 1.5s infinite',
                              '@keyframes pulse': {
                                '0%': { boxShadow: `0 0 5px ${sensorColor}` },
                                '50%': { boxShadow: `0 0 20px ${sensorColor}` },
                                '100%': { boxShadow: `0 0 5px ${sensorColor}` },
                              },
                            }),
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography sx={{ fontSize: "1.2rem" }}>
                                {style.icon}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                {sensor.name}
                              </Typography>
                            </Box>
                            <Chip
                              label={sensor.alarm_triggered ? "🚨 ALARMA" : "✅ Normal"}
                              color={sensor.alarm_triggered ? "error" : "success"}
                              size="small"
                              sx={{ 
                                fontWeight: 500,
                                ...(sensor.alarm_triggered && {
                                  animation: 'blink 1s infinite',
                                  '@keyframes blink': {
                                    '0%, 50%': { opacity: 1 },
                                    '51%, 100%': { opacity: 0.5 },
                                  },
                                }),
                              }}
                            />
                          </Box>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: sensorColor,
                              fontSize: { xs: "1.25rem", sm: "1.5rem" },
                            }}
                          >
                            {sensor.value.toFixed(2)} {currentDevice.units}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Modal de configuración de umbrales */}
      <ThresholdSettings
        open={openSettings}
        onClose={handleCloseSettings}
        deviceId={Number(deviceId)}
      />
    </Box>
  );
};

export default RealTimeData;
