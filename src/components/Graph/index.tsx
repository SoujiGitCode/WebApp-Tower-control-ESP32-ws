import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';
import { Box, Button, Typography } from '@mui/material';
import { toast } from 'react-toastify';

// Registrar los componentes que utilizarás
Chart.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);

const labelMapping: { [key: string]: string } = {
    a1: 'celda-1',
    a2: 'celda-2',
    a3: 'celda-3',
    a4: 'celda-4',
};

const Graph = ({ onBack, webSocketAdress = 'ws://localhost:8080', devMode = false }) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<Chart | null>(null);
    const theme = useTheme();  // Obtener el tema actual
    const [outOfBoundsValues, setOutOfBoundsValues] = useState<{ label: string; value: number }[]>([]);

    useEffect(() => {
        const ctx = chartRef.current?.getContext('2d');
        if (ctx) {
            const initialConfig = {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Newtons',
                            data: [],
                            backgroundColor: [],
                            borderColor: theme.palette.primary.main,
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: undefined,
                            grid: {
                                color: theme.palette.divider,
                            },
                            ticks: {
                                color: theme.palette.text.primary,
                            },
                        },
                        x: {
                            grid: {
                                color: theme.palette.divider,
                            },
                            ticks: {
                                color: theme.palette.text.primary,
                            },
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: theme.palette.text.primary,       // Para versiones más recientes
                                usePointStyle: true,  // Si necesitas un estilo de punto en la leyenda
                            },
                        },
                    },
                },
            };

            chartInstanceRef.current = new Chart(ctx, initialConfig);
        }

        return () => {
            chartInstanceRef.current?.destroy();
        };
    }, [theme]);

    useEffect(() => {
        const ws = new WebSocket(webSocketAdress);

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);

                if (chartInstanceRef.current) {
                    const chart = chartInstanceRef.current;

                    // Mapeo de los valores de la sección A con las etiquetas personalizadas
                    const sectionA = Object.entries(newData.sections.a).map(([key, value]) => ({
                        label: labelMapping[key],
                        value: Number(value),
                    }));

                    // Calcular el valor máximo de A
                    const maxAValue = Math.max(...sectionA.map((entry) => entry.value));

                    // Establecer el valor máximo del eje Y como el doble del máximo valor en A
                    const yMax = maxAValue * 2;
                    chart.options.scales.y.max = yMax;

                    // Determinar los colores y valores fuera de rango
                    const newOutOfBoundsValues: { label: string; value: number }[] = [];
                    const backgroundColors = sectionA.map((entry) => {
                        if (entry.value > 0.7 * yMax || entry.value < 0.3 * yMax) {
                            newOutOfBoundsValues.push(entry);
                            return 'rgba(255, 99, 132, 0.8)'; // Rojo
                        }
                        return theme.palette.primary.light; // Usar color del tema
                    });

                    // Actualizar las etiquetas y los datos del gráfico
                    chart.data.labels = sectionA.map((entry) => entry.label);
                    chart.data.datasets[0].data = sectionA.map((entry) => entry.value);
                    chart.data.datasets[0].backgroundColor = backgroundColors;
                    chart.update();

                    // Almacenar los valores fuera de rango y mostrar notificación
                    setOutOfBoundsValues(newOutOfBoundsValues);
                    if (newOutOfBoundsValues.length > 0) {
                        const messages = newOutOfBoundsValues.map(entry => `${entry.label}: ${entry.value}`).join(', ');
                        toast.error(`Valores fuera de rango: ${messages}`, {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        console.log(messages)
                    }
                }
            } catch (error) {
                console.error('Error al procesar los datos del WebSocket:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            ws.close();
        };
    }, [theme, webSocketAdress]);

    return (
        <Box
            sx={{
                height: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 2,
            }}
        >
            <Box
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    maxHeight: 'calc(85vh)',  // Asegura que el gráfico no ocupe más de 100vh menos el espacio para el botón
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h6"
                    align="center"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        color: theme.palette.text.primary,
                        marginBottom: 2,
                        marginTop: '-2rem !important'
                    }}
                >
                    {devMode && webSocketAdress}
                </Typography>
                <canvas ref={chartRef} style={{ height: '100%', width: '100%' }} />
            </Box>
            <Button variant="contained" color="primary" sx={{ marginTop: 2 }} onClick={onBack}>
                Volver
            </Button>
        </Box>

    );
};

export default Graph;
