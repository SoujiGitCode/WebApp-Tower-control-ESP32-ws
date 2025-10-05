import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';
import { Box, Button, Typography, Modal, TextField, MenuItem } from '@mui/material';
import { toast } from 'react-toastify';
import { useAppContext } from '@context/AppContext';

Chart.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);

const labelMapping: { [key: string]: string } = {
    a1: 'celda-1',
    a2: 'celda-2',
    a3: 'celda-3',
    a4: 'celda-4',
};

const Graph = ({ onBack, webSocketAdress = 'ws://192.168.4.1:8080', devMode = false }) => {

    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<Chart | null>(null);
    const theme = useTheme();
    // Configuraciones
    const {
        interval,
        setInterval,
        valueCount,
        setValueCount,
        min,
        setMin,
        max,
        setMax,
        chartMax,
        setChartMax,
        dataFormat,
        setDataFormat,
        esp32IP
    } = useAppContext();

    const chartMaxRef = useRef<number>(0); // Almacena el máximo dinámico actual
    const [ledOn, setLedOn] = useState(false); // Estado del LED
    const [currentValues, setCurrentValues] = useState({ a1: 0, a2: 0, a3: 0, a4: 0 });
    const [isChartMaxDynamic, setIsChartMaxDynamic] = useState(true);
    const [valueHistory, setValueHistory] = useState<{ [key: string]: number[] }>({
        a1: [],
        a2: [],
        a3: [],
        a4: [],
    });


    const [modalOpen, setModalOpen] = useState(false); // Control del modal
    const [tempConfig, setTempConfig] = useState({
        interval: interval,
        valueCount: valueCount,
        min: min,
        max: max,
        chartMax: chartMax,
        dataFormat: dataFormat,
    });


    // Función para manejar los cambios temporales
    const handleTempChange = (field: string, value: any) => {
        setTempConfig((prev) => ({ ...prev, [field]: value }));
    };


    // Función para abrir/cerrar el modal
    const toggleModal = () => {
        setModalOpen(!modalOpen);
        if (!modalOpen) {
            // Sincronizar valores del contexto con tempConfig
            setTempConfig({
                interval,
                valueCount,
                min,
                max,
                chartMax,
                dataFormat,
            });
        }
    };

    // Cancelar cambios (cierra el modal sin guardar)
    const cancelChanges = () => {
        toggleModal(); // Simplemente cierra el modal
    };


    // Guardar cambios definitivos
    const saveChanges = () => {
        const { interval, valueCount, min, max, chartMax, dataFormat } = tempConfig;

        // Actualizar valores en el contexto
        setInterval(interval);
        setValueCount(valueCount);
        setMin(min);
        setMax(max);
        setChartMax(chartMax > 0 ? chartMax : 0);
        setDataFormat(dataFormat);

        // Habilitar/deshabilitar modo dinámico basado en chartMax
        if (chartMax > 0) {
            setIsChartMaxDynamic(false); // Deshabilitar modo dinámico
        } else {
            setIsChartMaxDynamic(true); // Habilitar modo dinámico
        }

        // Actualizar el gráfico inmediatamente
        if (chartInstanceRef.current) {
            const chart = chartInstanceRef.current;
            chart.options.scales.y.max = chartMax > 0 ? chartMax : chart.options.scales.y.max;
            chart.update();
        }

        // Cerrar el modal
        toggleModal();
    };

    // Configurar gráfico
    useEffect(() => {
        const ctx = chartRef.current?.getContext('2d');
        if (ctx) {
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: `${dataFormat}`,
                            data: [],
                            backgroundColor: theme.palette.primary.main,
                            borderColor: theme.palette.secondary.main,
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: chartMax, // Usar el máximo dinámico configurado
                            grid: { color: theme.palette.divider },
                            ticks: { color: theme.palette.text.primary },
                        },
                        x: {
                            grid: { color: theme.palette.divider },
                            ticks: { color: theme.palette.text.primary },
                        },
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
            });
        }
        return () => {
            chartInstanceRef.current?.destroy();
        };
    }, [theme, chartMax, dataFormat]); // Escuchar cambios en chartMax


    const calculateDynamicMax = (values: number[]) => {
        const maxValue = Math.max(...values, 0); // Asegurar que no da NaN si los valores están vacíos
        return Math.ceil(maxValue * 1.3);       // Aumentar en 30% y redondear hacia arriba
    };



    // Actualizar valores en el gráfico
    const updateChart = (values: { a1: number; a2: number; a3: number; a4: number }) => {
        if (chartInstanceRef.current) {
            const chart = chartInstanceRef.current;
            const sectionA = Object.entries(values).map(([key, value]) => ({
                label: labelMapping[key],
                value: value || 0,
            }));

            chart.data.labels = sectionA.map((entry) => entry.label);
            chart.data.datasets[0].data = sectionA.map((entry) => entry.value);
            chart.update();
        }
    };

    // Función para actualizar el estado del LED en el backend
    const updateLedStatus = async (ledStatus) => {
        try {
            const formData = new FormData();
            formData.append('led', ledStatus.toString());

            const response = await fetch(`http://${esp32IP}/api/led`, {
                method: 'POST',
                body: formData,
            });

            if (response.status === 200) {
                console.log(`LED status updated successfully to: ${ledStatus}`);
            } else {
                console.error('Error al actualizar el estado del LED:', response.statusText);
            }
        } catch (error) {
            console.error('Error en la solicitud para actualizar el estado del LED:', error);
        }
    };

    // Función para verificar valores fuera de rango
    const checkForOutOfBounds = (history) => {
        const averageValues = Object.fromEntries(
            Object.entries(history).map(([key, values]) => [key, values.reduce((sum, val) => sum + val, 0) / values.length])
        );

        console.log('Promedios calculados:', averageValues);

        const outOfBoundsMessages = [];
        let ledShouldBeOn = false;

        Object.entries(averageValues).forEach(([key, average]) => {
            if (average < min) {
                outOfBoundsMessages.push(`Celda ${key} por debajo del mínimo permitido: ${average.toFixed(2)} < ${min}`);
                ledShouldBeOn = true;
            } else if (average > max) {
                outOfBoundsMessages.push(`Celda ${key} por encima del máximo permitido: ${average.toFixed(2)} > ${max}`);
                ledShouldBeOn = true;
            }
        });

        setLedOn(ledShouldBeOn); // Actualizar estado del LED

        if (ledShouldBeOn) {
            updateLedStatus(true); // Llamar al backend para encender el LED
            toast.error(`Valores fuera de rango:\n${outOfBoundsMessages.join('\n')}`);
            console.log("LED encendido, valores fuera de rango detectados:", outOfBoundsMessages);
        } else {
            updateLedStatus(false); // Llamar al backend para apagar el LED
            toast.success(`Valores estables en todas las celdas`);
            console.log("LED apagado, valores dentro del rango permitido.");
        }

        setValueHistory({
            a1: [],
            a2: [],
            a3: [],
            a4: [],
        });
        console.log('Historial reiniciado después de verificar valores.');
    };

    // WebSocket para recibir datos
    useEffect(() => {
        const ws = new WebSocket(webSocketAdress);

        let lastUpdate = Date.now();

        ws.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);
                const newValues = {
                    a1: Number(newData.sections.a.a1),
                    a2: Number(newData.sections.a.a2),
                    a3: Number(newData.sections.a.a3),
                    a4: Number(newData.sections.a.a4),
                };

                // Actualizar el gráfico inmediatamente
                updateChart(newValues);

                // Solo recalcular dinámicamente si el modo dinámico está activo
                if (isChartMaxDynamic) {
                    const allValues = Object.values(newValues);
                    const newDynamicMax = calculateDynamicMax(allValues);

                    if (chartInstanceRef.current) {
                        const chart = chartInstanceRef.current;

                        // Solo actualizar el máximo si es diferente
                        if (chartMaxRef.current !== newDynamicMax) {
                            chartMaxRef.current = newDynamicMax; // Actualizar referencia
                            chart.options.scales.y.max = newDynamicMax; // Actualizar eje Y dinámicamente
                            chart.update(); // Aplicar cambios al gráfico
                        }
                    }
                }
                const now = Date.now();

                // Guardar en el array solo cada `interval` segundos
                if (now - lastUpdate >= interval * 1000) {
                    lastUpdate = now;
                    setValueHistory((prevHistory) => {
                        const updatedHistory = { ...prevHistory };

                        Object.entries(newValues).forEach(([key, value]) => {
                            updatedHistory[key] = [...(updatedHistory[key] || []), value].slice(-valueCount);

                            console.log(`Nuevo valor agregado a ${key}: ${value}`);
                            console.log(`Array actualizado (${key}):`, updatedHistory[key]);
                        });

                        if (Object.values(updatedHistory).every((arr) => arr.length === valueCount)) {
                            console.log(`Máxima cantidad de valores alcanzada (${valueCount}). Evaluando...`);
                            checkForOutOfBounds(updatedHistory);
                        }
                        return updatedHistory;
                    });
                }
            } catch (error) {
                console.error('Error al procesar datos del WebSocket:', error);
            }
        };

        return () => {
            ws.close();
        };
    }, [webSocketAdress, interval, valueCount, min, max, isChartMaxDynamic]);


    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Permitir borrar con Backspace
        if (e.key === 'Backspace') {
            return; // Permitir la acción predeterminada
        }

        // Permitir solo números
        if (!e.key.match(/[0-9]/) && e.key.length === 1) {
            e.preventDefault(); // Bloquear caracteres no numéricos
        }
    };

    useEffect(() => {
        console.log('data format: ', dataFormat)
    }, [dataFormat])

    useEffect(() => {
        // Limpiar los arrays al renderizar el componente
        setValueHistory({
            a1: [],
            a2: [],
            a3: [],
            a4: [],
        });
        console.log('Arrays limpiados al renderizar el componente');
    }, []);

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
                        marginTop: '-2rem !important',
                    }}
                >
                    {/* {devMode && webSocketAdress} */}
                    Sistema de Alarma de Tensión de Piolas
                </Typography>
                <canvas ref={chartRef} style={{ height: '100%', width: '100%' }} />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    mt: 2,
                }}
            >
                <Button variant="contained" onClick={onBack}>
                    Volver
                </Button>
                <Button variant="outlined" onClick={toggleModal}>
                    Opciones
                </Button>
            </Box>
            <Modal open={modalOpen} onClose={cancelChanges}>
                <Box
                    sx={{
                        textAlign: "center",
                        backgroundColor: "background.paper",
                        padding: 3,
                        borderRadius: 2,
                        boxShadow: 24,
                        maxWidth: { xs: 300, sm: 400 },
                        maxHeight: "90vh",
                        margin: "auto",
                        mt: { xs: 2, sm: 5 },
                        overflowY: "auto",
                    }}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                            fontSize: { xs: "1rem", sm: "1.5rem" },
                        }}
                    >
                        Configuraciones
                    </Typography>

                    {/* Configuraciones de Intervalo y Cantidad de Valores */}
                    <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{
                            fontWeight: "bold",
                            mt: 2,
                            fontSize: { xs: "0.8rem", sm: "1rem" },
                        }}
                    >
                        Datos de Entrada
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 2,
                            fontSize: { xs: "0.85rem", sm: "0.8rem" },
                        }}
                    >
                        Ajusta el intervalo de actualización y la cantidad de valores que se almacenan.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Intervalo (segundos)"
                        type="text"
                        value={tempConfig.interval}
                        onChange={(e) => handleTempChange("interval", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Cantidad de valores"
                        type="text"
                        value={tempConfig.valueCount}
                        onChange={(e) => handleTempChange("valueCount", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        sx={{ mb: 2 }}
                    />

                    {/* Configuraciones de Límites */}
                    <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{
                            fontWeight: "bold",
                            mt: 2,
                            fontSize: { xs: "0.8rem", sm: "1rem" },
                        }}
                    >
                        Límites Permitidos
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 2,
                            fontSize: { xs: "0.85rem", sm: "0.8rem" },
                        }}
                    >
                        Define los valores mínimos y máximos que se permiten en el gráfico.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Mínimo permitido"
                        type="text"
                        value={tempConfig.min}
                        onChange={(e) => handleTempChange("min", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Máximo permitido"
                        type="text"
                        value={tempConfig.max}
                        onChange={(e) => handleTempChange("max", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        sx={{ mb: 2 }}
                    />

                    {/* Configuración del Máximo del Gráfico */}
                    <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{
                            fontWeight: "bold",
                            mt: 2,
                            fontSize: { xs: "0.8rem", sm: "1rem" },
                        }}
                    >
                        Configuración del Gráfico
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 2,
                            fontSize: { xs: "0.85rem", sm: "0.8rem" },
                        }}
                    >
                        Ajusta el valor máximo del eje Y para representar los datos de forma clara.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Máximo del gráfico"
                        type="text"
                        value={tempConfig.chartMax}
                        onChange={(e) => handleTempChange("chartMax", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        sx={{ mb: 2 }}
                    />

                    {/* Botones */}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={cancelChanges}
                            sx={{ textAlign: "center", fontSize: { xs: "0.85rem", sm: "0.8rem" } }}
                        >
                            Cerrar
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={saveChanges}
                            sx={{ textAlign: "center", fontSize: { xs: "0.85rem", sm: "0.8rem" }, ml: 2 }}
                        >
                            Guardar
                        </Button>
                    </Box>
                </Box>
            </Modal>

        </Box>
    );
};

export default Graph;