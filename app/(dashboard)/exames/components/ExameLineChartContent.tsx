'use client';

import * as React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { useTheme } from 'next-themes';

interface ExameLineChartContentProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  title: string;
}

const ExameLineChartContent = ({ data, title }: ExameLineChartContentProps) => {
  const { theme } = useTheme();

  // Colors for dark/light themes
  const textColor = theme === 'dark' ? '#f8fafc' : '#020617';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';

  const transformedData = data.labels.map((label, index) => {
    const dataPoint: { [key: string]: string | number } = { date: label };
    data.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    return dataPoint;
  });

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder or nothing on the server to avoid hydration mismatch
    return <div className="w-full h-80 rounded-lg border bg-background p-4 shadow-sm" />;
  }

  return (
    <div className="w-full h-80">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={transformedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" stroke={textColor} tick={{ fill: textColor }} />
          <YAxis stroke={textColor} tick={{ fill: textColor }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              borderColor: gridColor,
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: textColor }}
            labelStyle={{ color: textColor, fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          {data.datasets.map(dataset => (
            <Line
              key={dataset.label}
              type="monotone"
              dataKey={dataset.label}
              stroke={dataset.borderColor}
              fill={dataset.backgroundColor} // As provided by user
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExameLineChartContent;
