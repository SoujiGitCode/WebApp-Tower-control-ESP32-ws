import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';
import { Box, Button, Typography } from '@mui/material';
import { toast } from 'react-toastify';
// import axios from 'axios';
import { useAppContext } from '@context/AppContext';

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
    const { esp32IP } = useAppContext();

    // Variables para los valores
    const [currentValues, setCurrentValues] = useState({ a1: 0, a2: 0, a3: 0, a4: 0 });
    const [prevValues, setPrevValues] = useState({ a1: 0, a2: 0, a3: 0, a4: 0 });
    const [ledOn, setLedOn] = useState(false);

    // Mantener el estado del gráfico
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

    // Función para actualizar la gráfica con valores actuales
    const updateChart = (values: { a1: number; a2: number; a3: number; a4: number }) => {
        if (chartInstanceRef.current) {
            const chart = chartInstanceRef.current;
            const sectionA = Object.entries(values).map(([key, value]) => ({
                label: labelMapping[key],
                value: value || 0,
            }));

            const maxAValue = Math.max(...sectionA.map((entry) => entry.value));
            const yMax = maxAValue * 2;

            chart.data.labels = sectionA.map((entry) => entry.label);
            chart.data.datasets[0].data = sectionA.map((entry) => entry.value);
            chart.options.scales.y.max = yMax;
            chart.update();
        }
    };

    // Lógica para verificar si los valores están fuera de los límites
    const checkForOutOfBounds = (prev: { a1: number; a2: number; a3: number; a4: number }, curr: { a1: number; a2: number; a3: number; a4: number }) => {
        // Calcular el promedio entre el valor anterior y el valor actual
        const averageValues = {
            a1: (prev.a1 + curr.a1) / 2,
            a2: (prev.a2 + curr.a2) / 2,
            a3: (prev.a3 + curr.a3) / 2,
            a4: (prev.a4 + curr.a4) / 2,
        };

        // Calcular el máximo valor de Y en base a los valores promedios
        const yMax = Math.max(...Object.values(averageValues)) * 2;

        // Función que verifica si un valor está fuera de los límites
        const isOutOfBounds = (value: number) => value < yMax * 0.3 || value > yMax * 0.7;

        // Crear un array para almacenar los mensajes de las celdas fuera de rango
        const outOfBoundsMessages: string[] = [];

        // Verificar cada celda y agregar un mensaje si está fuera de los límites
        if (isOutOfBounds(averageValues.a1)) {
            outOfBoundsMessages.push(`Celda 1 (a1) fuera de rango: ${averageValues.a1.toFixed(2)}`);
        }
        if (isOutOfBounds(averageValues.a2)) {
            outOfBoundsMessages.push(`Celda 2 (a2) fuera de rango: ${averageValues.a2.toFixed(2)}`);
        }
        if (isOutOfBounds(averageValues.a3)) {
            outOfBoundsMessages.push(`Celda 3 (a3) fuera de rango: ${averageValues.a3.toFixed(2)}`);
        }
        if (isOutOfBounds(averageValues.a4)) {
            outOfBoundsMessages.push(`Celda 4 (a4) fuera de rango: ${averageValues.a4.toFixed(2)}`);
        }

        // Si hay algún valor fuera de rango, encender el LED y mostrar las alertas
        if (outOfBoundsMessages.length > 0) {
            setLedOn(true); // Encender el LED si algún valor está fuera de los límites
            toast.error(`Valores fuera de rango:\n${outOfBoundsMessages.join('\n')}`);
            console.log("LED encendido, valores fuera de rango.", outOfBoundsMessages);
        } else {
            setLedOn(false); // Apagar el LED si todos los valores están dentro de los límites
            console.log("LED apagado, valores dentro de rango.");
        }
    };


    // WebSocket para recibir datos y actualizar currentValues
    useEffect(() => {
        const ws = new WebSocket(webSocketAdress);

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);

                const newValues = {
                    a1: Number(newData.sections.a.a1),
                    a2: Number(newData.sections.a.a2),
                    a3: Number(newData.sections.a.a3),
                    a4: Number(newData.sections.a.a4),
                };

                // Actualizar solo la gráfica (gráfico puede actualizarse cada segundo)
                updateChart(newValues);

                // Actualizar currentValues, pero no lo usaremos inmediatamente para verificar límites
                setCurrentValues(newValues);

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
    }, [webSocketAdress]);

    // Ejecutar verificación cada minuto
    const lastCheckTime = useRef(Date.now());

    useEffect(() => {
        const now = Date.now();
        if (now - lastCheckTime.current >= 60000) { // Si ha pasado un minuto
            console.log('Checking values after 60 seconds...');

            if (Object.values(prevValues).every(value => value === 0)) {
                setPrevValues({ ...currentValues });
                console.log('PrevValues initialized with current values:', currentValues);
            } else {
                checkForOutOfBounds(currentValues, prevValues);
                setPrevValues({ ...currentValues });
                console.log('Previous values updated:', currentValues);
            }

            lastCheckTime.current = now; // Actualizar el tiempo de la última verificación
        }
    }, [currentValues]);

    useEffect(() => {
        const updateLedStatus = async () => {
            try {
                // Crea el FormData con el valor actual de ledOn
                const formData = new FormData();
                formData.append('led', ledOn.toString());  // Aquí ajustamos el valor según `ledOn`

                // Realiza la solicitud POST al endpoint
                const response = await fetch(`http://${esp32IP}/api/led`, {
                    method: 'POST',
                    body: formData,
                });

                // Puedes hacer algo con la respuesta si es necesario
                if (response.status === 200) {
                    console.log('LED status updated successfully:', response?.message);
                }
            } catch (error) {
                console.error('Error updating LED status:', error);
            }
        };

        if (ledOn !== undefined) {  // Asegúrate de que `ledOn` tiene un valor definido
            updateLedStatus();
        }

    }, [ledOn]); // El efecto se ejecutará cada vez que `ledOn` cambie

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
