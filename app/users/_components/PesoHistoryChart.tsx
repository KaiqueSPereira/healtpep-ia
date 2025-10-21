'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PesoData {
  data: string | Date;
  peso: number;
}

interface PesoHistoryChartProps {
  data: PesoData[];
}

const PesoHistoryChart = ({ data }: PesoHistoryChartProps) => {

  const formattedData = data.map(item => ({
    ...item,
    data: new Date(item.data),
  })).sort((a, b) => a.data.getTime() - b.data.getTime());

  if (formattedData.length === 0) {
    return <p className="text-center text-gray-500">Nenhum registro de peso para exibir.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="data" 
          tickFormatter={(tick) => format(tick, 'dd/MM')}
          interval={formattedData.length > 10 ? Math.floor(formattedData.length / 10) : 0}
        />
        <YAxis 
            domain={['dataMin - 2', 'dataMax + 2']} 
            width={40} 
        />
        <Tooltip 
          content={({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string | number }) => {
            if (active && payload && payload.length) {
                // The `label` can be a string or a number (timestamp), both are valid for `new Date()`.
                const formattedDate = label ? format(new Date(label), "P", { locale: ptBR }) : '';
                return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                        <p className="label">{`${formattedDate}`}</p>
                        <p className="intro">{`Peso: ${payload[0].value} kg`}</p>
                    </div>
                );
            }
            return null;
          }}
        />
        <Legend />
        <Line 
            type="monotone" 
            dataKey="peso" 
            stroke="#8884d8" 
            strokeWidth={2} 
            activeDot={{ r: 8 }} 
            name="Peso (kg)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PesoHistoryChart;
