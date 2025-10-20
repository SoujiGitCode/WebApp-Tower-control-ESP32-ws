import { Box, Typography, Grid } from "@mui/material";
import { CellTower as TowerIcon } from "@mui/icons-material";
import { Device, Sensor } from "../../api/index";

interface GaugeChartProps {
  device: Device;
  darkMode: boolean;
}

export const GaugeChart = ({ device, darkMode }: GaugeChartProps) => {
  // Colores e iconos para cada sensor según su índice
  const sensorColors = ["#36A2EB", "#FF6384", "#4BC0C0", "#FFCE56"];
  
  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("norte") || name.toLowerCase().includes("alfa")) return "🧭";
    if (name.toLowerCase().includes("sur") || name.toLowerCase().includes("beta")) return "🧭";
    if (name.toLowerCase().includes("este") || name.toLowerCase().includes("gamma")) return "➡️";
    if (name.toLowerCase().includes("oeste")) return "⬅️";
    return "📊";
  };

  const getRotation = (value: number, max: number = 1000) => {
    const clampedValue = Math.min(Math.max(value, 0), max);
    return (clampedValue / max) * 180 - 90;
  };

  const getGaugeColor = (sensor: Sensor) => {
    return sensor.alarm_triggered ? "#ef4444" : "#22c55e";
  };

  const getStatusLabel = (sensor: Sensor) => {
    return sensor.alarm_triggered ? "ALARMA" : "NORMAL";
  };

  return (
    <Box>
      {/* Ícono de torre centrado arriba */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
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
          }}
        >
          <TowerIcon
            sx={{ fontSize: 32, color: darkMode ? "#d1d5db" : "#6b7280" }}
          />
        </Box>
      </Box>

      {/* Grid de medidores */}
      <Grid container spacing={2}>
        {device.sensors.map((sensor, index) => {
          const baseColor = sensorColors[index] || sensorColors[0];
          
          return (
            <Grid item xs={6} key={sensor.id}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ 
                    display: "block", 
                    mb: 1, 
                    color: sensor.alarm_triggered ? "error.main" : "text.primary" 
                  }}
                >
                  {getIcon(sensor.name)} {sensor.name}
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    width: 120,
                    height: 80,
                    margin: "0 auto",
                  }}
                >
                  <svg width="120" height="80" style={{ overflow: "visible" }}>
                    <path
                      d="M 10 70 A 50 50 0 0 1 110 70"
                      fill="none"
                      stroke={darkMode ? "#444" : "#e0e0e0"}
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 70 A 50 50 0 0 1 60 20"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <path
                      d="M 60 20 A 50 50 0 0 1 90 40"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <path
                      d="M 90 40 A 50 50 0 0 1 110 70"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="8"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <line
                      x1="60"
                      y1="70"
                      x2="60"
                      y2="30"
                      stroke={getGaugeColor(sensor)}
                      strokeWidth="3"
                      strokeLinecap="round"
                      transform={`rotate(${getRotation(sensor.value)} 60 70)`}
                      style={{ transition: "transform 0.5s ease" }}
                    />
                    <circle
                      cx="60"
                      cy="70"
                      r="5"
                      fill={getGaugeColor(sensor)}
                    />
                  </svg>
                </Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: getGaugeColor(sensor),
                    mt: 1,
                  }}
                >
                  {sensor.value.toFixed(2)} {device.units}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: getGaugeColor(sensor),
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                >
                  {getStatusLabel(sensor)}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
