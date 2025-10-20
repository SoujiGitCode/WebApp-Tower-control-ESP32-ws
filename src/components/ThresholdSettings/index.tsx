import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { DeviceThresholdConfig, ThresholdValues, AlarmTimes, Threshold } from '../../api/index';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

interface ThresholdSettingsProps {
  open: boolean;
  onClose: () => void;
  deviceId: number;
  deviceConfig?: DeviceThresholdConfig;
  onConfigUpdate?: (config: DeviceThresholdConfig) => void;
  isRequiredSetup?: boolean; // Indica si es una configuración obligatoria
}

const ThresholdSettings: React.FC<ThresholdSettingsProps> = ({
  open,
  onClose,
  deviceId,
  deviceConfig,
  onConfigUpdate,
  isRequiredSetup = false, // Por defecto no es obligatorio
}) => {
  const { currentApi, devMode } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [active, setActive] = useState(true);
  const [thresholds, setThresholds] = useState<ThresholdValues>({
    low_low: 10,
    low: 50,
    high: 1000,
    high_high: 1500,
  });
  const [windowMinutes, setWindowMinutes] = useState<number>(3);

  // Cargar thresholds existentes desde el API cuando se abre el modal
  useEffect(() => {
    if (open && deviceId) {
      loadThresholdsFromAPI();
    }
  }, [open, deviceId]);

  const loadThresholdsFromAPI = async () => {
    setLoadingData(true);
    try {
      console.log(`📡 Cargando thresholds para device ${deviceId}...`);
      
      // Llamar al endpoint /api/thresholds
      const response = await currentApi.getThresholds();
      
      if (response.status === 'success' && response.data) {
        // La respuesta puede ser un array de Thresholds
        const thresholdsArray = response.data as any;
        
        // Buscar el threshold del dispositivo actual
        const deviceThreshold = Array.isArray(thresholdsArray) 
          ? thresholdsArray.find((t: any) => t.device_id === deviceId)
          : null;
        
        if (deviceThreshold) {
          console.log('✅ Thresholds encontrados:', deviceThreshold);
          setActive(deviceThreshold.active !== false); // Por defecto true si no está definido
          setThresholds({
            low_low: deviceThreshold.low_low,
            low: deviceThreshold.low,
            high: deviceThreshold.high,
            high_high: deviceThreshold.high_high,
          });
          setWindowMinutes(deviceThreshold.window_minutes || 3);
        } else {
          console.log('⚠️ No se encontró configuración para este device, usando valores por defecto');
          // Mantener los valores por defecto del estado inicial
        }
      }
    } catch (error) {
      console.error('❌ Error cargando thresholds:', error);
      toast.error('Error al cargar la configuración actual');
    } finally {
      setLoadingData(false);
    }
  };

  const handleThresholdChange = (field: keyof ThresholdValues, value: string) => {
    // Permitir solo números, puntos decimales y eliminar caracteres no válidos
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Evitar múltiples puntos decimales
    const parts = cleanValue.split('.');
    const formattedValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : cleanValue;
    
    // Actualizar el estado con el valor de texto limpio
    const numValue = parseFloat(formattedValue) || 0;
    setThresholds(prev => ({ ...prev, [field]: numValue }));
  };

  const handleWindowMinutesChange = (value: number) => {
    // Asegurar que esté entre 1 y 5
    if (value >= 1 && value <= 5) {
      setWindowMinutes(value);
    }
  };

  const validateThresholds = (): boolean => {
    const { low_low, low, high, high_high } = thresholds;
    
    if (low_low >= low || low >= high || high >= high_high) {
      toast.error('Los valores deben estar en orden: low_low < low < high < high_high');
      return false;
    }
    
    if (low_low < 0 || high_high > 10000) {
      toast.error('Los valores deben estar entre 0 y 10000');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateThresholds()) return;
    
    setLoading(true);
    try {
      // Preparar datos para enviar
      const dataToSend = {
        device_id: deviceId,
        low_low: thresholds.low_low,
        low: thresholds.low,
        high: thresholds.high,
        high_high: thresholds.high_high,
        active,
        window_minutes: windowMinutes,
      };

      console.log('💾 Guardando thresholds:', dataToSend);

      // En dev mode, solo simulamos el guardado
      if (devMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Configuración guardada (modo desarrollo)');
      } else {
        // Llamar a la API real para guardar thresholds
        const response = await currentApi.setThresholds(dataToSend);

        if (response.status === 'success') {
          toast.success('Configuración de thresholds actualizada correctamente');
        } else {
          toast.error(`Error: ${response.message}`);
          return;
        }
      }

      // Notificar al componente padre sobre la actualización
      if (onConfigUpdate) {
        const updatedConfig: DeviceThresholdConfig = {
          device_id: deviceId,
          active,
          thresholds,
          alarm_times: {
            time_low_low: windowMinutes,
            time_low: windowMinutes,
            time_high: windowMinutes,
            time_high_high: windowMinutes,
          },
        };
        onConfigUpdate(updatedConfig);
      }

      onClose();
    } catch (error) {
      console.error('Error guardando thresholds:', error);
      toast.error('Error de conexión al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const getColorForThreshold = (type: string) => {
    switch (type) {
      case 'low_low': return 'error';
      case 'low': return 'warning';
      case 'high': return 'warning';
      case 'high_high': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isRequiredSetup ? undefined : onClose} // No cerrable si es configuración obligatoria
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={isRequiredSetup} // No cerrar con ESC si es obligatorio
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          m: { xs: 0, sm: 2 },
          height: { xs: '100vh', sm: 'auto' },
          maxHeight: { xs: '100vh', sm: '90vh' }
        }
      }}
    >
      <DialogTitle sx={{ 
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {isRequiredSetup ? 'Configuración Inicial Requerida' : 'Configuración de Thresholds'} - Device #{deviceId}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        px: { xs: 2, sm: 3 },
        py: { xs: 1, sm: 2 },
        overflow: 'auto'
      }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Cargando configuración actual...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Alerta de configuración obligatoria */}
            {isRequiredSetup && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>⚠️ Configuración Requerida:</strong> Este dispositivo no tiene configuración de thresholds. 
                  Debe guardar una configuración antes de continuar. Se han establecido valores recomendados que puedes ajustar.
                </Typography>
              </Alert>
            )}

          {/* Switch para activar/desactivar */}
          {/* <FormControlLabel
            control={
              <Switch
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                color="primary"
              />
            }
            label="Activar alertas para este dispositivo"
            sx={{ mb: 3 }}
          /> */}

          {devMode && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Modo Desarrollo:</strong> Los cambios no se enviarán al ESP32 real.
            </Alert>
          )}

          {/* Configuración de Thresholds */}
          <Typography variant="h6" gutterBottom sx={{ 
            mt: 3,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Umbrales de Fuerza {isRequiredSetup && <Chip label="Valores Recomendados" color="info" size="small" />}
          </Typography>
          
          {isRequiredSetup && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Valores recomendados basados en 1000N:</strong><br/>
                • Crítico Bajo: 200N (20%) - Posible falla de tensión<br/>
                • Advertencia Bajo: 400N (40%) - Tensión reducida<br/>
                • Advertencia Alto: 1600N (160%) - Sobrecarga moderada<br/>
                • Crítico Alto: 2000N (200%) - Sobrecarga peligrosa
              </Typography>
            </Alert>
          )}
          
          <Grid container spacing={{ xs: 2, sm: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Crítico Bajo (Low Low)"
                type="text"
                value={thresholds.low_low}
                onChange={(e) => handleThresholdChange('low_low', e.target.value)}
                disabled={!active}
                placeholder="Ej: 200"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*[.]?[0-9]*',
                  style: { fontSize: isMobile ? '16px' : '14px' } // Evita zoom en iOS
                }}
                InputProps={{
                  endAdornment: <Chip label="Crítico" color="error" size="small" />
                }}
                helperText="Solo números permitidos"
                sx={{
                  '& .MuiInputBase-root': {
                    height: { xs: 56, sm: 56 }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Advertencia Bajo (Low)"
                type="text"
                value={thresholds.low}
                onChange={(e) => handleThresholdChange('low', e.target.value)}
                disabled={!active}
                placeholder="Ej: 400"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*[.]?[0-9]*',
                  style: { fontSize: isMobile ? '16px' : '14px' }
                }}
                InputProps={{
                  endAdornment: <Chip label="Advertencia" color="warning" size="small" />
                }}
                helperText="Solo números permitidos"
                sx={{
                  '& .MuiInputBase-root': {
                    height: { xs: 56, sm: 56 }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Advertencia Alto (High)"
                type="text"
                value={thresholds.high}
                onChange={(e) => handleThresholdChange('high', e.target.value)}
                disabled={!active}
                placeholder="Ej: 1600"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*[.]?[0-9]*',
                  style: { fontSize: isMobile ? '16px' : '14px' }
                }}
                InputProps={{
                  endAdornment: <Chip label="Advertencia" color="warning" size="small" />
                }}
                helperText="Solo números permitidos"
                sx={{
                  '& .MuiInputBase-root': {
                    height: { xs: 56, sm: 56 }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Crítico Alto (High High)"
                type="text"
                value={thresholds.high_high}
                onChange={(e) => handleThresholdChange('high_high', e.target.value)}
                disabled={!active}
                placeholder="Ej: 2000"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*[.]?[0-9]*',
                  style: { fontSize: isMobile ? '16px' : '14px' }
                }}
                InputProps={{
                  endAdornment: <Chip label="Crítico" color="error" size="small" />
                }}
                helperText="Solo números permitidos"
                sx={{
                  '& .MuiInputBase-root': {
                    height: { xs: 56, sm: 56 }
                  }
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Configuración de Ventana de Tiempo */}
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <TimeIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1.2rem' }} />
            Ventana de Tiempo para Alarmas
          </Typography>
          
          <Grid container spacing={{ xs: 2, sm: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Ventana de Tiempo"
                value={windowMinutes}
                onChange={(e) => handleWindowMinutesChange(Number(e.target.value))}
                disabled={!active || loadingData}
                helperText="Tiempo en minutos para evaluar el promedio de las lecturas"
                sx={{
                  '& .MuiInputBase-root': {
                    height: { xs: 56, sm: 56 }
                  }
                }}
              >
                <MenuItem value={1}>1 minuto</MenuItem>
                <MenuItem value={2}>2 minutos</MenuItem>
                <MenuItem value={3}>3 minutos</MenuItem>
                <MenuItem value={4}>4 minutos</MenuItem>
                <MenuItem value={5}>5 minutos</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'action.hover', 
                borderRadius: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Ejemplo:</strong> Si configuras {windowMinutes} {windowMinutes === 1 ? 'minuto' : 'minutos'}, la alarma se activará cuando el promedio de los valores en {windowMinutes === 1 ? 'el último minuto' : `los últimos ${windowMinutes} minutos`} esté fuera del rango normal.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Visualización de rangos */}
          {/* <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Configuración de Alarmas:
            </Typography>
            <Typography variant="body2">
              • <strong>Array circular:</strong> {timeToAlarm} valores ({timeToAlarm} segundos)
            </Typography>
            <Typography variant="body2">
              • <strong>Crítico:</strong> Promedio ≤ {thresholds.low_low} o ≥ {thresholds.high_high}
            </Typography>
            <Typography variant="body2">
              • <strong>Advertencia:</strong> Promedio {thresholds.low_low + 1} - {thresholds.low} o {thresholds.high} - {thresholds.high_high - 1}
            </Typography>
            <Typography variant="body2">
              • <strong>Normal:</strong> Promedio {thresholds.low + 1} - {thresholds.high - 1}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              La alarma se activa cuando el promedio se mantiene fuera del rango normal durante {timeToAlarm} segundos consecutivos.
            </Typography>
          </Box> */}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2 },
        gap: { xs: 1, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'stretch'
      }}>
        {/* Solo mostrar botón cancelar si NO es configuración obligatoria */}
        {!isRequiredSetup && (
          <Button 
            onClick={onClose} 
            startIcon={<CancelIcon />}
            sx={{
              py: { xs: 1.5, sm: 1 },
              fontSize: { xs: '1rem', sm: '0.9rem' },
              order: { xs: 2, sm: 1 },
              minWidth: { xs: '100%', sm: 'auto' }
            }}
          >
            Cancelar
          </Button>
        )}
        
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading || !active}
          sx={{
            py: { xs: 1.5, sm: 1 },
            fontSize: { xs: '1rem', sm: '0.9rem' },
            fontWeight: 'bold',
            order: { xs: 1, sm: 2 },
            minWidth: { xs: '100%', sm: 'auto' },
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            }
          }}
        >
          {loading 
            ? 'Guardando...' 
            : isRequiredSetup 
              ? 'Guardar y Continuar' 
              : 'Guardar Configuración'
          }
        </Button>
        
        {isRequiredSetup && (
          <Typography variant="caption" color="text.secondary" sx={{ 
            ml: { xs: 0, sm: 2 },
            mt: { xs: 1, sm: 0 },
            textAlign: { xs: 'center', sm: 'left' },
            fontSize: { xs: '0.75rem', sm: '0.8rem' }
          }}>
            * Debe guardar la configuración para continuar
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ThresholdSettings;