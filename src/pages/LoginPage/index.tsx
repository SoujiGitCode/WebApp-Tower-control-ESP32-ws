import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Brightness7 as LightIcon,
  Brightness4 as DarkIcon,
  BugReport as DevIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Wifi as WifiIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import AccessImage from "../../assets/access.svg";
import { MOCK_CREDENTIALS, mockApiClient } from "../../api/mockApi";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, darkMode, setDarkMode, devMode, setDevMode, loggedIn } =
    useAppContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showIpConfig, setShowIpConfig] = useState(false);
  const [espIP, setEspIP] = useState("192.168.4.1");

  // Si ya está logueado, redirigir
  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Por favor ingrese usuario y contraseña");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(username, password);

      if (success) {
        toast.success(`¡Bienvenido ${username}!`, {
          position: "top-right",
          autoClose: 2000,
        });
        navigate("/dashboard");
      } else {
        setError("Usuario o contraseña incorrectos");
        toast.error("Credenciales inválidas");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setError("Error de conexión. Verifique la configuración del servidor.");
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  const handleQuickLogin = (userType: "admin" | "user") => {
    const credentials = MOCK_CREDENTIALS[userType];
    setUsername(credentials.username);
    setPassword(credentials.password);

    // Auto-login después de un breve delay
    setTimeout(() => {
      setUsername(credentials.username);
      setPassword(credentials.password);
    }, 100);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: darkMode
          ? "linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #64748b 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5b73c4 100%)",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "background.paper",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            {/* Logo y título */}
            <img
              src={AccessImage}
              alt="Sistema de Monitoreo"
              style={{ width: 120, height: 120 }}
            />

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                fontWeight="bold"
              >
                Sistema de Monitoreo
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Torres de Control ESP32
              </Typography>

              {/* Controles de tema y dev mode integrados */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                {/* Toggle Dark Mode */}
                <Box
                  onClick={() => setDarkMode(!darkMode)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: darkMode
                      ? "rgba(96, 165, 250, 0.1)"
                      : "rgba(251, 191, 36, 0.1)",
                    border: darkMode
                      ? "2px solid rgba(96, 165, 250, 0.3)"
                      : "2px solid rgba(251, 191, 36, 0.3)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: darkMode
                        ? "rgba(96, 165, 250, 0.2)"
                        : "rgba(251, 191, 36, 0.2)",
                      transform: "scale(1.1)",
                      boxShadow: darkMode
                        ? "0 4px 12px rgba(96, 165, 250, 0.3)"
                        : "0 4px 12px rgba(251, 191, 36, 0.3)",
                    },
                  }}
                >
                  {darkMode ? (
                    <DarkIcon sx={{ fontSize: 16, color: "#60a5fa" }} />
                  ) : (
                    <LightIcon sx={{ fontSize: 16, color: "#fbbf24" }} />
                  )}
                </Box>

                {/* Toggle Dev Mode */}
                {/* <Box
                  onClick={() => setDevMode(!devMode)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: devMode
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(156, 163, 175, 0.1)",
                    border: devMode
                      ? "2px solid rgba(245, 158, 11, 0.3)"
                      : "2px solid rgba(156, 163, 175, 0.3)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: devMode
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(156, 163, 175, 0.2)",
                      transform: "scale(1.1)",
                      boxShadow: devMode
                        ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                        : "0 4px 12px rgba(156, 163, 175, 0.3)",
                    },
                  }}
                >
                  {devMode ? (
                    <DevIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                  ) : (
                    <CodeIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  )}
                </Box> */}

                {/* Toggle IP Config */}
                {/* <Box
                  onClick={() => setShowIpConfig(!showIpConfig)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: showIpConfig
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(156, 163, 175, 0.1)",
                    border: showIpConfig
                      ? "2px solid rgba(34, 197, 94, 0.3)"
                      : "2px solid rgba(156, 163, 175, 0.3)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: showIpConfig
                        ? "rgba(34, 197, 94, 0.2)"
                        : "rgba(156, 163, 175, 0.2)",
                      transform: "scale(1.1)",
                      boxShadow: showIpConfig
                        ? "0 4px 12px rgba(34, 197, 94, 0.3)"
                        : "0 4px 12px rgba(156, 163, 175, 0.3)",
                    },
                  }}
                >
                  {showIpConfig ? (
                    <WifiIcon sx={{ fontSize: 16, color: "#22c55e" }} />
                  ) : (
                    <SettingsIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  )}
                </Box> */}
              </Box>
            </Box>

            {/* Panel de configuración de IP */}
            {showIpConfig && (
              <Box
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: darkMode
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(34, 197, 94, 0.05)",
                  border: darkMode
                    ? "1px solid rgba(34, 197, 94, 0.3)"
                    : "1px solid rgba(34, 197, 94, 0.2)",
                  mt: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  <WifiIcon sx={{ fontSize: 18 }} />
                  Configuración ESP32
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    size="small"
                    label="IP del ESP32"
                    value={espIP}
                    onChange={(e) => setEspIP(e.target.value)}
                    placeholder="192.168.4.1"
                    sx={{ flex: 1 }}
                    InputProps={{
                      sx: {
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      mockApiClient.updateBaseURL(espIP);
                      toast.success(`IP actualizada a: ${espIP}`, {
                        position: "top-right",
                        autoClose: 2000,
                      });
                    }}
                    sx={{
                      backgroundColor: "#22c55e",
                      "&:hover": {
                        backgroundColor: "#16a34a",
                      },
                      fontSize: "0.75rem",
                      px: 2,
                    }}
                  >
                    Aplicar
                  </Button>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "text.secondary",
                    fontStyle: "italic",
                  }}
                >
                  💡 Cambia la IP para conectar a tu ESP32 en desarrollo
                </Typography>
              </Box>
            )}

            {/* Formulario de login */}
            <Box sx={{ width: "100%", mt: 2 }}>
              <TextField
                fullWidth
                label="Usuario"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                margin="normal"
                autoComplete="username"
              />

              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                margin="normal"
                autoComplete="current-password"
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={isLoading}
                sx={{ mt: 3, py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </Box>

            {/* Quick login para desarrollo */}
            {devMode && (
              <>
                <Divider sx={{ width: "100%", my: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Acceso Rápido (Dev Mode)
                  </Typography>
                </Divider>

                <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleQuickLogin("admin")}
                    disabled={isLoading}
                    sx={{ flex: 1 }}
                  >
                    Login Admin
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleQuickLogin("user")}
                    disabled={isLoading}
                    sx={{ flex: 1 }}
                  >
                    Login User
                  </Button>
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="center"
                >
                  Admin: {MOCK_CREDENTIALS.admin.username} /{" "}
                  {MOCK_CREDENTIALS.admin.password}
                  <br />
                  User: {MOCK_CREDENTIALS.user.username} /{" "}
                  {MOCK_CREDENTIALS.user.password}
                </Typography>
              </>
            )}

            {/* Info del sistema */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                v2.0.0 | WebApp Sely
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
