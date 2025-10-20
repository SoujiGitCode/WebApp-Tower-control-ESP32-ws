import { Box, Typography } from "@mui/material";
import { CellTower as TowerIcon } from "@mui/icons-material";
import { Device } from "../../api/index";

interface HeatmapChartProps {
  device: Device;
  darkMode: boolean;
}

export const HeatmapChart = ({ device, darkMode }: HeatmapChartProps) => {
  const getHeatColor = (value: number) => {
    if (value < 500) return { bg: "#2196F3", text: "MUY BAJO" };
    if (value < 1000) return { bg: "#4CAF50", text: "BAJO" };
    if (value < 1500) return { bg: "#FFEB3B", text: "NORMAL" };
    if (value < 2000) return { bg: "#FF9800", text: "ALTO" };
    return { bg: "#F44336", text: "CRÍTICO" };
  };

  const has3Sensors = device.device_config === "3_sensores";

  // Obtener posiciones para 3 sensores (triángulo)
  const get3SensorPositions = () => {
    return [
      { angle: -90, x: 50, y: 0 },   // Top (Alfa)
      { angle: 150, x: 0, y: 78 },   // Bottom Left (Beta)
      { angle: 30, x: 100, y: 78 },  // Bottom Right (Gamma)
    ];
  };

  // Obtener posiciones para 4 sensores (cruz)
  const get4SensorPositions = () => {
    return [
      { angle: -90, x: 50, y: 0 },   // Top (Norte)
      { angle: 0, x: 100, y: 50 },   // Right (Este)
      { angle: 90, x: 50, y: 100 },  // Bottom (Sur)
      { angle: 180, x: 0, y: 50 },   // Left (Oeste)
    ];
  };

  const positions = has3Sensors ? get3SensorPositions() : get4SensorPositions();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 2,
      }}
    >
      {/* Contenedor principal del heatmap */}
      <Box
        sx={{
          position: "relative",
          width: 280,
          height: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Torre Central */}
        <Box
          sx={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: darkMode
              ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
              : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
            border: darkMode ? "3px solid #6b7280" : "3px solid #9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: darkMode
              ? "0 4px 15px rgba(0,0,0,0.4)"
              : "0 4px 15px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}
        >
          <TowerIcon
            sx={{ fontSize: 36, color: darkMode ? "#d1d5db" : "#6b7280" }}
          />
        </Box>

        {/* Renderizar sensores dinámicamente */}
        {device.sensors.map((sensor, index) => {
          const pos = positions[index];
          const heatColor = getHeatColor(sensor.value);
          
          return (
            <Box
              key={sensor.id}
              sx={{
                position: "absolute",
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                width: 90,
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${heatColor.bg} 0%, ${heatColor.bg}dd 100%)`,
                  borderRadius: 3,
                  p: 1.5,
                  textAlign: "center",
                  boxShadow: sensor.alarm_triggered 
                    ? `0 0 20px ${heatColor.bg}, 0 4px 20px ${heatColor.bg}88`
                    : `0 4px 20px ${heatColor.bg}88`,
                  border: sensor.alarm_triggered
                    ? `3px solid ${heatColor.bg}`
                    : `2px solid ${heatColor.bg}`,
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  animation: sensor.alarm_triggered ? 'pulse 1.5s infinite' : 'none',
                  "@keyframes pulse": {
                    "0%, 100%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.05)" },
                  },
                  "&:hover": {
                    transform: "scale(1.08)",
                    boxShadow: `0 8px 30px ${heatColor.bg}aa`,
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    display: "block",
                    textTransform: "uppercase",
                  }}
                >
                  {sensor.name}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "white", fontWeight: 800, my: 0.5 }}
                >
                  {sensor.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "white",
                    fontSize: "0.6rem",
                    opacity: 0.95,
                    display: "block",
                  }}
                >
                  {device.units}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Escala de intensidad mejorada */}
      <Box
        sx={{
          mt: 3,
          width: "100%",
          maxWidth: 280,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mb: 1,
            fontWeight: 600,
            color: "text.secondary",
            fontSize: "0.7rem",
          }}
        >
          Escala de Intensidad
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: "0.65rem", color: "text.secondary", minWidth: 30 }}
          >
            Baja
          </Typography>
          <Box
            sx={{
              flex: 1,
              height: 12,
              borderRadius: 6,
              background:
                "linear-gradient(to right, #2196F3, #4CAF50, #FFEB3B, #FF9800, #F44336)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.65rem",
              color: "text.secondary",
              minWidth: 30,
              textAlign: "right",
            }}
          >
            Alta
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
