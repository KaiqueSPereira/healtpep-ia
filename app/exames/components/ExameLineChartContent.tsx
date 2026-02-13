"use client";

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

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
  const transformedData = data.labels.map((label, index) => {
    const dataPoint: { [key: string]: string | number } = { date: label };
    data.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    return dataPoint;
  });

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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data.datasets.map(dataset => (
            <Line
              key={dataset.label}
              type="monotone"
              dataKey={dataset.label}
              stroke={dataset.borderColor}
              fill={dataset.backgroundColor}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExameLineChartContent;
