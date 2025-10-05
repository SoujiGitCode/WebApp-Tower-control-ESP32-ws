import { Box, Typography, Grid } from "@mui/material";
import { CellTower as TowerIcon } from "@mui/icons-material";
import { Device } from "../../api/index";

interface GaugeChartProps {
  device: Device;
  darkMode: boolean;
}

export const GaugeChart = ({ device, darkMode }: GaugeChartProps) => {
  const cables = [
    { name: "Norte", value: device.Norte, icon: "🧭", color: "#36A2EB" },
    { name: "Sur", value: device.Sur, icon: "🧭", color: "#FF6384" },
    { name: "Este", value: device.Este, icon: "➡️", color: "#4BC0C0" },
    { name: "Oeste", value: device.Oeste, icon: "⬅️", color: "#FFCE56" },
  ];

  const getRotation = (value: number, max: number = 2500) => {
    const clampedValue = Math.min(Math.max(value, 0), max);
    return (clampedValue / max) * 180 - 90;
  };

  const getGaugeColor = (value: number) => {
    if (value >= 2000) return "#ef4444";
    if (value >= 1500) return "#f59e0b";
    return "#22c55e";
  };

  const getStatusLabel = (value: number) => {
    if (value >= 2000) return "CRÍTICO";
    if (value >= 1500) return "ALERTA";
    return "NORMAL";
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
        {cables.map((cable) => (
          <Grid item xs={6} key={cable.name}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                fontWeight="bold"
                gutterBottom
                sx={{ display: "block", mb: 1, color: "text.primary" }}
              >
                {cable.icon} {cable.name}
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
                    stroke={getGaugeColor(cable.value)}
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform={`rotate(${getRotation(cable.value)} 60 70)`}
                    style={{ transition: "transform 0.5s ease" }}
                  />
                  <circle
                    cx="60"
                    cy="70"
                    r="5"
                    fill={getGaugeColor(cable.value)}
                  />
                </svg>
              </Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  color: getGaugeColor(cable.value),
                  mt: 1,
                }}
              >
                {cable.value} N
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: getGaugeColor(cable.value),
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              >
                {getStatusLabel(cable.value)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
