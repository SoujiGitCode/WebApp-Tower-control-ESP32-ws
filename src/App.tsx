import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useMemo } from "react";
import { ToastContainer } from "react-toastify";
import { useAppContext } from "./context/AppContext";
import AppRouter from "./components/AppRouter";
import DevModeIndicator from "./components/DevModeIndicator";
import SessionTimeoutDebug from "./components/SessionTimeoutDebug";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const { darkMode } = useAppContext();

  // Manejo de temas con paleta mejorada
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: darkMode ? "#00E5FF" : "#1976d2", // Cyan brillante / Azul material
            dark: darkMode ? "#00B8D4" : "#1565c0",
            light: darkMode ? "#62EFFF" : "#42a5f5",
          },
          secondary: {
            main: darkMode ? "#FF6B6B" : "#f50057", // Rojo coral / Rosa material
            dark: darkMode ? "#E55A5A" : "#c51162",
            light: darkMode ? "#FF8E8E" : "#ff5983",
          },
          background: {
            default: darkMode ? "#0F1419" : "#F8FAFC", // Más oscuro / Gris muy claro
            paper: darkMode ? "#1E2328" : "#FFFFFF",
          },
          text: {
            primary: darkMode ? "#F8FAFC" : "#1E293B", // Alto contraste
            secondary: darkMode ? "#CBD5E1" : "#64748B",
          },
          success: {
            main: darkMode ? "#22C55E" : "#16A34A", // Verde moderno
          },
          warning: {
            main: darkMode ? "#F59E0B" : "#D97706", // Amarillo/Naranja
          },
          error: {
            main: darkMode ? "#EF4444" : "#DC2626", // Rojo moderno
          },
          info: {
            main: darkMode ? "#3B82F6" : "#2563EB", // Azul información
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: {
            fontWeight: 700,
            fontSize: "1.75rem",
            lineHeight: 1.2,
          },
          h5: {
            fontWeight: 600,
            fontSize: "1.25rem",
            lineHeight: 1.3,
          },
          h6: {
            fontWeight: 600,
            fontSize: "1.125rem",
            lineHeight: 1.4,
          },
          body1: {
            fontSize: "1rem",
            lineHeight: 1.5,
          },
          body2: {
            fontSize: "0.875rem",
            lineHeight: 1.5,
          },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: darkMode
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 600,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                fontWeight: 500,
              },
            },
          },
        },
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Main application router */}
      <AppRouter />

      {/* Dev mode indicator */}
      <DevModeIndicator />

      {/* Session timeout debug indicator (SOLO PARA DESARROLLO) */}
      {/* Comentar o eliminar en producción */}
      {/* <SessionTimeoutDebug /> */}
      
      {/* Toast notifications - Fuera del contenido para que se vea correctamente */}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
        limit={3}
        style={{ zIndex: 9999 }}
      />
    </ThemeProvider>
  );
};

export default App;
