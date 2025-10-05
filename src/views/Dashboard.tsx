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
import { useAppContext } from "../context/AppContext";
import { Device, DevicesData } from "../api/index";
import { toast } from "react-toastify";

interface DeviceCardProps {
  device: Device;
}

const DeviceCard = ({ device }: DeviceCardProps) => {
  const { darkMode } = useAppContext();
  const navigate = useNavigate();

  // Calcular el total de fuerzas
  const totalForce = device.Norte + device.Sur + device.Este + device.Oeste;

  // Determinar color basado en el total de fuerza
  const getForceColor = (force: number) => {
    if (force < 500) return "success";
    if (force < 1000) return "warning";
    return "error";
  };

  const forceColor = getForceColor(totalForce);

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
      onClick={() => navigate(`/real-time-data/${device.id}`)}
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
          <Chip
            label={`Total: ${totalForce} ${device.unit_symbol}`}
            color={forceColor}
            variant="filled"
            size="small"
          />
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
              <Typography variant="h6" fontWeight="bold">
                {device.Norte}
              </Typography>
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
              <Typography variant="h6" fontWeight="bold">
                {device.Sur}
              </Typography>
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
              <Typography variant="h6" fontWeight="bold">
                {device.Este}
              </Typography>
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
              <Typography variant="h6" fontWeight="bold">
                {device.Oeste}
              </Typography>
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
              navigate(`/real-time-data/${device.id}`);
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
  const [devicesData, setDevicesData] = useState<DevicesData | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Conectar WebSocket para obtener datos en tiempo real
  useEffect(() => {
    let ws: any = null;

    const connectWebSocket = () => {
      try {
        setLoading(true);
        setError(null);

        // Usar la IP configurada en devMode o la IP por defecto
        ws = currentApi.createWebSocketConnection(
          devMode ? esp32IP : undefined
        );

        ws.onopen = () => {
          console.log("🔌 Dashboard WebSocket conectado");
          setLoading(false);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as DevicesData;
            setDevicesData(data);
          } catch (err) {
            console.error("Error parseando datos WebSocket:", err);
          }
        };

        ws.onclose = () => {
          console.log("🔌 Dashboard WebSocket desconectado");
          setLoading(false);
        };

        ws.onerror = (error) => {
          console.error("🔌 Error en Dashboard WebSocket:", error);
          // En devMode, no mostrar error ya que es normal que falle
          if (!devMode) {
            setError("Error de conexión con el servidor");
          }
          setLoading(false);
        };

        setWsConnection(ws);
      } catch (err) {
        console.error("Error creando conexión WebSocket:", err);
        // En devMode, no mostrar error ya que es normal que falle
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
            <MenuItem onClick={() => navigate("/admin")}>
              <AdminIcon sx={{ mr: 1 }} />
              Panel de Administración
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Contenido principal */}
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
              Conectando con el servidor...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {devicesData && (
          <>
            {/* Header con estadísticas */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                Dispositivos Activos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total de dispositivos: {devicesData.total_devices} | Última
                actualización:{" "}
                {new Date(devicesData.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>

            {/* Grid de dispositivos */}
            <Grid container spacing={3}>
              {devicesData.devices.map((device) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={device.id}>
                  <DeviceCard device={device} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
