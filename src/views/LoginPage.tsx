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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import AccessImage from "../assets/access.svg";
import { MOCK_CREDENTIALS } from "../api/mockApi";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, darkMode, setDarkMode, devMode, setDevMode, loggedIn } =
    useAppContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
          ? "linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 2,
      }}
    >
      {/* Controles de tema y dev mode */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          zIndex: 1000,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              icon={<LightIcon />}
              checkedIcon={<DarkIcon />}
            />
          }
          label=""
        />
        <FormControlLabel
          control={
            <Switch
              checked={devMode}
              onChange={() => setDevMode(!devMode)}
              icon={<CodeIcon />}
              checkedIcon={<DevIcon />}
            />
          }
          label=""
        />
      </Box>

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
              <Typography variant="h6" color="text.secondary">
                Torres de Control ESP32
              </Typography>
            </Box>

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
                v1.0.0 | WebApp Tower Control ESP32
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
