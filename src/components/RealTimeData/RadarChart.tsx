import { useEffect, useRef } from "react";
import { Box, Typography, Chip } from "@mui/material";
import {
  Chart,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController,
} from "chart.js";
import { Device } from "../../api/index";

Chart.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController
);

interface RadarChartProps {
  device: Device;
  darkMode: boolean;
}

export const RadarChart = ({ device, darkMode }: RadarChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const getCableColor = (force: number) => {
    if (force < 1500) return "#22c55e";
    if (force < 2000) return "#f59e0b";
    return "#ef4444";
  };

  // Crear el gráfico solo una vez
  useEffect(() => {
    if (!chartRef.current || chartInstanceRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Obtener labels dinámicamente
    const labels = device.sensors.map(sensor => sensor.name);
    
    chartInstanceRef.current = new Chart(ctx, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tensión",
            data: device.sensors.map(() => 0), // Iniciamos en ceros
            backgroundColor: "rgba(59, 130, 246, 0.25)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 3,
            pointBackgroundColor: device.sensors.map(() => "#22c55e"),
            pointBorderColor: "#fff",
            pointBorderWidth: 3,
            pointRadius: 8,
            pointHoverRadius: 10,
          },
          {
            label: "Crítico (2000N)",
            data: device.sensors.map(() => 2000),
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            borderColor: "rgba(239, 68, 68, 0.6)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
          },
          {
            label: "Alerta (1500N)",
            data: device.sensors.map(() => 1500),
            backgroundColor: "transparent",
            borderColor: "rgba(245, 158, 11, 0.5)",
            borderWidth: 2,
            borderDash: [3, 3],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750, // Animación suave
          easing: "easeInOutQuart",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
            titleColor: darkMode ? "#f9fafb" : "#111827",
            bodyColor: darkMode ? "#d1d5db" : "#374151",
            borderColor: darkMode ? "#374151" : "#e5e7eb",
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: function (context) {
                return context[0].label;
              },
              label: function (context) {
                if (context.datasetIndex === 0) {
                  return `${context.parsed.r} N`;
                }
                return null;
              },
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 2500,
            min: 0,
            ticks: {
              color: darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              stepSize: 500,
              backdropColor: "transparent",
              font: {
                size: 11,
                weight: 600,
              },
            },
            grid: {
              color: darkMode
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.1)",
              lineWidth: 1.5,
            },
            pointLabels: {
              color: darkMode ? "#ffffff" : "#000000",
              font: {
                size: 14,
                weight: "bold",
              },
              padding: 15,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [darkMode, device.sensors.length]); // Incluir sensors.length para re-crear si cambia

  // Actualizar solo los datos cuando cambien los valores del device
  useEffect(() => {
    if (!chartInstanceRef.current) return;

    const chart = chartInstanceRef.current;

    // Actualizar los datos
    chart.data.datasets[0].data = device.sensors.map(sensor => sensor.value);

    // Actualizar los colores de los puntos (con type assertion para ChartJS)
    const dataset = chart.data.datasets[0] as any;
    dataset.pointBackgroundColor = device.sensors.map(sensor => getCableColor(sensor.value));

    // Actualizar el gráfico con animación
    chart.update();
  }, [device.sensors]);

  return (
    <Box>
      {/* Valores de cada sensor arriba del gráfico */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: device.device_config === "3_sensores" ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          gap: 1.5,
          mb: 2,
        }}
      >
        {device.sensors.map((sensor) => (
          <Box
            key={sensor.id}
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: darkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
              border: `2px solid ${sensor.alarm_triggered ? "#ef4444" : getCableColor(sensor.value)}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "all 0.3s ease",
              animation: sensor.alarm_triggered ? 'pulse 1.5s infinite' : 'none',
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.7 },
              },
            }}
          >
            <Typography variant="body2" fontWeight="600">
              {sensor.name}
            </Typography>
            <Typography
              variant="h6"
              fontWeight="700"
              sx={{ color: sensor.alarm_triggered ? "#ef4444" : getCableColor(sensor.value) }}
            >
              {sensor.value} {device.units}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Gráfico Radar */}
      <Box sx={{ height: 280, position: "relative" }}>
        <canvas ref={chartRef} />
      </Box>

      {/* Leyenda simplificada */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            mb: 0.5,
          }}
        >
          Umbrales
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label="Normal: < 1500N"
            size="small"
            sx={{
              bgcolor: "#22c55e",
              color: "white",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
          <Chip
            label="Alerta: 1500-2000N"
            size="small"
            sx={{
              bgcolor: "#f59e0b",
              color: "white",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
          <Chip
            label="Crítico: > 2000N"
            size="small"
            sx={{
              bgcolor: "#ef4444",
              color: "white",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
