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
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
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
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(true);
  const [thresholds, setThresholds] = useState<ThresholdValues>({
    low_low: 200,    // 20% de 1000
    low: 400,        // 40% de 1000  
    high: 1600,      // 160% de 1000
    high_high: 2000, // 200% de 1000
  });
  const [timeToAlarm, setTimeToAlarm] = useState<number>(30);

  // Inicializar valores con la configuración del dispositivo
  useEffect(() => {
    if (deviceConfig) {
      // Cargar valores desde deviceConfig
      setActive(deviceConfig.active);
      setThresholds(deviceConfig.thresholds);
      setTimeToAlarm(deviceConfig.alarm_times.time_low);
    } else {
      // Si no hay deviceConfig, usar valores por defecto (ya están establecidos en el estado inicial)
      console.log(`📝 Usando valores por defecto para device ${deviceId}`);
    }
  }, [deviceConfig, deviceId]);

  const handleThresholdChange = (field: keyof ThresholdValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setThresholds(prev => ({ ...prev, [field]: numValue }));
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
      // En dev mode, solo simulamos el guardado
      if (devMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Configuración guardada (modo desarrollo)');
      } else {
        // Llamar a la API real para guardar thresholds
        const response = await currentApi.setThresholds({
          device_id: deviceId,
          low_low: thresholds.low_low,
          low: thresholds.low,
          high: thresholds.high,
          high_high: thresholds.high_high,
          active,
          time_low: timeToAlarm,
        });

        if (response.status === 'success') {
          toast.success('Configuración de thresholds actualizada');
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
            time_low_low: timeToAlarm,
            time_low: timeToAlarm,
            time_high: timeToAlarm,
            time_high_high: timeToAlarm,
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
      disableEscapeKeyDown={isRequiredSetup} // No cerrar con ESC si es obligatorio
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6">
            {isRequiredSetup ? 'Configuración Inicial Requerida' : 'Configuración de Thresholds'} - Device #{deviceId}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
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
          <FormControlLabel
            control={
              <Switch
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                color="primary"
              />
            }
            label="Activar alertas para este dispositivo"
            sx={{ mb: 3 }}
          />

          {devMode && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Modo Desarrollo:</strong> Los cambios no se enviarán al ESP32 real.
            </Alert>
          )}

          {/* Configuración de Thresholds */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
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
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Crítico Bajo (Low Low)"
                type="number"
                value={thresholds.low_low}
                onChange={(e) => handleThresholdChange('low_low', e.target.value)}
                disabled={!active}
                InputProps={{
                  endAdornment: <Chip label="Crítico" color="error" size="small" />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Advertencia Bajo (Low)"
                type="number"
                value={thresholds.low}
                onChange={(e) => handleThresholdChange('low', e.target.value)}
                disabled={!active}
                InputProps={{
                  endAdornment: <Chip label="Advertencia" color="warning" size="small" />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Advertencia Alto (High)"
                type="number"
                value={thresholds.high}
                onChange={(e) => handleThresholdChange('high', e.target.value)}
                disabled={!active}
                InputProps={{
                  endAdornment: <Chip label="Advertencia" color="warning" size="small" />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Crítico Alto (High High)"
                type="number"
                value={thresholds.high_high}
                onChange={(e) => handleThresholdChange('high_high', e.target.value)}
                disabled={!active}
                InputProps={{
                  endAdornment: <Chip label="Crítico" color="error" size="small" />
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Configuración de Tiempo de Alarma */}
          <Typography variant="h6" gutterBottom>
            Tiempo para Activar Alarma
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tiempo de Evaluación (segundos)"
                type="number"
                value={timeToAlarm}
                onChange={(e) => setTimeToAlarm(parseInt(e.target.value) || 30)}
                disabled={!active}
                helperText="Tiempo que debe mantenerse el promedio en rango de alarma antes de activarla"
                inputProps={{ min: 5, max: 300 }}
              />
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
                  <strong>Ejemplo:</strong> Si configuras 30 segundos, la alarma se activará cuando el promedio de los últimos 30 valores esté fuera del rango normal.
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
      </DialogContent>

      <DialogActions>
        {/* Solo mostrar botón cancelar si NO es configuración obligatoria */}
        {!isRequiredSetup && (
          <Button onClick={onClose} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
        )}
        
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading || !active}
        >
          {loading 
            ? 'Guardando...' 
            : isRequiredSetup 
              ? 'Guardar y Continuar' 
              : 'Guardar Configuración'
          }
        </Button>
        
        {isRequiredSetup && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            * Debe guardar la configuración para continuar
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ThresholdSettings;