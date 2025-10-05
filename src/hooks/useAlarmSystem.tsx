import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Device, DeviceThresholdConfig, api } from '../api/index';

interface AlarmState {
  isActive: boolean;
  type: 'low_low' | 'low' | 'high' | 'high_high' | null;
  startTime: number | null;
  cable: string | null;
  currentValue: number | null;
  averageValue: number | null;
}

interface CircularBufferData {
  [deviceId: number]: {
    [cable: string]: number[];
  };
}

interface AlarmStates {
  [deviceId: number]: {
    [cable: string]: AlarmState;
  };
}

interface UseAlarmSystemProps {
  devices: Device[];
  devicesConfig: DeviceThresholdConfig[] | null;
  updateInterval?: number; // en milisegundos, default 1000 (1 segundo)
  devMode?: boolean; // Para saber si está en modo desarrollo
}

export const useAlarmSystem = ({ 
  devices, 
  devicesConfig, 
  updateInterval = 1000,
  devMode = false 
}: UseAlarmSystemProps) => {
  const [circularBuffers, setCircularBuffers] = useState<CircularBufferData>({});
  const [alarmStates, setAlarmStates] = useState<AlarmStates>({});
  const intervalRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const lastExecutionRef = useRef<number>(Date.now());
  const lastLedStates = useRef<{[deviceId: number]: boolean}>({});
  
  // Referencias para mantener valores actuales sin causar re-renders
  const devicesRef = useRef(devices);
  const devicesConfigRef = useRef(devicesConfig);
  const circularBuffersRef = useRef(circularBuffers);
  const alarmStatesRef = useRef(alarmStates);
  
  // Memoizar configuraciones estables
  const stableUpdateInterval = useMemo(() => updateInterval, [updateInterval]);
  const stableDevMode = useMemo(() => devMode, [devMode]);
  
  // Actualizar referencias cuando cambian los valores
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);
  
  useEffect(() => {
    devicesConfigRef.current = devicesConfig;
  }, [devicesConfig]);
  
  useEffect(() => {
    circularBuffersRef.current = circularBuffers;
  }, [circularBuffers]);
  
  useEffect(() => {
    alarmStatesRef.current = alarmStates;
  }, [alarmStates]);

  // Función para controlar LED del dispositivo
  const controlLED = useCallback(async (deviceId: number, shouldBeOn: boolean) => {
    // Solo llamar API si el estado cambió para evitar spam
    if (lastLedStates.current[deviceId] === shouldBeOn) return;
    
    try {
      if (!stableDevMode) {
        console.log(`🚨 Controlando LED - Device ${deviceId}: ${shouldBeOn ? 'ON' : 'OFF'}`);
        await api.toggleLed(deviceId, shouldBeOn);
      } else {
        console.log(`🚨 [DEV MODE] LED Device ${deviceId}: ${shouldBeOn ? 'ON' : 'OFF'}`);
      }
      
      // Actualizar estado local
      lastLedStates.current[deviceId] = shouldBeOn;
    } catch (error) {
      console.error(`Error controlando LED del device ${deviceId}:`, error);
    }
  }, [stableDevMode]);

  // Función para inicializar buffers circulares
  const initializeBuffers = useCallback(() => {
    if (!devicesConfig || devicesConfig.length === 0) {
      console.log(`🔧 No inicializando buffers - configs: ${devicesConfig?.length || 0}`);
      return;
    }

    const newBuffers: CircularBufferData = {};
    const newAlarmStates: AlarmStates = {};

    // Inicializar basado SOLO en la configuración de thresholds, no en devices del WebSocket
    devicesConfig.forEach(config => {
      if (config.active) {
        // Usar el valor máximo de tiempo para asegurar que cubra todos los tipos de alarma
        const maxTimeRequired = Math.max(
          config.alarm_times.time_low_low || 60,
          config.alarm_times.time_low || 60,
          config.alarm_times.time_high || 60,
          config.alarm_times.time_high_high || 60
        );
        
        console.log(`🔧 Device ${config.device_id} - Configurando buffers con tamaño: ${maxTimeRequired} segundos`);
        console.log(`🔧 Tiempos configurados: low_low=${config.alarm_times.time_low_low}s, low=${config.alarm_times.time_low}s, high=${config.alarm_times.time_high}s, high_high=${config.alarm_times.time_high_high}s`);
        
        newBuffers[config.device_id] = {
          Norte: new Array(maxTimeRequired).fill(0),
          Sur: new Array(maxTimeRequired).fill(0),
          Este: new Array(maxTimeRequired).fill(0),
          Oeste: new Array(maxTimeRequired).fill(0),
        };

        newAlarmStates[config.device_id] = {
          Norte: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
          Sur: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
          Este: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
          Oeste: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
        };
      }
    });

    console.log(`🎯 Buffers inicializados para ${Object.keys(newBuffers).length} devices basado en thresholds`);
    setCircularBuffers(newBuffers);
    setAlarmStates(newAlarmStates);
  }, [devicesConfig?.length]); // Solo depende de la configuración

  // Función principal para procesar alarmas - SIN dependencias externas
  const processAlarms = useCallback(() => {
    lastExecutionRef.current = Date.now();
    const currentDevices = devicesRef.current;
    const currentDevicesConfig = devicesConfigRef.current;
    const currentCircularBuffers = circularBuffersRef.current;
    
    console.log(`🔄 Procesando alarmas... Devices: ${currentDevices.length}, Configs: ${currentDevicesConfig?.length || 0}`);
    
    if (!currentDevicesConfig?.length) {
      console.log('❌ No hay configuración de thresholds - saltando procesamiento');
      return;
    }

    // Si no hay devices del WebSocket, no podemos procesar valores actuales, pero el sistema está listo
    if (!currentDevices.length) {
      console.log('⏳ Esperando datos del WebSocket... Sistema de alarmas configurado y listo');
      return;
    }

    currentDevices.forEach(device => {
      const config = currentDevicesConfig.find(c => c.device_id === device.id);
      if (!config || !config.active) {
        console.log(`⚠️ Device ${device.id}: Config no encontrada o inactiva`);
        return;
      }

        // Inicializar buffers si no existen
        if (!currentCircularBuffers[device.id]) {
          console.log(`🔧 Inicializando buffers para device ${device.id}`);
          const maxTimeRequired = Math.max(
            config.alarm_times.time_low_low || 60,
            config.alarm_times.time_low || 60,
            config.alarm_times.time_high || 60,
            config.alarm_times.time_high_high || 60
          );
          
          setCircularBuffers(prev => ({
            ...prev,
            [device.id]: {
              Norte: new Array(maxTimeRequired).fill(0),
              Sur: new Array(maxTimeRequired).fill(0),
              Este: new Array(maxTimeRequired).fill(0),
              Oeste: new Array(maxTimeRequired).fill(0),
            }
          }));
          
          setAlarmStates(prev => ({
            ...prev,
            [device.id]: {
              Norte: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
              Sur: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
              Este: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
              Oeste: { isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null },
            }
          }));
          return;
        }      const cables = ['Norte', 'Sur', 'Este', 'Oeste'] as const;
      let deviceHasAlarm = false;
      
      cables.forEach(cable => {
        const currentValue = device[cable];
        console.log(`📊 Device ${device.id}, Cable ${cable}: ${currentValue}N`);
        
        // Actualizar buffer circular
        setCircularBuffers(prev => {
          const buffer = prev[device.id]?.[cable];
          if (!buffer) return prev;
          
          const newBuffer = [...buffer];
          newBuffer.shift();
          newBuffer.push(currentValue);
          
          return {
            ...prev,
            [device.id]: {
              ...prev[device.id],
              [cable]: newBuffer
            }
          };
        });
        
        // Calcular promedio según el tipo de alarma detectado
        const buffer = currentCircularBuffers[device.id][cable];
        const validValues = buffer.filter(val => val > 0);
        if (validValues.length === 0) return;
        
        // Determinar tipo de alarma primero (del más específico al más general)
        let potentialAlarmType: 'low_low' | 'low' | 'high' | 'high_high' | null = null;
        const { low_low, low, high, high_high } = config.thresholds;
        
        // Evaluar en orden de prioridad: primero los más críticos
        if (currentValue <= low_low) {
          potentialAlarmType = 'low_low';
        } else if (currentValue >= high_high) {
          potentialAlarmType = 'high_high';
        } else if (currentValue <= low) {
          potentialAlarmType = 'low';
        } else if (currentValue >= high) {
          potentialAlarmType = 'high';
        }
        
        console.log(`📊 Device ${device.id}, Cable ${cable}: ${currentValue}N, Thresholds: low_low≤${low_low}, low≤${low}, high≥${high}, high_high≥${high_high}, Tipo detectado: ${potentialAlarmType || 'normal'}`);
        
        // Solo calcular promedio si hay una alarma potencial
        let average = validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
        let shouldTriggerAlarm = false;
        
        if (potentialAlarmType) {
          // Determinar cuántas lecturas necesitamos para esta alarma
          let requiredReadings = 30; // default
          switch (potentialAlarmType) {
            case 'low_low':
              requiredReadings = config.alarm_times.time_low_low;
              break;
            case 'low':
              requiredReadings = config.alarm_times.time_low;
              break;
            case 'high':
              requiredReadings = config.alarm_times.time_high;
              break;
            case 'high_high':
              requiredReadings = config.alarm_times.time_high_high;
              break;
          }
          
          // Verificar si tenemos suficientes lecturas del tipo correcto
          const recentReadings = validValues.slice(-requiredReadings);
          if (recentReadings.length >= requiredReadings) {
            // Calcular promedio de las lecturas requeridas
            average = recentReadings.reduce((acc, val) => acc + val, 0) / recentReadings.length;
            
            // Verificar si el promedio también está en el mismo rango de alarma
            if (potentialAlarmType === 'low_low' && average <= low_low) {
              shouldTriggerAlarm = true;
            } else if (potentialAlarmType === 'high_high' && average >= high_high) {
              shouldTriggerAlarm = true;
            } else if (potentialAlarmType === 'low' && average <= low) {
              shouldTriggerAlarm = true;
            } else if (potentialAlarmType === 'high' && average >= high) {
              shouldTriggerAlarm = true;
            }
            
            console.log(`� Device ${device.id}, Cable ${cable}: Valor=${currentValue}N, Promedio(${requiredReadings}s)=${average.toFixed(2)}N, Tipo=${potentialAlarmType}, Trigger=${shouldTriggerAlarm}`);
          } else {
            console.log(`⏳ Device ${device.id}, Cable ${cable}: Esperando más lecturas ${recentReadings.length}/${requiredReadings} para ${potentialAlarmType}`);
          }
        } else {
          console.log(`✅ NORMAL - Device ${device.id}, Cable ${cable}: ${currentValue}N (promedio: ${average.toFixed(2)}N)`);
        }
        
        // Determinar estado final de alarma
        let finalAlarmType: 'low_low' | 'low' | 'high' | 'high_high' | null = null;
        if (shouldTriggerAlarm && potentialAlarmType) {
          finalAlarmType = potentialAlarmType;
          if (finalAlarmType === 'low_low' || finalAlarmType === 'high_high') {
            console.log(`🔥 ALARMA CRÍTICA - Device ${device.id}, Cable ${cable}: ${finalAlarmType}, Promedio: ${average.toFixed(2)}N`);
          } else {
            console.log(`⚠️ ALARMA ADVERTENCIA - Device ${device.id}, Cable ${cable}: ${finalAlarmType}, Promedio: ${average.toFixed(2)}N`);
          }
        }
        
        // Actualizar estado de alarma
        setAlarmStates(prev => {
          const currentAlarm = prev[device.id]?.[cable] || { 
            isActive: false, type: null, startTime: null, cable: null, currentValue: null, averageValue: null 
          };
          
          // Nueva alarma activada
          if (finalAlarmType && !currentAlarm.isActive) {
            console.log(`🚨 ALARMA ACTIVADA - Device ${device.id}, Cable ${cable}: ${finalAlarmType}, Promedio: ${average.toFixed(2)}N`);
            deviceHasAlarm = true;
            
            return {
              ...prev,
              [device.id]: {
                ...prev[device.id],
                [cable]: {
                  isActive: true,
                  type: finalAlarmType,
                  startTime: Date.now(),
                  cable: cable,
                  currentValue: currentValue,
                  averageValue: average,
                }
              }
            };
          }
          
          // Alarma resuelta
          if (!finalAlarmType && currentAlarm.isActive) {
            console.log(`✅ ALARMA RESUELTA - Device ${device.id}, Cable ${cable}, Promedio: ${average.toFixed(2)}N`);
            
            return {
              ...prev,
              [device.id]: {
                ...prev[device.id],
                [cable]: {
                  isActive: false,
                  type: null,
                  startTime: null,
                  cable: null,
                  currentValue: null,
                  averageValue: null,
                }
              }
            };
          }
          
          // Actualizar valores de alarma activa
          if (finalAlarmType && currentAlarm.isActive) {
            deviceHasAlarm = true;
            return {
              ...prev,
              [device.id]: {
                ...prev[device.id],
                [cable]: {
                  ...currentAlarm,
                  currentValue: currentValue,
                  averageValue: average,
                }
              }
            };
          }
          
          return prev;
        });
        
        if (finalAlarmType) deviceHasAlarm = true;
      });

      // Control de LED
      if (lastLedStates.current[device.id] !== deviceHasAlarm) {
        console.log(`🚨 CAMBIO DE LED - Device ${device.id}: ${lastLedStates.current[device.id]} → ${deviceHasAlarm}`);
        controlLED(device.id, deviceHasAlarm);
      } else if (deviceHasAlarm) {
        console.log(`🚨 Device ${device.id} mantiene alarma activa (LED ya encendido)`);
      }
    });
  }, []); // Sin dependencias para evitar bucles

  // Función para inicializar el interval de forma estable
  const initializeInterval = useCallback(() => {
    // Solo necesita configuración, no devices del WebSocket
    if (!devicesConfigRef.current?.length) {
      console.log(`⏸️ No inicializando interval - configs: ${devicesConfigRef.current?.length || 0}`);
      return;
    }
    
    console.log(`⏰ Configurando intervalo de alarmas cada ${stableUpdateInterval}ms`);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString();
      console.log(`⏰ TICK [${timeStr}] - Procesando alarmas cada ${stableUpdateInterval/1000}s`);
      
      // Verificar que el intervalo sigue existiendo
      if (!intervalRef.current) {
        console.log('❌ Intervalo perdido, saliendo...');
        return;
      }
      
      try {
        processAlarms();
        lastExecutionRef.current = now;
      } catch (error) {
        console.error('❌ Error en processAlarms:', error);
      }
    }, stableUpdateInterval);
  }, [stableUpdateInterval, processAlarms]);

  // Efecto para inicializar buffers cuando cambian las configuraciones
  useEffect(() => {
    if (!devicesConfig || devicesConfig.length === 0) {
      console.log(`🔧 No inicializando buffers - configs: ${devicesConfig?.length || 0}`);
      return;
    }
    
    console.log('🔧 Inicializando sistema de alarmas basado en thresholds...');
    initializeBuffers();
    
    // IMPORTANTE: Inicializar el interval DESPUÉS de configurar los buffers
    console.log('🚀 Iniciando interval de alarmas tras configurar buffers...');
    initializeInterval();
  }, [devicesConfig?.length, initializeBuffers, initializeInterval]);

  // Efecto para procesar alarmas en intervalos - SIN dependencias problemáticas
  useEffect(() => {
    // Este useEffect ya no es necesario porque initializeInterval se llama desde el useEffect anterior
    // initializeInterval();

    // Health check cada 90 segundos (1.5x el intervalo principal)
    const healthCheckInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastExecutionRef.current > 120000) { // 2 minutos sin ejecutar
        console.log('⚠️ Health check detectó inactividad, reiniciando interval...');
        console.log(`Última ejecución: ${new Date(lastExecutionRef.current).toLocaleTimeString()}`);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        initializeInterval();
      }
    }, 90000);

    return () => {
      if (intervalRef.current) {
        console.log('🛑 Limpiando intervalo de alarmas');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearInterval(healthCheckInterval);
    };
  }, [initializeInterval]); // Solo depende de la función estable

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup final del useAlarmSystem');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    alarmStates,
    circularBuffers,
    getActiveAlarms: () => {
      const activeAlarms: Array<AlarmState & { deviceId: number }> = [];
      
      Object.entries(alarmStatesRef.current).forEach(([deviceId, deviceAlarms]) => {
        Object.entries(deviceAlarms).forEach(([cable, alarm]) => {
          const alarmState = alarm as AlarmState;
          if (alarmState && alarmState.isActive) {
            activeAlarms.push({
              ...alarmState,
              deviceId: parseInt(deviceId),
            });
          }
        });
      });
      
      return activeAlarms;
    },
    getCableAlarmState: (deviceId: number, cable: string): AlarmState => {
      return alarmStatesRef.current[deviceId]?.[cable] || {
        isActive: false,
        type: null,
        startTime: null,
        cable: null,
        currentValue: null,
        averageValue: null,
      };
    },
    getCableAverage: (deviceId: number, cable: string): number => {
      const buffer = circularBuffersRef.current[deviceId]?.[cable];
      if (!buffer) return 0;
      
      const validValues = buffer.filter(val => val > 0);
      if (validValues.length === 0) return 0;
      
      return validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
    },
    initializeBuffers,
  };
};

export default useAlarmSystem;