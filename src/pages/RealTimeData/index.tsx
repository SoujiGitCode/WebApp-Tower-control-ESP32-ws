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
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Device, DevicesData } from "../../api/index";

// Importar todos los componentes de visualización
import { TowerView } from "../../components/RealTimeData/TowerView";
import { RadarChart } from "@components/RealTimeData/RadarChart";
import { GaugeChart } from "@components/RealTimeData/GaugeChart";
import { HeatmapChart } from "@components/RealTimeData/HeatmapChart";
// import BarChart from "../../components/RealTimeData/BarChart";

// Tipo para las diferentes vistas disponibles
type ChartType = "circles" | "bar" | "radar" | "gauges" | "heatmap";

const RealTimeData = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { darkMode, currentApi, devMode, esp32IP } = useAppContext();

  const [devicesData, setDevicesData] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<any>(null);
  const [chartType, setChartType] = useState<ChartType>("circles");

  const currentDevice = devicesData.find(
    (device) => device.id === Number(deviceId)
  );

  const getCableColor = (force: number) => {
    if (force < 1500) return "#22c55e";
    if (force < 2000) return "#f59e0b";
    return "#ef4444";
  };

  const getForceStatus = (force: number) => {
    if (force < 1500) {
      return { label: "Normal", color: "success" as const };
    } else if (force < 2000) {
      return { label: "Alerta", color: "warning" as const };
    } else {
      return { label: "Crítico", color: "error" as const };
    }
  };

  // Conectar WebSocket
  useEffect(() => {
    let ws: any = null;

    const connectWebSocket = () => {
      try {
        setLoading(true);
        setError(null);

        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          console.log("🔌 RealTimeData WebSocket conectado");
          setLoading(false);
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as DevicesData;
            setDevicesData(data.devices);
          } catch (err) {
            console.error("Error parseando datos WebSocket:", err);
          }
        };

        ws.onclose = () => {
          console.log("🔌 RealTimeData WebSocket desconectado");
          setLoading(false);
        };

        ws.onerror = (error: Event) => {
          console.error("🔌 Error en RealTimeData WebSocket:", error);
          if (!devMode) {
            setError("Error de conexión con el servidor");
          }
          setLoading(false);
        };

        setWsConnection(ws);
      } catch (err) {
        console.error("Error creando conexión WebSocket:", err);
        if (!devMode) {
          setError("No se pudo conectar al servidor");
        }
        setLoading(false);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [currentApi, devMode, esp32IP]);

  // Cleanup WebSocket
  useEffect(() => {
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  if (loading || (!currentDevice && devicesData.length === 0)) {
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
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress
            size={60}
            sx={{ color: darkMode ? "#60a5fa" : "#3b82f6", mb: 3 }}
          />
          <Typography
            variant="h6"
            sx={{ color: "text.primary", fontWeight: 500 }}
          >
            Cargando datos en tiempo real...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
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
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Error de Conexión
          </Typography>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!currentDevice && devicesData.length > 0) {
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
          p: 3,
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 400, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Dispositivo No Encontrado
          </Typography>
          No se pudo encontrar el dispositivo con ID: {deviceId}
        </Alert>
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

  const maxForce = Math.max(...forces);
  const minForce = Math.min(...forces);
  const avgForce = forces.reduce((a, b) => a + b, 0) / forces.length;
  const imbalance = (((maxForce - minForce) / avgForce) * 100).toFixed(1);

  const maxCableIndex = cableValues.indexOf(maxForce);
  const minCableIndex = cableValues.indexOf(minForce);
  const maxCableName = cableNames[maxCableIndex];
  const minCableName = cableNames[minCableIndex];

  // Renderizar el chart según el tipo seleccionado
  const renderChart = () => {
    switch (chartType) {
      case "circles":
        return <TowerView device={currentDevice} darkMode={darkMode} />;
      // case "bar":
      //   return <BarChart device={currentDevice} darkMode={darkMode} />;
      case "radar":
        return <RadarChart device={currentDevice} darkMode={darkMode} />;
      case "gauges":
        return <GaugeChart device={currentDevice} darkMode={darkMode} />;
      case "heatmap":
        return <HeatmapChart device={currentDevice} darkMode={darkMode} />;
      default:
        return <TowerView device={currentDevice} darkMode={darkMode} />;
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
            onClick={() => navigate("/dashboard")}
            sx={{
              mr: 2,
              color: "text.primary",
              bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                transform: "scale(1.05)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <BackIcon />
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
          <IconButton
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
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Panel de Estadísticas */}
          <Grid item xs={12}>
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
                  Estadísticas en Tiempo Real
                </Typography>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        background: darkMode
                          ? "rgba(34, 197, 94, 0.1)"
                          : "rgba(34, 197, 94, 0.05)",
                        border: darkMode
                          ? "1px solid rgba(34, 197, 94, 0.2)"
                          : "1px solid rgba(34, 197, 94, 0.1)",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: "success.main",
                          fontWeight: 700,
                          fontSize: { xs: "1.5rem", sm: "2rem" },
                        }}
                      >
                        {maxForce}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          fontWeight: 500,
                          display: "block",
                        }}
                      >
                        Tensión Máxima (N)
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "success.main",
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          fontWeight: 600,
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        Cable {maxCableName}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        background: darkMode
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(239, 68, 68, 0.05)",
                        border: darkMode
                          ? "1px solid rgba(239, 68, 68, 0.2)"
                          : "1px solid rgba(239, 68, 68, 0.1)",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: "error.main",
                          fontWeight: 700,
                          fontSize: { xs: "1.5rem", sm: "2rem" },
                        }}
                      >
                        {minForce}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          fontWeight: 500,
                          display: "block",
                        }}
                      >
                        Tensión Mínima (N)
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "error.main",
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          fontWeight: 600,
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        Cable {minCableName}
                      </Typography>
                    </Box>
                  </Grid>
                  {/* <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        background: darkMode
                          ? "rgba(59, 130, 246, 0.1)"
                          : "rgba(59, 130, 246, 0.05)",
                        border: darkMode
                          ? "1px solid rgba(59, 130, 246, 0.2)"
                          : "1px solid rgba(59, 130, 246, 0.1)",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: "info.main",
                          fontWeight: 700,
                          fontSize: { xs: "1.5rem", sm: "2rem" },
                        }}
                      >
                        {avgForce.toFixed(0)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          fontWeight: 500,
                        }}
                      >
                        Promedio (N)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        background:
                          Number(imbalance) > 50
                            ? darkMode
                              ? "rgba(245, 158, 11, 0.1)"
                              : "rgba(245, 158, 11, 0.05)"
                            : darkMode
                            ? "rgba(34, 197, 94, 0.1)"
                            : "rgba(34, 197, 94, 0.05)",
                        border:
                          Number(imbalance) > 50
                            ? darkMode
                              ? "1px solid rgba(245, 158, 11, 0.2)"
                              : "1px solid rgba(245, 158, 11, 0.1)"
                            : darkMode
                            ? "1px solid rgba(34, 197, 94, 0.2)"
                            : "1px solid rgba(34, 197, 94, 0.1)",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color:
                            Number(imbalance) > 50
                              ? "warning.main"
                              : "success.main",
                          fontWeight: 700,
                          fontSize: { xs: "1.5rem", sm: "2rem" },
                        }}
                      >
                        {imbalance}%
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          fontWeight: 500,
                        }}
                      >
                        Desbalance
                      </Typography>
                    </Box>
                  </Grid> */}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

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
                    const status = getForceStatus(cable.value);
                    return (
                      <Grid item xs={12} sm={6} key={cable.name}>
                        <Box
                          sx={{
                            p: { xs: 2, sm: 2.5 },
                            background: cable.gradient,
                            border: `2px solid ${getCableColor(cable.value)}`,
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 25px -8px ${getCableColor(
                                cable.value
                              )}`,
                            },
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
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: getCableColor(cable.value),
                              fontSize: { xs: "1.25rem", sm: "1.5rem" },
                            }}
                          >
                            {cable.value} N
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
    </Box>
  );
};

export default RealTimeData;
