import { useEffect, useMemo, useState } from 'react';
import { createTheme, ThemeProvider, CssBaseline, Switch, FormControlLabel, Typography, Container, Paper, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Lottie from 'react-lottie-player';
import lottieJson from './assets/animations/tower.json';
import Graph from './components/Graph';
import TowerInfo from './components/TowerInfo';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const LOCAL_WEBSOCKET = 'ws://localhost:8080';
  const DEFAULT_IP = '192.168.1.135';
  const [showGraph, setShowGraph] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [webSocketAdress, setWebSocketAdress] = useState(LOCAL_WEBSOCKET);
  const [esp32IP, setEsp32IP] = useState(DEFAULT_IP);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputIP, setInputIP] = useState(DEFAULT_IP);

  const handleContinue = () => {
    setShowGraph(true);
  };

  const darkThemeColors = {
    primary: {
      100: '#00ADB5',
      200: '#AAE3E2',
    },
    text: {
      100: '#EEEEEE',
    },
    bg: {
      100: '#222831',
      200: '#393E46',
    }
  };

  const lightThemeColors = {
    primary: {
      100: '#272343',
      200: '#788e98',
      300: '#F0F5F9',
    },
    text: {
      100: '#1E2022',
      200: '#52616B',
    },
    bg: {
      100: '#FFFFFF',
      200: '#E3F6F5',
    }
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? darkThemeColors.primary[200] : lightThemeColors.primary[200],
      },
      background: {
        default: darkMode ? darkThemeColors.bg[100] : lightThemeColors.bg[100],
        paper: darkMode ? darkThemeColors.bg[200] : lightThemeColors.bg[100],
      },
      text: {
        primary: darkMode ? darkThemeColors.text[100] : lightThemeColors.text[100],
      }
    },
  }), [darkMode]);

  function isValidIP(ip) {
    const regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
    return regex.test(ip);
  }


  const onBack = () => {
    setShowGraph(false);
  };

  useEffect(() => {
    if (devMode) {
      setDialogOpen(true);
      toast.success(`DevMode Activado`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      setWebSocketAdress(LOCAL_WEBSOCKET);
      toast.warning(`DevMode Desactivado`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }, [devMode]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    if (inputIP && isValidIP(inputIP)) {
      setEsp32IP(inputIP);
      setWebSocketAdress(`ws://${inputIP}:8080`);
    } else {
      toast.error("IP Invalida, se utilizara la IP por default:");
      setEsp32IP(DEFAULT_IP);
      setWebSocketAdress(`ws://${DEFAULT_IP}:8080`);
    }
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              icon={<Brightness7Icon />}
              checkedIcon={<Brightness4Icon />}
            />
          }
          label={darkMode ? '' : ''}
          labelPlacement="top"
          sx={{
            color: theme.palette.text.primary,
          }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={devMode}
              onChange={() => setDevMode(!devMode)}
              icon={<CodeIcon />}
              checkedIcon={<BugReportIcon />}
            />
          }
          label={devMode ? '' : ''}
          labelPlacement="top"
          sx={{
            color: theme.palette.text.primary,
            display: showGraph ? 'none' : 'block',
          }}
        />
        <ToastContainer />
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
        {!showGraph &&
          <>
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                marginBottom: 2,
              }}
            >
              {devMode && esp32IP}
            </Typography>
            <Lottie
              loop
              animationData={lottieJson}
              play
              style={{ width: 150, height: 150 }}
            />
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                marginTop: 3,
                marginBottom: 2,
                fontWeight: 'bold',
                color: theme.palette.text.primary,
              }}
            >
              Información de la Torre
            </Typography>
          </>
        }

        <Box
          sx={{
            width: '100%',
            height: '100%',
            padding: 2,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {!showGraph ? (
            <TowerInfo onContinue={handleContinue} />
          ) : (
            <Graph onBack={onBack} webSocketAdress={webSocketAdress} devMode={devMode} />
          )}
        </Box>
      </Container>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>DevMode Activado</DialogTitle>
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
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary" variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
