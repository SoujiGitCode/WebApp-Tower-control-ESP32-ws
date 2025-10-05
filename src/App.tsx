import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useMemo } from "react";
import { ToastContainer } from "react-toastify";
import { useAppContext } from "./context/AppContext";
import AppRouter from "./components/AppRouter";
import DevModeIndicator from "./components/DevModeIndicator";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const { darkMode } = useAppContext();

  // Manejo de temas
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: darkMode ? "#AAE3E2" : "#788e98",
          },
          background: {
            default: darkMode ? "#222831" : "#FFFFFF",
            paper: darkMode ? "#393E46" : "#FFFFFF",
          },
          text: {
            primary: darkMode ? "#EEEEEE" : "#1E2022",
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Main application router */}
      <AppRouter />

      {/* Dev mode indicator */}
      <DevModeIndicator />
    </ThemeProvider>
  );
};

export default App;
