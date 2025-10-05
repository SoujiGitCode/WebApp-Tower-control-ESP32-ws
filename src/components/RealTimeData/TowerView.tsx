import { Box, Typography } from "@mui/material";
import { CellTower as TowerIcon } from "@mui/icons-material";
import { Device } from "../../api/index";

interface TowerViewProps {
  device: Device;
  darkMode: boolean;
}

export const TowerView = ({ device, darkMode }: TowerViewProps) => {
  const getCableColor = (force: number) => {
    if (force < 1500) return "#22c55e";
    if (force < 2000) return "#f59e0b";
    return "#ef4444";
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
      style: { top: 20, left: "50%", transform: "translateX(-50%)" },
    },
    {
      name: "SUR",
      value: device.Sur,
      style: { bottom: 20, left: "50%", transform: "translateX(-50%)" },
    },
    {
      name: "ESTE",
      value: device.Este,
      style: { right: 20, top: "50%", transform: "translateY(-50%)" },
    },
    {
      name: "OESTE",
      value: device.Oeste,
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
              bgcolor: getCableColor(cable.value),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: `0 0 20px ${getCableColor(cable.value)}`,
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
