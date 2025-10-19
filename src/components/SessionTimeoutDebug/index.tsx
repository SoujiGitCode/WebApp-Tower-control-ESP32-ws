import { useState, useEffect } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useAppContext } from '../../context/AppContext';

// Claves para localStorage
const SESSION_START_KEY = 'session_start_time';

/**
 * Componente de DEBUG para visualizar el tiempo de sesión
 * SOLO para desarrollo - eliminar en producción o configurar con flag
 */
const SessionTimeoutDebug = () => {
  const { loggedIn } = useAppContext();
  const [sessionTime, setSessionTime] = useState(0);
  const SESSION_DURATION = 2 * 60; // 2 minutos en segundos (PRUEBA)
  const WARNING_TIME = 1 * 60; // 1 minuto en segundos (60 seg)

  useEffect(() => {
    if (!loggedIn) {
      setSessionTime(0);
      return;
    }

    // Obtener el tiempo de inicio desde localStorage
    const getSessionStart = () => {
      const savedSessionStart = localStorage.getItem(SESSION_START_KEY);
      if (!savedSessionStart) {
        console.warn('⚠️ DEBUG: No se encontró session_start_time en localStorage');
        return null;
      }
      return parseInt(savedSessionStart, 10);
    };

    // Actualizar cada segundo
    const interval = setInterval(() => {
      const sessionStart = getSessionStart();
      if (!sessionStart) {
        setSessionTime(0);
        return;
      }
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      setSessionTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [loggedIn]);

  if (!loggedIn) return null;

  const remainingTime = SESSION_DURATION - sessionTime;
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  
  const isWarningZone = sessionTime >= WARNING_TIME;
  const isExpired = sessionTime >= SESSION_DURATION;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        padding: 2,
        boxShadow: 3,
        minWidth: 200,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        🐛 DEBUG - Timeout de Sesión
      </Typography>
      
      <Chip
        label={
          isExpired 
            ? '⛔ SESIÓN EXPIRADA' 
            : `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`
        }
        color={isExpired ? 'error' : isWarningZone ? 'warning' : 'success'}
        size="small"
        sx={{ width: '100%', fontWeight: 600 }}
      />
      
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Tiempo transcurrido: {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
      </Typography>
      
      {isWarningZone && !isExpired && (
        <Typography variant="caption" color="warning.main" display="block" mt={1} fontWeight={600}>
          ⚠️ Se mostrará alerta pronto
        </Typography>
      )}
    </Box>
  );
};

export default SessionTimeoutDebug;
