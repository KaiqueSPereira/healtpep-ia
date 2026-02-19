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

    const textColor = theme === 'dark' ? '#f8fafc' : '#020617';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipBackgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
    const tooltipTitleColor = theme === 'dark' ? '#f8fafc' : '#020617';
    const tooltipBodyColor = theme === 'dark' ? '#cbd5e1' : '#475569';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: textColor,
                }
            },
            title: {
                display: true,
                text: title,
                color: textColor,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: tooltipBackgroundColor,
                titleColor: tooltipTitleColor,
                bodyColor: tooltipBodyColor,
                borderColor: gridColor,
                borderWidth: 1,
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
                }
            },
            x: {
                ticks: {
                    color: textColor,
                },
                grid: {
                    color: gridColor,
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
        return <div className="h-[450px] w-full rounded-lg border bg-background p-4 shadow-sm" />;
    }

    return (
        <div className="h-[450px] w-full rounded-lg border bg-background p-4 shadow-sm">
            <Line options={options} data={data} />
        </div>
    );
};

export default ExameLineChart;
