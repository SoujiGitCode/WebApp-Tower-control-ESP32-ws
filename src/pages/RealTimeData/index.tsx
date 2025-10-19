import { useState, useEffect, useMemo } from "react";
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
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from "@mui/icons-material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Device, DevicesData, DeviceThresholdConfig } from "../../api/index";
import useAlarmSystem from "../../hooks/useAlarmSystem";

// Importar todos los componentes de visualización
import { TowerView } from "../../components/RealTimeData/TowerView";
import { RadarChart } from "@components/RealTimeData/RadarChart";
import { GaugeChart } from "@components/RealTimeData/GaugeChart";
import { HeatmapChart } from "@components/RealTimeData/HeatmapChart";
import ThresholdSettings from "../../components/ThresholdSettings";
// import BarChart from "../../components/RealTimeData/BarChart";

// Tipo para las diferentes vistas disponibles
type ChartType = "circles" | "bar" | "radar" | "gauges" | "heatmap";

const RealTimeData = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, setDarkMode, currentApi, devMode, esp32IP, isAdmin } = useAppContext();

  // Estados optimizados para mejor rendimiento mobile
  const [devicesData, setDevicesData] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false); // Cambiar a false para carga no bloqueante
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<any>(null);
  const [chartType, setChartType] = useState<ChartType>("circles");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isRequiredSetup, setIsRequiredSetup] = useState(false);
  const [hasCheckedThresholds, setHasCheckedThresholds] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Nuevo estado
  const [deviceConfig, setDeviceConfig] = useState<DeviceThresholdConfig | undefined>(
    location.state?.deviceConfig
  );

  // Sistema de alarmas con configuración estable - SOLO si hay deviceConfig
  const alarmSystemConfig = useMemo(() => {
    // No inicializar el sistema de alarmas hasta tener deviceConfig
    if (!deviceConfig || !hasCheckedThresholds) {
      return null;
    }
    
    // Calcular el interval basado en el tiempo más pequeño de thresholds
    const minTime = Math.min(
      deviceConfig.alarm_times.time_low_low || 60,
      deviceConfig.alarm_times.time_low || 60,
      deviceConfig.alarm_times.time_high || 60,
      deviceConfig.alarm_times.time_high_high || 60
    );
    
    // Interval debe ser 1 segundo para llenar buffers correctamente
    const updateInterval = 1000; // 1 segundo fijo
    
    console.log(`🔧 Configurando sistema de alarmas con interval: ${updateInterval}ms (min threshold time: ${minTime}s)`);
    
    return {
      devices: devicesData,
      devicesConfig: [deviceConfig],
      updateInterval,
      devMode, // Pasar devMode para controlar si llama API real
    };
  }, [devicesData.length, deviceConfig?.device_id, deviceConfig?.active, devMode, hasCheckedThresholds]);

  const {
    alarmStates,
    getActiveAlarms,
    getCableAlarmState,
    getCableAverage,
  } = useAlarmSystem(alarmSystemConfig || {
    devices: [],
    devicesConfig: null,
    updateInterval: 1000, // 1 segundo por defecto
    devMode,
  });

  const currentDevice = useMemo(() => 
    devicesData.find((device) => device.id === Number(deviceId)),
    [devicesData, deviceId]
  );

  const handleConfigUpdate = (newConfig: DeviceThresholdConfig) => {
    setDeviceConfig(newConfig);
    setIsRequiredSetup(false); // Ya no es configuración obligatoria después de guardar
  };

  // Verificar si existen thresholds para este dispositivo (simplificado)
  const checkDeviceThresholds = async () => {
    if (hasCheckedThresholds || !isAdmin || isNavigating) {
      return; // Solo verificar una vez y solo para admins
    }
    
    try {
      console.log(`🔍 Verificando thresholds para device ${deviceId}...`);
      
      // Marcar como verificado inmediatamente para evitar múltiples llamadas
      setHasCheckedThresholds(true);
      
      const response = await currentApi.getThresholds();
      
      if (response.status === 'success' && response.data) {
        // Manejo simple de la estructura de respuesta
        let thresholds: any[] = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).thresholds || [];
        
        const deviceThreshold = thresholds.find(threshold => threshold.device_id === Number(deviceId));
        
        if (!deviceThreshold) {
          console.log(`⚠️ No se encontraron thresholds para device ${deviceId}`);
          // Solo abrir modal si no estamos navegando
          if (!isNavigating) {
            setIsRequiredSetup(true);
            setSettingsOpen(true);
          }
        } else {
          console.log(`✅ Thresholds encontrados para device ${deviceId}`);
          
          // Solo crear config si no la tenemos
          if (!deviceConfig) {
            const configFromAPI: DeviceThresholdConfig = {
              device_id: deviceThreshold.device_id,
              active: deviceThreshold.active,
              thresholds: {
                low_low: deviceThreshold.low_low,
                low: deviceThreshold.low,
                high: deviceThreshold.high,
                high_high: deviceThreshold.high_high,
              },
              alarm_times: {
                time_low_low: deviceThreshold.time_low_low || 60,
                time_low: deviceThreshold.time_low || 30,
                time_high: deviceThreshold.time_high || 300,
                time_high_high: deviceThreshold.time_high_high || 30,
              },
            };
            setDeviceConfig(configFromAPI);
          }
        }
      } else {
        console.warn('⚠️ Error en respuesta de thresholds:', response.message);
        // Solo mostrar modal en caso de error si no estamos navegando
        if (!isNavigating) {
          setIsRequiredSetup(true);
          setSettingsOpen(true);
        }
      }
    } catch (error) {
      console.error('❌ Error verificando thresholds:', error);
      // En caso de error, no bloquear la aplicación
      // Solo mostrar modal si es crítico y no estamos navegando
      if (!isNavigating && !deviceConfig) {
        setIsRequiredSetup(true);
        setSettingsOpen(true);
      }
    }
  };

  // Función optimizada para navegar al dashboard (especialmente para móviles)
  const handleNavigateToHome = () => {
    if (isNavigating) return; // Evitar navegaciones múltiples
    
    console.log("🚀 Iniciando navegación optimizada al dashboard...");
    
    try {
      setIsNavigating(true);
      
      // Limpiar inmediatamente para móviles
      if (wsConnection) {
        wsConnection.close();
        setWsConnection(null);
      }
      
      // Limpiar estados para liberar memoria en móviles
      setDevicesData([]);
      setError(null);
      setLoading(false);
      
      // Usar React Router de forma directa para mejor rendimiento
      navigate("/dashboard", { 
        replace: true,
        state: { 
          timestamp: Date.now(),
          fromDevice: deviceId 
        }
      });
      
    } catch (error) {
      console.error("❌ Error durante la navegación:", error);
      // Fallback robusto para móviles
      window.location.href = "/dashboard";
    }
  };

  const getCableColor = (force: number, cable?: string) => {
    // Primero evaluar usando thresholds instantáneos (siempre)
    if (deviceConfig?.thresholds) {
      const { low_low, low, high, high_high } = deviceConfig.thresholds;
      
      // Crítico: menor o igual a low_low O mayor o igual a high_high
      if (force <= low_low || force >= high_high) {
        return "#ef4444"; // Crítico - Rojo
      }
      
      // Alerta: entre low_low y low O entre high y high_high
      if ((force > low_low && force <= low) || (force >= high && force < high_high)) {
        return "#f59e0b"; // Alerta - Amarillo
      }
      
      // Normal: entre low y high
      return "#22c55e"; // Normal - Verde
    }

    // Si tenemos sistema de alarmas activo y hay una alarma, usar colores de alarma
    if (cable && currentDevice && deviceConfig?.active) {
      const alarmState = getCableAlarmState(currentDevice.id, cable);
      if (alarmState.isActive) {
        switch (alarmState.type) {
          case 'low_low':
          case 'high_high':
            return "#ef4444"; // Crítico/Alarma - Rojo
          case 'low':
          case 'high':
            return "#f59e0b"; // Alerta - Amarillo
          default:
            break;
        }
      }
    }
    
    // Fallback a lógica anterior cuando no hay configuración de thresholds
    if (force < 1500) return "#22c55e"; // Normal - Verde
    if (force < 2000) return "#f59e0b"; // Alerta - Amarillo
    return "#ef4444"; // Crítico - Rojo
  };

  const getForceStatus = (force: number, cable?: string) => {
    // Primero evaluar usando thresholds instantáneos (siempre)
    if (deviceConfig?.thresholds) {
      const { low_low, low, high, high_high } = deviceConfig.thresholds;
      
      // Crítico: menor o igual a low_low O mayor o igual a high_high
      if (force <= low_low || force >= high_high) {
        return { label: "🚨 Crítico", color: "error" as const, isAlarm: false };
      }
      // Alerta: entre low_low y low O entre high y high_high
      else if ((force > low_low && force <= low) || (force >= high && force < high_high)) {
        return { label: "⚠️ Alerta", color: "warning" as const, isAlarm: false };
      }
      // Normal: entre low y high
      else {
        return { label: "✅ Normal", color: "success" as const, isAlarm: false };
      }
    }

    // Si tenemos sistema de alarmas activo y hay una alarma, usar estados de alarma
    if (cable && currentDevice && deviceConfig?.active) {
      const alarmState = getCableAlarmState(currentDevice.id, cable);
      if (alarmState.isActive) {
        switch (alarmState.type) {
          case 'low_low':
          case 'high_high':
            return { 
              label: "🚨 ALARMA", 
              color: "error" as const,
              isAlarm: true,
              average: alarmState.averageValue
            };
          case 'low':
          case 'high':
            return { 
              label: "⚠️ ALERTA", 
              color: "warning" as const,
              isAlarm: true,
              average: alarmState.averageValue
            };
          default:
            break;
        }
      }
    }
    
    // Fallback a lógica anterior cuando no hay configuración
    if (force < 1500) {
      return { label: "✅ Normal", color: "success" as const, isAlarm: false };
    } else if (force < 2000) {
      return { label: "⚠️ Alerta", color: "warning" as const, isAlarm: false };
    } else {
      return { label: "🚨 Crítico", color: "error" as const, isAlarm: false };
    }
  };

  // Conectar WebSocket de forma no bloqueante
  useEffect(() => {
    if (isNavigating) return; // No hacer nada si estamos navegando
    
    let ws: any = null;
    let reconnectTimeout: number | null = null;

    const connectWebSocket = async () => {
      if (isNavigating) return; // Verificar nuevamente
      
      try {
        // NO bloquear la carga inicial - comenzar sin loading
        setError(null);

        console.log("🔌 Intentando conectar WebSocket...");
        
        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          if (isNavigating) return; // No procesar si estamos navegando
          console.log("🔌 RealTimeData WebSocket conectado");
          setLoading(false); // Solo quitar loading cuando se conecte exitosamente
        };

        ws.onmessage = (event: MessageEvent) => {
          if (isNavigating) return; // No procesar si estamos navegando
          try {
            const data = JSON.parse(event.data) as DevicesData;
            if (data && data.devices && Array.isArray(data.devices)) {
              setDevicesData(data.devices);
              setLoading(false); // Datos recibidos, ya no está cargando
              setInitialLoadComplete(true); // Marcar carga inicial como completa
              setError(null); // Limpiar cualquier error previo
            }
          } catch (err) {
            console.error("Error parseando datos WebSocket:", err);
            // No mostrar error por este problema de parsing
          }
        };

        ws.onclose = () => {
          console.log("🔌 RealTimeData WebSocket desconectado");
          setWsConnection(null);
          
          // Intentar reconectar después de 2 segundos si no estamos navegando
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
          
          // En modo desarrollo, no mostrar error de conexión
          if (!devMode && !isNavigating) {
            // Solo mostrar error después de varios intentos fallidos
            setTimeout(() => {
              if (!devicesData.length && !isNavigating && !initialLoadComplete) {
                setError("Error de conexión con el servidor. Verificando...");
              }
            }, 8000); // Aumentar a 8 segundos para móviles lentos
          }
          
          setWsConnection(null);
          setLoading(false); // No bloquear la UI por errores de conexión
        };

        setWsConnection(ws);
      } catch (err) {
        console.error("Error creando conexión WebSocket:", err);
        
        // No bloquear la UI, solo mostrar en consola
        if (!devMode && !isNavigating) {
          setTimeout(() => {
            if (!devicesData.length && !isNavigating && !initialLoadComplete) {
              setError("No se pudo conectar al servidor");
            }
          }, 5000); // 5 segundos para móviles
        }
        
        setWsConnection(null);
        setLoading(false);
      }
    };

    // Conectar inmediatamente, sin demora
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
  }, [currentApi, devMode, esp32IP, isNavigating]);

  // Cleanup WebSocket al desmontar componente
  useEffect(() => {
    return () => {
      if (wsConnection) {
        wsConnection.close();
        setWsConnection(null);
      }
    };
  }, [wsConnection]);

  // Cleanup general al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpiar cualquier conexión WebSocket restante
      if (wsConnection) {
        try {
          wsConnection.close();
        } catch (error) {
          console.error("Error cerrando WebSocket en cleanup:", error);
        }
      }
      
      // Limpiar estados
      setLoading(false);
      setError(null);
      setDevicesData([]);
    };
  }, []);

  // Timeout de seguridad para móviles - mostrar contenido aunque no lleguen datos
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (!initialLoadComplete && !isNavigating) {
        console.log("⏰ Timeout de seguridad: mostrando interfaz sin datos");
        setInitialLoadComplete(true);
        setLoading(false);
        
        // Si no hay datos después del timeout, mostrar dispositivo mock para evitar crash
        if (devicesData.length === 0 && deviceId) {
          const mockDevice: Device = {
            id: Number(deviceId),
            unit_name: `Torre ${deviceId}`,
            Norte: 0,
            Sur: 0,
            Este: 0,
            Oeste: 0,
            online: false
          };
          setDevicesData([mockDevice]);
        }
      }
    }, 10000); // 10 segundos máximo de espera para móviles

    return () => clearTimeout(fallbackTimeout);
  }, [initialLoadComplete, isNavigating, devicesData.length, deviceId]);
  useEffect(() => {
    // Solo verificar si es admin, no estamos navegando y no hemos verificado aún
    if (isAdmin && !isNavigating && !hasCheckedThresholds && deviceId) {
      // Ejecutar después de un pequeño delay para no bloquear la carga inicial
      const timeoutId = setTimeout(() => {
        if (!isNavigating) {
          checkDeviceThresholds();
        }
      }, 500); // Pequeño delay de 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [isAdmin, isNavigating, hasCheckedThresholds, deviceId]);

  // Verificar thresholds automáticamente al cargar el componente (DEPRECADO - movido arriba)
  // useEffect(() => {
  //   // Solo verificar si es admin y no estamos navegando
  //   if (isAdmin && !isNavigating && !hasCheckedThresholds) {
  //     // Esperar un poco para que se establezca la conexión
  //     const timeoutId = setTimeout(() => {
  //       checkDeviceThresholds();
  //     }, 1000);

  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [isAdmin, isNavigating, hasCheckedThresholds, deviceId]);

  // Detectar cambios en la ubicación y forzar cleanup si se navega fuera
  useEffect(() => {
    if (location.pathname !== `/real-time-data/${deviceId}`) {
      setIsNavigating(true);
      
      // Limpiar conexiones inmediatamente
      if (wsConnection) {
        wsConnection.close();
        setWsConnection(null);
      }
    }
  }, [location.pathname, deviceId, wsConnection]);

  // Mostrar loading solo si realmente no tenemos datos y estamos cargando
  if (loading && !initialLoadComplete && devicesData.length === 0) {
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
            Conectando con el dispositivo #{deviceId}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Mejorar manejo de errores para móviles
  if (error && !devicesData.length && initialLoadComplete) {
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

  // Manejo mejorado cuando no se encuentra el dispositivo
  if (initialLoadComplete && !currentDevice && devicesData.length > 0) {
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
            Dispositivo No Encontrado
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
            No se pudo encontrar el dispositivo con ID: {deviceId}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Solo definir las fuerzas si tenemos un dispositivo válido
  if (!currentDevice) {
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
            Cargando dispositivo...
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: "text.secondary",
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Buscando dispositivo #{deviceId}
          </Typography>
        </Box>
      </Box>
    );
  }

  const forces = [
    currentDevice.Norte,
    currentDevice.Sur,
    currentDevice.Este,
    currentDevice.Oeste,
  ];
  const cableNames = ["Norte", "Sur", "Este", "Oeste"];
  const cableValues = [
    currentDevice.Norte,
    currentDevice.Sur,
    currentDevice.Este,
    currentDevice.Oeste,
  ];

  // Renderizar el chart según el tipo seleccionado
  const renderChart = () => {
    switch (chartType) {
      case "circles":
        return <TowerView 
          device={currentDevice} 
          darkMode={darkMode} 
          deviceConfig={deviceConfig}
          getCableAlarmState={getCableAlarmState}
        />;
      // case "bar":
      //   return <BarChart device={currentDevice} darkMode={darkMode} />;
      case "radar":
        return <RadarChart device={currentDevice} darkMode={darkMode} />;
      case "gauges":
        return <GaugeChart device={currentDevice} darkMode={darkMode} />;
      case "heatmap":
        return <HeatmapChart device={currentDevice} darkMode={darkMode} />;
      default:
        return <TowerView 
          device={currentDevice} 
          darkMode={darkMode} 
          deviceConfig={deviceConfig}
          getCableAlarmState={getCableAlarmState}
        />;
    }
  };

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
                color: "text.primary",
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              Torre {currentDevice.unit_name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                fontWeight: 500,
              }}
            >
              ID: {currentDevice.id} • Monitoreo en Tiempo Real
            </Typography>
          </Box>
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
          {/* Botón de configuración - Solo para administradores */}
          {isAdmin && (
            <IconButton
              onClick={() => setSettingsOpen(true)}
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
              <SettingsIcon />
            </IconButton>
          )}
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

                {/* Tabs para diferentes visualizaciones */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                  <Tabs
                    value={chartType}
                    onChange={(_, newValue) => setChartType(newValue)}
                    centered
                    sx={{
                      "& .MuiTab-root": {
                        minHeight: 40,
                        fontSize: "0.85rem !important",
                        color: darkMode ? "#9ca3af" : "#6b7280",
                        textTransform: "none",
                      },
                      "& .Mui-selected": {
                        color: darkMode ? "#60a5fa" : "#3b82f6",
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: darkMode ? "#60a5fa" : "#3b82f6",
                        height: 2,
                      },
                    }}
                  >
                    <Tab value="circles" label="Círculos" />
                    {/* <Tab value="bar" label="Barras" /> */}
                    {/* <Tab value="radar" label="Radial" /> */}
                    <Tab value="heatmap" label="Mapa de Calor" />
                    <Tab value="gauges" label="Medidores" />
                  </Tabs>
                </Box>

                {/* Renderizar el chart seleccionado */}
                {renderChart()}

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
                    {deviceConfig?.thresholds ? (
                      <>
                        <Chip
                          label={`Normal: ${deviceConfig.thresholds.low + 1}-${deviceConfig.thresholds.high - 1}N`}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip
                          label={`Alerta: ≤${deviceConfig.thresholds.low}N o ≥${deviceConfig.thresholds.high}N`}
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip
                          label={`Crítico: ≤${deviceConfig.thresholds.low_low}N o ≥${deviceConfig.thresholds.high_high}N`}
                          color="error"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </>
                    ) : (
                      <>
                        <Chip
                          label="Normal: < 1500N"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip
                          label="Alerta: 1500-2000N"
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip
                          label="Crítico: > 2000N"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Estado de Cables */}
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
                  Estado por Cable
                </Typography>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {[
                    {
                      name: "Norte",
                      value: currentDevice.Norte,
                      icon: "🧭",
                      gradient: darkMode
                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)"
                        : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)",
                    },
                    {
                      name: "Sur",
                      value: currentDevice.Sur,
                      icon: "🧭",
                      gradient: darkMode
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)"
                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)",
                    },
                    {
                      name: "Este",
                      value: currentDevice.Este,
                      icon: "➡️",
                      gradient: darkMode
                        ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)"
                        : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)",
                    },
                    {
                      name: "Oeste",
                      value: currentDevice.Oeste,
                      icon: "⬅️",
                      gradient: darkMode
                        ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)"
                        : "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)",
                    },
                  ].map((cable) => {
                    const status = getForceStatus(cable.value, cable.name);
                    const alarmState = getCableAlarmState(currentDevice.id, cable.name);
                    const average = getCableAverage(currentDevice.id, cable.name);
                    
                    return (
                      <Grid item xs={12} sm={6} key={cable.name}>
                        <Box
                          sx={{
                            p: { xs: 2, sm: 2.5 },
                            background: cable.gradient,
                            border: `2px solid ${getCableColor(cable.value, cable.name)}`,
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 25px -8px ${getCableColor(
                                cable.value, cable.name
                              )}`,
                            },
                            // Efecto de parpadeo para alarmas activas
                            ...(alarmState.isActive && {
                              animation: 'pulse 1.5s infinite',
                              '@keyframes pulse': {
                                '0%': { boxShadow: `0 0 5px ${getCableColor(cable.value, cable.name)}` },
                                '50%': { boxShadow: `0 0 20px ${getCableColor(cable.value, cable.name)}` },
                                '100%': { boxShadow: `0 0 5px ${getCableColor(cable.value, cable.name)}` },
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
                                {cable.icon}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                {cable.name}
                              </Typography>
                            </Box>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                              sx={{ 
                                fontWeight: 500,
                                ...(status.isAlarm && {
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
                              color: getCableColor(cable.value, cable.name),
                              fontSize: { xs: "1.25rem", sm: "1.5rem" },
                            }}
                          >
                            {cable.value} N
                          </Typography>
                          
                          {/* Mostrar promedio si hay sistema de alarmas activo */}
                          {deviceConfig?.active && average > 0 && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mt: 0.5,
                                color: "text.secondary",
                                fontSize: "0.75rem",
                              }}
                            >
                              Promedio {deviceConfig.alarm_times.time_low}s: {average.toFixed(1)} N
                            </Typography>
                          )}
                          
                          {/* Mostrar tiempo de alarma activa */}
                          {alarmState.isActive && alarmState.startTime && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mt: 0.5,
                                color: status.color === 'error' ? 'error.main' : 'warning.main',
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              ⏰ Alarma activa: {Math.floor((Date.now() - alarmState.startTime) / 1000)}s
                            </Typography>
                          )}
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

      {/* Diálogo de configuración de thresholds - Solo para administradores */}
      {isAdmin && (
        <ThresholdSettings
          open={settingsOpen}
          onClose={() => {
            if (!isRequiredSetup) {
              setSettingsOpen(false);
            }
            // Si es configuración obligatoria, no permitir cerrar hasta guardar
          }}
          deviceId={Number(deviceId)}
          deviceConfig={deviceConfig}
          onConfigUpdate={handleConfigUpdate}
          isRequiredSetup={isRequiredSetup}
        />
      )}
    </Box>
  );
};

export default RealTimeData;
