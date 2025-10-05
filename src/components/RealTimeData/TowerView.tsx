import { Box, Typography } from "@mui/material";
import { CellTower as TowerIcon } from "@mui/icons-material";
import { Device } from "../../api/index";

interface TowerViewProps {
  device: Device;
  darkMode: boolean;
  deviceConfig?: {
    thresholds?: {
      low_low: number;
      low: number;
      high: number;
      high_high: number;
    };
    active?: boolean;
  };
  getCableAlarmState?: (deviceId: number, cable: string) => any;
}

export const TowerView = ({ device, darkMode, deviceConfig, getCableAlarmState }: TowerViewProps) => {
  const getCableColor = (force: number, cableName?: string) => {
    // Primero evaluar usando thresholds instantáneos (siempre)
    if (deviceConfig?.thresholds) {
      const { low_low, low, high, high_high } = deviceConfig.thresholds;
      
      // Crítico: menor o igual a low_low O mayor o igual a high_high
      if (force <= low_low || force >= high_high) return "#ef4444"; // Crítico - Rojo
      
      // Alerta: entre low_low y low O entre high y high_high
      if ((force > low_low && force <= low) || (force >= high && force < high_high)) return "#f59e0b"; // Alerta - Amarillo
      
      // Normal: entre low y high
      return "#22c55e"; // Normal - Verde
    }

    // Si tenemos sistema de alarmas activo y hay una alarma, usar colores de alarma
    if (cableName && getCableAlarmState && deviceConfig?.active) {
      const alarmState = getCableAlarmState(device.id, cableName);
      if (alarmState.isActive) {
        switch (alarmState.type) {
          case 'low_low':
          case 'high_high':
            return "#ef4444"; // Crítico/Alarma - Rojo
          case 'low':
          case 'high':
            return "#f59e0b"; // Alerta - Amarillo
          default:
            break;
        }
      }
    }

    // Fallback a lógica anterior cuando no hay configuración de thresholds
    if (force < 1500) return "#22c55e"; // Normal - Verde
    if (force < 2000) return "#f59e0b"; // Alerta - Amarillo
    return "#ef4444"; // Crítico - Rojo
  };

  const calculateSize = (force: number) => {
    const minSize = 40;
    const maxSize = 80;
    const normalizedForce = Math.min(force / 3000, 1);
    return minSize + (maxSize - minSize) * normalizedForce;
  };

  const cables = [
    {
      name: "NORTE",
      value: device.Norte,
      cableName: "Norte", // Nombre para el sistema de alarmas
      style: { top: 20, left: "50%", transform: "translateX(-50%)" },
    },
    {
      name: "SUR",
      value: device.Sur,
      cableName: "Sur", // Nombre para el sistema de alarmas
      style: { bottom: 20, left: "50%", transform: "translateX(-50%)" },
    },
    {
      name: "ESTE",
      value: device.Este,
      cableName: "Este", // Nombre para el sistema de alarmas
      style: { right: 20, top: "50%", transform: "translateY(-50%)" },
    },
    {
      name: "OESTE",
      value: device.Oeste,
      cableName: "Oeste", // Nombre para el sistema de alarmas
      style: { left: 20, top: "50%", transform: "translateY(-50%)" },
    },
  ];

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

      {/* Cables en las 4 direcciones */}
      {cables.map((cable) => (
        <Box
          key={cable.name}
          sx={{
            position: "absolute",
            ...cable.style,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: calculateSize(cable.value),
              height: calculateSize(cable.value),
              borderRadius: "50%",
              bgcolor: getCableColor(cable.value, cable.cableName),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: `0 0 20px ${getCableColor(cable.value, cable.cableName)}`,
              transition: "all 0.3s ease",
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="white">
              {cable.value}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ mt: 1, display: "block" }}
          >
            {cable.name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
