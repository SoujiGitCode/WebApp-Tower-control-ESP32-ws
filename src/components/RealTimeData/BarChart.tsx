import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
} from "chart.js";
import { Device } from "../../api/index";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  device: Device;
  darkMode: boolean;
}

export const BarChart = ({ device, darkMode }: BarChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const getCableColor = (force: number) => {
    if (force < 1500) return "rgba(34, 197, 94, 0.8)"; // Verde
    if (force < 2000) return "rgba(245, 158, 11, 0.8)"; // Naranja
    return "rgba(239, 68, 68, 0.8)"; // Rojo
  };

  const getCableBorderColor = (force: number) => {
    if (force < 1500) return "rgba(34, 197, 94, 1)";
    if (force < 2000) return "rgba(245, 158, 11, 1)";
    return "rgba(239, 68, 68, 1)";
  };

  // Crear el gráfico solo una vez
  useEffect(() => {
    if (!chartRef.current || chartInstanceRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Norte", "Sur", "Este", "Oeste"],
        datasets: [
          {
            label: "Tensión (N)",
            data: [0, 0, 0, 0], // Iniciamos en ceros
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(239, 68, 68, 0.8)",
              "rgba(34, 197, 94, 0.8)",
              "rgba(245, 158, 11, 0.8)",
            ],
            borderColor: ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: "easeInOutQuart",
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Distribución de Tensión (Barras)",
            color: darkMode ? "#ffffff" : "#000000",
            font: { size: 14 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
            grid: {
              color: darkMode
                ? "rgba(75, 85, 99, 0.3)"
                : "rgba(209, 213, 219, 0.3)",
            },
            title: {
              display: true,
              text: "Tensión (N)",
              color: darkMode ? "#d1d5db" : "#374151",
            },
          },
          x: {
            ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
            grid: { display: false },
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
  }, [darkMode]);

  // Actualizar solo los datos cuando cambien
  useEffect(() => {
    if (!chartInstanceRef.current) return;

    const chart = chartInstanceRef.current;

    // Actualizar los datos
    chart.data.datasets[0].data = [
      device.Norte,
      device.Sur,
      device.Este,
      device.Oeste,
    ];

    // Actualizar colores según los valores
    chart.data.datasets[0].backgroundColor = [
      getCableColor(device.Norte),
      getCableColor(device.Sur),
      getCableColor(device.Este),
      getCableColor(device.Oeste),
    ];

    chart.data.datasets[0].borderColor = [
      getCableBorderColor(device.Norte),
      getCableBorderColor(device.Sur),
      getCableBorderColor(device.Este),
      getCableBorderColor(device.Oeste),
    ];

    // Actualizar con animación suave
    chart.update();
  }, [device.Norte, device.Sur, device.Este, device.Oeste]);

  return (
    <Box sx={{ height: { xs: 250, sm: 300 }, position: "relative" }}>
      <canvas ref={chartRef} />
    </Box>
  );
};
