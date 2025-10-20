import { Box, Typography } from "@mui/material";
import { CellTower as TowerIcon } from "@mui/icons-material";
import { Device, Sensor } from "../../api/index";

interface TowerViewProps {
  device: Device;
  darkMode: boolean;
}

export const TowerView = ({ device, darkMode }: TowerViewProps) => {
  const getSensorColor = (sensor: Sensor) => {
    return sensor.alarm_triggered ? "#ef4444" : "#22c55e";
  };

  const calculateSize = (value: number) => {
    const minSize = 40;
    const maxSize = 80;
    // Normalizar el valor (ajusta según el rango esperado de tus sensores)
    const normalizedValue = Math.min(value / 1000, 1);
    return minSize + (maxSize - minSize) * normalizedValue;
  };

  // Posiciones para 3 o 4 sensores
  const get3SensorPositions = () => [
    { top: 20, left: "50%", transform: "translateX(-50%)" }, // Arriba
    { bottom: 20, left: "25%", transform: "translateX(-50%)" }, // Abajo izquierda
    { bottom: 20, right: "25%", transform: "translateX(50%)" }, // Abajo derecha
  ];

  const get4SensorPositions = () => [
    { top: 20, left: "50%", transform: "translateX(-50%)" }, // Norte
    { bottom: 20, left: "50%", transform: "translateX(-50%)" }, // Sur
    { right: 20, top: "50%", transform: "translateY(-50%)" }, // Este
    { left: 20, top: "50%", transform: "translateY(-50%)" }, // Oeste
  ];

  const sensorPositions = device.device_config === "3_sensores" 
    ? get3SensorPositions() 
    : get4SensorPositions();

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 300,
        bgcolor: darkMode ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)",
        borderRadius: 2,
        overflow: "hidden",
        border: darkMode
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid rgba(0,0,0,0.05)",
      }}
    >
      {/* Torre Central */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 60,
          height: 60,
          borderRadius: "50%",
          bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          border: `3px solid ${darkMode ? "#666" : "#999"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <TowerIcon sx={{ fontSize: 30, color: darkMode ? "#fff" : "#000" }} />
      </Box>

      {/* Sensores dinámicos */}
      {device.sensors.map((sensor, index) => {
        const position = sensorPositions[index];
        const color = getSensorColor(sensor);
        
        return (
          <Box
            key={sensor.id}
            sx={{
              position: "absolute",
              ...position,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: calculateSize(sensor.value),
                height: calculateSize(sensor.value),
                borderRadius: "50%",
                bgcolor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                boxShadow: `0 0 20px ${color}`,
                transition: "all 0.3s ease",
                border: sensor.alarm_triggered ? `3px solid ${color}` : "none",
                animation: sensor.alarm_triggered ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: `0 0 5px ${color}` },
                  '50%': { boxShadow: `0 0 30px ${color}` },
                  '100%': { boxShadow: `0 0 5px ${color}` },
                },
              }}
            >
              <Typography variant="h6" fontWeight="bold" color="white">
                {sensor.value.toFixed(1)}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ 
                mt: 1, 
                display: "block",
                color: sensor.alarm_triggered ? "error.main" : "text.primary"
              }}
            >
              {sensor.name.toUpperCase()}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};
