import React, { useEffect, useRef } from 'react';
import { Chart, CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);

const ChartDisplay = ({ chartMax, theme, dataFormat }) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

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
                            max: chartMax,
                        },
                    },
                },
            });
        }
        return () => {
            chartInstanceRef.current?.destroy();
        };
    }, [theme, chartMax, dataFormat]);

    return <canvas ref={chartRef} style={{ height: '100%', width: '100%' }} />;
};

export default ChartDisplay;
