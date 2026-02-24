'use client';

import * as React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TooltipItem
} from 'chart.js';
import { useTheme } from 'next-themes';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export interface ExameLineChartProps {
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: (number | null)[];
            borderColor: string;
            backgroundColor: string;
            tension?: number;
            spanGaps?: boolean;
            borderWidth?: number;
            pointRadius?: number;
            pointHoverRadius?: number;
            pointBackgroundColor?: string;
        }[];
    };
    title: string;
}

const ExameLineChart: React.FC<ExameLineChartProps> = ({ data, title }) => {
    const { theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const textColor = theme === 'dark' ? '#e2e8f0' : '#334155';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipBackgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
    const tooltipTitleColor = theme === 'dark' ? '#f8fafc' : '#020617';
    const tooltipBodyColor = theme === 'dark' ? '#cbd5e1' : '#475569';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Oculta a legenda principal
            },
            title: {
                display: true,
                text: title,
                color: textColor,
                font: {
                    size: 18,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 30
                }
            },
            tooltip: {
                enabled: true,
                mode: 'index' as const,
                intersect: false,
                backgroundColor: tooltipBackgroundColor,
                titleColor: tooltipTitleColor,
                bodyColor: tooltipBodyColor,
                borderColor: gridColor,
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                titleFont: {
                    size: 14,
                    weight: 'bold',
                },
                bodyFont: {
                    size: 12
                },
                callbacks: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label: function(context: TooltipItem<any>) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y;
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    color: textColor,
                },
                grid: {
                    color: gridColor,
                    drawBorder: false,
                }
            },
            x: {
                ticks: {
                    color: textColor,
                    maxRotation: 0,
                    minRotation: 0
                },
                grid: {
                    display: false, // Remove as grades do eixo X
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    if (!mounted) {
        return <div className="h-[500px] w-full rounded-lg border bg-background p-4 shadow-sm animate-pulse" />;
    }

    return (
        <div className="h-[500px] w-full rounded-lg border bg-card p-4 shadow-sm">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Line options={options as any} data={data} />
        </div>
    );
};

export default ExameLineChart;
