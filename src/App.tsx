import { useEffect, useMemo, useState } from 'react';
import { createTheme, ThemeProvider, CssBaseline, Switch, FormControlLabel, Typography, Container, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
// import Lottie from 'react-lottie-player';
// import lottieJson from './assets/animations/tower.json';
import Graph from '@components/Graph';
import TowerInfo from '@components/TowerInfo';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import { useAppContext } from '@context/AppContext';  // Importar el contexto global
import 'react-toastify/dist/ReactToastify.css';
import AdminPanel from '@views/AdminPanel';
import ReportImage from '@assets/report.svg'; // Ruta hacia el SVG

const App = () => {
  const LOCAL_WEBSOCKET = 'ws://localhost:8080';
  const DEFAULT_IP = '192.168.4.1';

  const { darkMode, setDarkMode, esp32IP, setEsp32IP, devMode, setDevMode } = useAppContext();  // Usar el contexto global
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [webSocketAdress, setWebSocketAdress] = useState(LOCAL_WEBSOCKET);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputIP, setInputIP] = useState(esp32IP);
  const [towerInfo, setTowerInfo] = useState({
    id: '',
    name: '',
    slang: '',
    location: '',
    priority: 0,
    type: '',
    loadcells_amount: 0,
  });

  const handleContinue = () => setShowGraph(true);
  const handleDialogClose = () => {
    setDialogOpen(false);
    if (inputIP && isValidIP(inputIP)) {
      setEsp32IP(inputIP);
      setWebSocketAdress(`ws://${inputIP}:8080`);
    } else {
      toast.error(`IP Invalida, se utilizara la IP predeterminada: ${DEFAULT_IP}`);
      setEsp32IP(DEFAULT_IP);
      setWebSocketAdress(`ws://${DEFAULT_IP}:8080`);
    }
    toast.success(`DevMode Activado`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Verificación de IP
  function isValidIP(ip: string) {
    const regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
    return regex.test(ip);
  }

  const fetchTowerInfo = async () => {
    try {
      const response = await axios.get(`http://${esp32IP}/api/get/tower-info`);
      setTowerInfo(response.data.data);
    } catch (error) {
      console.error('Error al obtener la información de la torre:', error);
      // toast.error('Error al obtener la información de la torre');
    }
  };

  // Efecto para manejar `devMode` y abrir el diálogo
  useEffect(() => {
    if (devMode) {
      toast.success('DevMode Activado', {
        position: 'top-right',
        autoClose: 5000,
      });
      setDialogOpen(true); // Abrir el diálogo cuando se activa DevMode
      fetchTowerInfo();
    } else {
      setDialogOpen(false); // Cerrar el diálogo si DevMode se desactiva
      toast.warning('DevMode Desactivado', {
        position: 'top-right',
        autoClose: 5000,
      });
      setWebSocketAdress(LOCAL_WEBSOCKET); // Restaurar WebSocket a local
      fetchTowerInfo();
    }
  }, [devMode]);

  // Efecto para manejar la obtención de la información de la torre
  useEffect(() => {
    fetchTowerInfo();
  }, [esp32IP, inputIP]);

  // Manejo de temas
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#AAE3E2' : '#788e98',
      },
      background: {
        default: darkMode ? '#222831' : '#FFFFFF',
        paper: darkMode ? '#393E46' : '#FFFFFF',
      },
      text: {
        primary: darkMode ? '#EEEEEE' : '#1E2022',
      }
    },
  }), [darkMode]);

  // Manejo de la IP y validación al cerrar el diálogo
  const handleIpChange = () => {
    if (inputIP && isValidIP(inputIP)) {
      setEsp32IP(inputIP);
      setWebSocketAdress(`ws://${inputIP}:8080/`);
      toast.success('IP configurada correctamente', {
        position: 'top-right',
        autoClose: 5000,
      });
    } else {
      toast.error(`IP Invalida, se utilizara la IP predeterminada: ${DEFAULT_IP}`);
      setEsp32IP(DEFAULT_IP);
      setWebSocketAdress(`ws://${DEFAULT_IP}:8080/`);
    }
    setDialogOpen(false);
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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

      {showAdminPanel ? (
        //Panel de Administración
        <AdminPanel setShowAdminPanel={setShowAdminPanel} />
      ) : (

        <>
          <Box
            sx={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',

            }}
          >
            <FormControlLabel
              control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} icon={<Brightness7Icon />} checkedIcon={<Brightness4Icon />} />}
              label={darkMode ? '' : ''}
              labelPlacement="top"
              sx={{ color: theme.palette.text.primary }}
            />
            <FormControlLabel
              control={<Switch checked={devMode} onChange={() => setDevMode(!devMode)} icon={<CodeIcon />} checkedIcon={<BugReportIcon />} />}
              label={devMode ? '' : ''}
              labelPlacement="top"
              sx={{ color: theme.palette.text.primary, display: showGraph ? 'none' : 'block' }}
            />
          </Box>

          <Container
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              height: '100vh',
              padding: 3,
            }}
          >
            {!showGraph && (
              <>
                <Typography
                  variant="h6"
                  align="center"
                  gutterBottom
                  sx={{ fontWeight: 'bold', color: theme.palette.text.primary, marginBottom: 2 }}
                >
                  {devMode && esp32IP}
                </Typography>
                <img src={ReportImage} alt="Access" style={{ width: 150, height: 150 }} />

                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  sx={{ marginTop: 3, marginBottom: 2, fontWeight: 'bold', color: theme.palette.text.primary }}
                >
                  Información de la Torre
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowAdminPanel(true)}  // Transición al panel de administración
                  sx={{ marginTop: 2 }}
                >
                  Ir al Panel de Administración
                </Button>
              </>
            )}
            <Box sx={{ width: '100%', height: '100%', padding: 2, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
              {!showGraph ? (
                <TowerInfo onContinue={handleContinue} towerInfo={towerInfo} />
              ) : (
                <Graph onBack={() => setShowGraph(false)} webSocketAdress={webSocketAdress} devMode={devMode} />
              )}
            </Box>
          </Container>

          <Dialog
            open={dialogOpen}
            onClose={(event, reason) => {
              if (reason !== 'backdropClick') {
                handleDialogClose();
              }
            }}
            disableEscapeKeyDown
            PaperProps={{
              sx: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 1,
              },
            }}
          >
            <DialogTitle sx={{ textAlign: 'center' }}>DevMode Activado</DialogTitle>
            <DialogContent>
              <TextField
                label="ESP32 IP Address"
                variant="outlined"
                fullWidth
                value={inputIP}
                onChange={(e) => setInputIP(e.target.value)}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>
              <Button onClick={handleIpChange} color="primary" variant="contained">
                OK
              </Button>
            </DialogActions>
          </Dialog>

        </>
      )}
    </ThemeProvider>
  );
};

export default App;
