import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import AccessImage from "../../assets/access.svg";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, currentUser } = useAppContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Por favor ingrese usuario y contraseña");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const success = await login(username, password);

      if (success) {
        toast.success(`¡Bienvenido ${username}!`, {
          position: "top-right",
          autoClose: 2000,
        });
        navigate("/dashboard");
      } else {
        setErrorMessage("Usuario o contraseña incorrectos");
        toast.error("Credenciales inválidas");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setErrorMessage("Error de conexión. Verifique la configuración del servidor.");
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

  // Si ya está logueado, mostrar mensaje de bienvenida
  if (currentUser) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 4,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: 400,
          width: "100%",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
          ¡Bienvenido!
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
          Usuario: {currentUser.username} ({currentUser.role})
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => navigate("/dashboard")}
        >
          Ir al Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 4,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
        maxWidth: 400,
        width: "100%",
      }}
    >
      <img
        src={AccessImage}
        alt="Access"
        style={{
          width: 120,
          height: 120,
          marginBottom: 24,
        }}
      />

      <Typography variant="h4" sx={{ mb: 3, textAlign: "center" }}>
        Admin Panel
      </Typography>

      {errorMessage && (
        <Typography
          variant="body2"
          color="error"
          sx={{ mb: 2, textAlign: "center" }}
        >
          {errorMessage}
        </Typography>
      )}

      <TextField
        label="Usuario"
        variant="outlined"
        fullWidth
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          setErrorMessage("");
        }}
        onKeyPress={handleKeyPress}
        sx={{ mb: 2 }}
        disabled={isLoading}
      />

      <TextField
        label="Contraseña"
        type="password"
        variant="outlined"
        fullWidth
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setErrorMessage("");
        }}
        onKeyPress={handleKeyPress}
        sx={{ mb: 3 }}
        disabled={isLoading}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleLogin}
        disabled={isLoading}
        sx={{ py: 1.5 }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Iniciar Sesión"
        )}
      </Button>
    </Box>
  );
};

export default LoginForm;