import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
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
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  CellTower as TowerIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
} from "chart.js";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Device, DevicesData } from "../api/index";
import { toast } from "react-toastify";

Chart.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend
);

// ===== COMPONENTE: VISTA DE TORRE DESDE ARRIBA =====
const TowerView = ({
  device,
  darkMode,
}: {
  device: Device;
  darkMode: boolean;
}) => {
  const THRESHOLD_WARNING = 1500;
  const THRESHOLD_CRITICAL = 2000;
  const THRESHOLD_MIN = 100;

  const getCableColor = (force: number) => {
    if (force <= THRESHOLD_MIN) return "#ff9800";
    if (force >= THRESHOLD_CRITICAL) return "#f44336";
    if (force >= THRESHOLD_WARNING) return "#ff9800";
    return "#4caf50";
  };

  const maxValue = Math.max(
    device.Norte,
    device.Sur,
    device.Este,
    device.Oeste,
    2500
  );

  const calculateSize = (force: number) => {
    return Math.max(30, (force / maxValue) * 120);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Centro de la torre */}
      <Box
        sx={{
          position: "absolute",
          width: 60,
          height: 60,
          borderRadius: "50%",
          bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          border: `3px solid ${darkMode ? "#666" : "#999"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <TowerIcon sx={{ fontSize: 30, color: darkMode ? "#fff" : "#000" }} />
      </Box>

      {/* Cable Norte */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: calculateSize(device.Norte),
            height: calculateSize(device.Norte),
            borderRadius: "50%",
            bgcolor: getCableColor(device.Norte),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            boxShadow: `0 0 20px ${getCableColor(device.Norte)}`,
            transition: "all 0.3s ease",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="white">
            {device.Norte}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          fontWeight="bold"
          sx={{ mt: 1, display: "block" }}
        >
          NORTE
        </Typography>
      </Box>

      {/* Cable Sur */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <Typography
          variant="caption"
          fontWeight="bold"
          sx={{ mb: 1, display: "block" }}
        >
          SUR
        </Typography>
        <Box
          sx={{
            width: calculateSize(device.Sur),
            height: calculateSize(device.Sur),
            borderRadius: "50%",
            bgcolor: getCableColor(device.Sur),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            boxShadow: `0 0 20px ${getCableColor(device.Sur)}`,
            transition: "all 0.3s ease",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="white">
            {device.Sur}
          </Typography>
        </Box>
      </Box>

      {/* Cable Este */}
      <Box
        sx={{
          position: "absolute",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: calculateSize(device.Este),
            height: calculateSize(device.Este),
            borderRadius: "50%",
            bgcolor: getCableColor(device.Este),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            boxShadow: `0 0 20px ${getCableColor(device.Este)}`,
            transition: "all 0.3s ease",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="white">
            {device.Este}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          fontWeight="bold"
          sx={{ mt: 1, display: "block" }}
        >
          ESTE
        </Typography>
      </Box>

      {/* Cable Oeste */}
      <Box
        sx={{
          position: "absolute",
          left: 20,
          top: "50%",
          transform: "translateY(-50%)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: calculateSize(device.Oeste),
            height: calculateSize(device.Oeste),
            borderRadius: "50%",
            bgcolor: getCableColor(device.Oeste),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            boxShadow: `0 0 20px ${getCableColor(device.Oeste)}`,
            transition: "all 0.3s ease",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="white">
            {device.Oeste}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          fontWeight="bold"
          sx={{ mt: 1, display: "block" }}
        >
          OESTE
        </Typography>
      </Box>

      {/* Líneas conectoras */}
      <svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <line
          x1="50%"
          y1="50%"
          x2="50%"
          y2="20"
          stroke={darkMode ? "#555" : "#ccc"}
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="50%"
          y1="50%"
          x2="50%"
          y2="380"
          stroke={darkMode ? "#555" : "#ccc"}
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="50%"
          y1="50%"
          x2="20"
          y2="50%"
          stroke={darkMode ? "#555" : "#ccc"}
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="50%"
          y1="50%"
          x2="calc(100% - 20)"
          y2="50%"
          stroke={darkMode ? "#555" : "#ccc"}
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    </Box>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const RealTimeData = () => {
  const navigate = useNavigate();
  const { deviceId: deviceIdParam } = useParams<{ deviceId: string }>();
  const deviceId = deviceIdParam ? parseInt(deviceIdParam, 10) : 0;

  // Validar ID del device
  if (!deviceIdParam || isNaN(deviceId) || deviceId <= 0) {
    toast.error("ID de device inválido", {
      position: "top-right",
      autoClose: 2000,
    });
    navigate("/dashboard");
    return null;
  }

  const { currentUser, currentApi, devMode, esp32IP, darkMode } =
    useAppContext();
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Historial de datos para el gráfico (últimos 60 segundos)
  const [dataHistory, setDataHistory] = useState<{
    timestamps: string[];
    Norte: number[];
    Sur: number[];
    Este: number[];
    Oeste: number[];
  }>({
    timestamps: [],
    Norte: [],
    Sur: [],
    Este: [],
    Oeste: [],
  });

  // Umbrales de alerta
  const THRESHOLD_WARNING = 1500;
  const THRESHOLD_CRITICAL = 2000;
  const THRESHOLD_MIN = 100;

  // Función para verificar alertas
  const checkAlerts = (device: Device) => {
    const cables = [
      { name: "Norte", value: device.Norte },
      { name: "Sur", value: device.Sur },
      { name: "Este", value: device.Este },
      { name: "Oeste", value: device.Oeste },
    ];

    cables.forEach((cable) => {
      if (cable.value >= THRESHOLD_CRITICAL) {
        toast.error(`⚠️ CRÍTICO: Cable ${cable.name} con ${cable.value}N`, {
          position: "top-right",
          autoClose: 5000,
        });
      } else if (cable.value <= THRESHOLD_MIN) {
        toast.warning(`⚠️ Cable ${cable.name} muy flojo: ${cable.value}N`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    });
  };

  // Configurar gráfico de líneas
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: dataHistory.timestamps,
        datasets: [
          {
            label: "Norte",
            data: dataHistory.Norte,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 2,
          },
          {
            label: "Sur",
            data: dataHistory.Sur,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 2,
          },
          {
            label: "Este",
            data: dataHistory.Este,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 2,
          },
          {
            label: "Oeste",
            data: dataHistory.Oeste,
            borderColor: "rgba(255, 206, 86, 1)",
            backgroundColor: "rgba(255, 206, 86, 0.1)",
            tension: 0.4,
            fill: false,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: "Histórico de Tensión (últimos 60 segundos)",
            color: darkMode ? "#ffffff" : "#000000",
            font: { size: 14 },
          },
          legend: {
            position: "top",
            labels: {
              color: darkMode ? "#ffffff" : "#000000",
              usePointStyle: true,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Tensión (N)",
              color: darkMode ? "#ffffff" : "#000000",
            },
            ticks: {
              color: darkMode ? "#ffffff" : "#000000",
            },
            grid: {
              color: darkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          },
          x: {
            ticks: {
              color: darkMode ? "#ffffff" : "#000000",
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              color: darkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          },
        },
        animation: {
          duration: 0,
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [dataHistory, darkMode]);

  // Conectar WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        setLoading(true);
        setError(null);

        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          console.log(
            `🔌 RealTimeData WebSocket conectado para device #${deviceId}`
          );
          setLoading(false);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as DevicesData;
            const device = data.devices.find((d) => d.id === deviceId);

            if (device) {
              setCurrentDevice(device);
              setLastUpdate(new Date());

              // Actualizar historial (mantener solo los últimos 60 puntos = 1 minuto)
              setDataHistory((prev) => {
                const timestamp = new Date().toLocaleTimeString();
                const newHistory = {
                  timestamps: [...prev.timestamps, timestamp].slice(-60),
                  Norte: [...prev.Norte, device.Norte].slice(-60),
                  Sur: [...prev.Sur, device.Sur].slice(-60),
                  Este: [...prev.Este, device.Este].slice(-60),
                  Oeste: [...prev.Oeste, device.Oeste].slice(-60),
                };
                return newHistory;
              });

              // Verificar alertas
              checkAlerts(device);
            } else {
              setError(`Device #${deviceId} no encontrado en los datos`);
              toast.error(`Device #${deviceId} no encontrado`, {
                position: "top-right",
                autoClose: 3000,
              });
              setTimeout(() => {
                navigate("/dashboard");
              }, 3000);
            }
          } catch (err) {
            console.error("Error parseando datos WebSocket:", err);
          }
        };

        ws.onclose = () => {
          console.log("🔌 RealTimeData WebSocket desconectado");
          setLoading(false);
        };

        ws.onerror = (error) => {
          console.error("🔌 Error en RealTimeData WebSocket:", error);
          setError("Error de conexión con el servidor");
          setLoading(false);
        };

        setWsConnection(ws);
      } catch (err) {
        console.error("Error creando conexión WebSocket:", err);
        setError("No se pudo conectar al servidor");
        setLoading(false);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [currentApi, devMode, esp32IP, deviceId]);

  // Calcular estadísticas
  const totalForce = currentDevice
    ? currentDevice.Norte +
      currentDevice.Sur +
      currentDevice.Este +
      currentDevice.Oeste
    : 0;

  const maxForce = currentDevice
    ? Math.max(
        currentDevice.Norte,
        currentDevice.Sur,
        currentDevice.Este,
        currentDevice.Oeste
      )
    : 0;

  const minForce = currentDevice
    ? Math.min(
        currentDevice.Norte,
        currentDevice.Sur,
        currentDevice.Este,
        currentDevice.Oeste
      )
    : 0;

  const avgForce = currentDevice ? totalForce / 4 : 0;

  const imbalance = currentDevice
    ? (((maxForce - minForce) / avgForce) * 100).toFixed(1)
    : 0;

  const getForceStatus = (force: number) => {
    if (force <= THRESHOLD_MIN)
      return { color: "warning" as const, label: "FLOJO" };
    if (force >= THRESHOLD_CRITICAL)
      return { color: "error" as const, label: "CRÍTICO" };
    if (force >= THRESHOLD_WARNING)
      return { color: "warning" as const, label: "ALERTA" };
    return { color: "success" as const, label: "NORMAL" };
  };

  const getCableColor = (force: number) => {
    if (force <= THRESHOLD_MIN) return "#ff9800";
    if (force >= THRESHOLD_CRITICAL) return "#f44336";
    if (force >= THRESHOLD_WARNING) return "#ff9800";
    return "#4caf50";
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => navigate("/dashboard")}
            sx={{ mr: 2 }}
          >
            <BackIcon />
          </IconButton>

          <TowerIcon sx={{ mr: 2 }} />

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              Device #{deviceId} - Monitor de Torre
            </Typography>
            <Typography variant="caption">
              {lastUpdate &&
                `Última actualización: ${lastUpdate.toLocaleTimeString()}`}
            </Typography>
          </Box>

          {currentUser?.role === "ADMIN" && (
            <IconButton color="inherit" onClick={() => navigate("/admin")}>
              <SettingsIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Contenido */}
      <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
        {loading && (
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
              Conectando con el dispositivo...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {currentDevice && (
          <Grid container spacing={3}>
            {/* Panel de Estadísticas Clave */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h4" color="primary">
                          {maxForce}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tensión Máxima (N)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h4" color="secondary">
                          {minForce}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tensión Mínima (N)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h4">
                          {avgForce.toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Promedio (N)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h4"
                          color={Number(imbalance) > 50 ? "error" : "success"}
                        >
                          {imbalance}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Desbalance
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Vista de Torre */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vista de Torre (Tensión en Tiempo Real)
                  </Typography>
                  <TowerView device={currentDevice} darkMode={darkMode} />
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      label="Normal: < 1500N"
                      color="success"
                      size="small"
                    />
                    <Chip
                      label="Alerta: 1500-2000N"
                      color="warning"
                      size="small"
                    />
                    <Chip label="Crítico: > 2000N" color="error" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Estado de Cables */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estado por Cable
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      {
                        name: "Norte",
                        value: currentDevice.Norte,
                        color: "rgba(54, 162, 235, 0.1)",
                      },
                      {
                        name: "Sur",
                        value: currentDevice.Sur,
                        color: "rgba(255, 99, 132, 0.1)",
                      },
                      {
                        name: "Este",
                        value: currentDevice.Este,
                        color: "rgba(75, 192, 192, 0.1)",
                      },
                      {
                        name: "Oeste",
                        value: currentDevice.Oeste,
                        color: "rgba(255, 206, 86, 0.1)",
                      },
                    ].map((cable) => {
                      const status = getForceStatus(cable.value);
                      return (
                        <Grid item xs={12} sm={6} key={cable.name}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: cable.color,
                              border: `2px solid ${getCableColor(cable.value)}`,
                              borderRadius: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {cable.name}
                                </Typography>
                                <Typography variant="h5" fontWeight="bold">
                                  {cable.value} N
                                </Typography>
                              </Box>
                              <Chip
                                label={status.label}
                                color={status.color}
                                size="small"
                              />
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico Histórico de Líneas */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ height: 300, position: "relative" }}>
                    <canvas ref={chartRef} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default RealTimeData;
