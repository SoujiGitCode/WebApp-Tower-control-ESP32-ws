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

  const cables = [
    { name: "Norte", value: device.Norte, position: "top" },
    { name: "Este", value: device.Este, position: "right" },
    { name: "Sur", value: device.Sur, position: "bottom" },
    { name: "Oeste", value: device.Oeste, position: "left" },
  ];

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

        {/* Cable Norte */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 90,
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${
                getHeatColor(device.Norte).bg
              } 0%, ${getHeatColor(device.Norte).bg}dd 100%)`,
              borderRadius: 3,
              p: 1.5,
              textAlign: "center",
              boxShadow: `0 4px 20px ${getHeatColor(device.Norte).bg}88`,
              border: `2px solid ${getHeatColor(device.Norte).bg}`,
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                transform: "scale(1.08) translateY(-4px)",
                boxShadow: `0 8px 30px ${getHeatColor(device.Norte).bg}aa`,
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
              }}
            >
              NORTE
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "white", fontWeight: 800, my: 0.5 }}
            >
              {device.Norte}
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
              Newtons
            </Typography>
          </Box>
        </Box>

        {/* Cable Sur */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 90,
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${
                getHeatColor(device.Sur).bg
              } 0%, ${getHeatColor(device.Sur).bg}dd 100%)`,
              borderRadius: 3,
              p: 1.5,
              textAlign: "center",
              boxShadow: `0 4px 20px ${getHeatColor(device.Sur).bg}88`,
              border: `2px solid ${getHeatColor(device.Sur).bg}`,
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                transform: "scale(1.08) translateY(4px)",
                boxShadow: `0 8px 30px ${getHeatColor(device.Sur).bg}aa`,
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
              }}
            >
              SUR
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "white", fontWeight: 800, my: 0.5 }}
            >
              {device.Sur}
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
              Newtons
            </Typography>
          </Box>
        </Box>

        {/* Cable Este */}
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 90,
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${
                getHeatColor(device.Este).bg
              } 0%, ${getHeatColor(device.Este).bg}dd 100%)`,
              borderRadius: 3,
              p: 1.5,
              textAlign: "center",
              boxShadow: `0 4px 20px ${getHeatColor(device.Este).bg}88`,
              border: `2px solid ${getHeatColor(device.Este).bg}`,
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                transform: "scale(1.08) translateX(4px)",
                boxShadow: `0 8px 30px ${getHeatColor(device.Este).bg}aa`,
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
              }}
            >
              ESTE
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "white", fontWeight: 800, my: 0.5 }}
            >
              {device.Este}
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
              Newtons
            </Typography>
          </Box>
        </Box>

        {/* Cable Oeste */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 90,
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${
                getHeatColor(device.Oeste).bg
              } 0%, ${getHeatColor(device.Oeste).bg}dd 100%)`,
              borderRadius: 3,
              p: 1.5,
              textAlign: "center",
              boxShadow: `0 4px 20px ${getHeatColor(device.Oeste).bg}88`,
              border: `2px solid ${getHeatColor(device.Oeste).bg}`,
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                transform: "scale(1.08) translateX(-4px)",
                boxShadow: `0 8px 30px ${getHeatColor(device.Oeste).bg}aa`,
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
              }}
            >
              OESTE
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: "white", fontWeight: 800, my: 0.5 }}
            >
              {device.Oeste}
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
              Newtons
            </Typography>
          </Box>
        </Box>
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
