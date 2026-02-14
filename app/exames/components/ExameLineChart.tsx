'use client';
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
    
    // Detect theme (this is a simplified example, you might have a more robust theme provider)
    const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDarkMode ? '#FFFFFF' : '#000000';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: textColor, // Adjust legend text color for theme
                }
            },
            title: {
                display: true,
                text: title,
                color: textColor, // Adjust title text color for theme
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    color: textColor, // Adjust Y-axis labels color
                },
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Adjust grid line color
                }
            },
            x: {
                ticks: {
                    color: textColor, // Adjust X-axis labels color
                },
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Adjust grid line color
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    return (
        <div className="h-[450px] w-full rounded-lg border bg-background p-4 shadow-sm">
            <Line options={options} data={data} />
        </div>
    );
};

export default ExameLineChart;
