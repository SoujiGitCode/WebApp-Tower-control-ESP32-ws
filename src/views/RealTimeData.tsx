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
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
} from "chart.js";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Device, DevicesData } from "../api/index";
import { toast } from "react-toastify";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

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

  // Historial de datos para el gráfico
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

  // Configurar gráfico
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Norte", "Sur", "Este", "Oeste"],
        datasets: [
          {
            label: `Device #${deviceId} (${currentDevice?.unit_symbol || "N"})`,
            data: currentDevice
              ? [
                  currentDevice.Norte,
                  currentDevice.Sur,
                  currentDevice.Este,
                  currentDevice.Oeste,
                ]
              : [0, 0, 0, 0],
            backgroundColor: [
              "rgba(54, 162, 235, 0.8)", // Norte - Azul
              "rgba(255, 99, 132, 0.8)", // Sur - Rojo
              "rgba(75, 192, 192, 0.8)", // Este - Verde
              "rgba(255, 206, 86, 0.8)", // Oeste - Amarillo
            ],
            borderColor: [
              "rgba(54, 162, 235, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(255, 206, 86, 1)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Fuerzas en Tiempo Real - Device #${deviceId}`,
            color: darkMode ? "#ffffff" : "#000000",
            font: { size: 16 },
          },
          legend: {
            labels: {
              color: darkMode ? "#ffffff" : "#000000",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
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
            },
            grid: {
              color: darkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          },
        },
        animation: {
          duration: 300,
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [deviceId, darkMode, currentDevice]);

  // Actualizar gráfico cuando cambien los datos
  useEffect(() => {
    if (chartInstanceRef.current && currentDevice) {
      chartInstanceRef.current.data.datasets[0].data = [
        currentDevice.Norte,
        currentDevice.Sur,
        currentDevice.Este,
        currentDevice.Oeste,
      ];
      chartInstanceRef.current.update("none"); // Sin animación para mejor rendimiento
    }
  }, [currentDevice]);

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

              // Actualizar historial (mantener solo los últimos 20 puntos)
              setDataHistory((prev) => {
                const timestamp = new Date().toLocaleTimeString();
                const newHistory = {
                  timestamps: [...prev.timestamps, timestamp].slice(-20),
                  Norte: [...prev.Norte, device.Norte].slice(-20),
                  Sur: [...prev.Sur, device.Sur].slice(-20),
                  Este: [...prev.Este, device.Este].slice(-20),
                  Oeste: [...prev.Oeste, device.Oeste].slice(-20),
                };
                return newHistory;
              });
            } else {
              setError(`Device #${deviceId} no encontrado en los datos`);
              toast.error(`Device #${deviceId} no encontrado`, {
                position: "top-right",
                autoClose: 3000,
              });
              // Redirigir al dashboard después de 3 segundos
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

  const getForceColor = (force: number) => {
    if (force < 500) return "success";
    if (force < 1000) return "warning";
    return "error";
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
              Device #{deviceId} - Tiempo Real
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
            {/* Estadísticas */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h4" color="primary">
                          {totalForce}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Fuerza Total ({currentDevice.unit_symbol})
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h4" color="secondary">
                          {maxForce}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Fuerza Máxima ({currentDevice.unit_symbol})
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Chip
                          label={getForceColor(totalForce).toUpperCase()}
                          color={getForceColor(totalForce)}
                          variant="filled"
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Estado del Sistema
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6">
                          {currentDevice.unit_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Unidad de Medida
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ height: 400, position: "relative" }}>
                    <canvas ref={chartRef} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Valores individuales */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Valores Actuales por Dirección
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "rgba(54, 162, 235, 0.1)",
                          borderRadius: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold">
                          {currentDevice.Norte}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Norte ({currentDevice.unit_symbol})
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "rgba(255, 99, 132, 0.1)",
                          borderRadius: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold">
                          {currentDevice.Sur}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Sur ({currentDevice.unit_symbol})
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "rgba(75, 192, 192, 0.1)",
                          borderRadius: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold">
                          {currentDevice.Este}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Este ({currentDevice.unit_symbol})
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "rgba(255, 206, 86, 0.1)",
                          borderRadius: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold">
                          {currentDevice.Oeste}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Oeste ({currentDevice.unit_symbol})
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
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
