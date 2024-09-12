import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';
import { Box, Button, Typography } from '@mui/material';
import { toast } from 'react-toastify';

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
    const theme = useTheme();
    const [a1Values, setA1Values] = useState<number[]>([]);
    const [a2Values, setA2Values] = useState<number[]>([]);
    const [a3Values, setA3Values] = useState<number[]>([]);
    const [a4Values, setA4Values] = useState<number[]>([]);

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
                                color: theme.palette.text.primary,
                                usePointStyle: true,
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

        let intervalId: NodeJS.Timeout;

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);

                if (chartInstanceRef.current) {
                    const chart = chartInstanceRef.current;

                    const sectionA = Object.entries(newData.sections.a).map(([key, value]) => ({
                        label: labelMapping[key],
                        value: Number(value),
                    }));

                    // Calcular el valor máximo de A
                    const maxAValue = Math.max(...sectionA.map((entry) => entry.value));

                    // Establecer el valor máximo del eje Y como el doble del máximo valor en A
                    const yMax = maxAValue * 2;
                    chart.options.scales.y.max = yMax;

                    // Actualizar las etiquetas y los datos del gráfico
                    chart.data.labels = sectionA.map((entry) => entry.label);
                    chart.data.datasets[0].data = sectionA.map((entry) => entry.value);
                    chart.update();

                    // Cada 20 segundos, agregar un nuevo valor a los arrays correspondientes
                    intervalId = setInterval(() => {
                        sectionA.forEach((entry) => {
                            switch (entry.label) {
                                case 'celda-1':
                                    setA1Values(prev => {
                                        const newValues = [...prev, entry.value].slice(-6);
                                        if (newValues.length === 6) checkForOutOfBounds(newValues, 'celda-1');
                                        return newValues;
                                    });
                                    break;
                                case 'celda-2':
                                    setA2Values(prev => {
                                        const newValues = [...prev, entry.value].slice(-6);
                                        if (newValues.length === 6) checkForOutOfBounds(newValues, 'celda-2');
                                        return newValues;
                                    });
                                    break;
                                case 'celda-3':
                                    setA3Values(prev => {
                                        const newValues = [...prev, entry.value].slice(-6);
                                        if (newValues.length === 6) checkForOutOfBounds(newValues, 'celda-3');
                                        return newValues;
                                    });
                                    break;
                                case 'celda-4':
                                    setA4Values(prev => {
                                        const newValues = [...prev, entry.value].slice(-6);
                                        if (newValues.length === 6) checkForOutOfBounds(newValues, 'celda-4');
                                        return newValues;
                                    });
                                    break;
                                default:
                                    break;
                            }
                        });
                    }, 20000); // 20 segundos
                }
            } catch (error) {
                console.error('Error al procesar los datos del WebSocket:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            clearInterval(intervalId);
            ws.close();
        };
    }, [theme, webSocketAdress]);

    const checkForOutOfBounds = (values: number[], label: string) => {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const yMax = Math.max(...values) * 2;

        if (average > 0.7 * yMax || average < 0.3 * yMax) {
            toast.error(`Valor fuera de rango para ${label}: Promedio = ${average.toFixed(2)}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            console.log(`Valor fuera de rango para ${label}: Promedio = ${average}`);
        }

        // Limpiar el array después de calcular el promedio
        switch (label) {
            case 'celda-1':
                setA1Values([]);
                break;
            case 'celda-2':
                setA2Values([]);
                break;
            case 'celda-3':
                setA3Values([]);
                break;
            case 'celda-4':
                setA4Values([]);
                break;
            default:
                break;
        }
    };

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
                    maxHeight: 'calc(85vh)',
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
