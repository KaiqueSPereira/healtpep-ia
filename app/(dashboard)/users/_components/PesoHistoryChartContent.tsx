"use client";

import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { format } from 'date-fns';

interface PesoRegistro {
  id: string;
  userId?: string;
  peso: string;
  data: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PesoHistoryChartContentProps {
  historicoPeso: PesoRegistro[];
}

const formatarDataGrafico = (dataString: string): string => {
  try {
    const date = new Date(dataString);
    const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000)
    return format(adjustedDate, "dd/MM");
  } catch {
    return dataString;
  }
};

// Definição de tipo explícita para as props do CustomTooltip
interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-md shadow-md">
        <p className="font-bold">{`Peso: ${payload[0].value?.toFixed(1)} kg`}</p>
        <p className="text-sm text-muted-foreground">{`Data: ${label}`}</p>
      </div>
    );
  }
  return null;
};

export default function PesoHistoryChartContent({ historicoPeso }: PesoHistoryChartContentProps) {
  const sortedHistoricoPeso = [...historicoPeso].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const transformedData = sortedHistoricoPeso.map(registro => ({
    date: formatarDataGrafico(registro.data),
    peso: parseFloat(registro.peso),
  })).filter(d => !isNaN(d.peso));

  const pesos = transformedData.map(d => d.peso);
  const minPeso = pesos.length > 0 ? Math.min(...pesos) : 0;
  const maxPeso = pesos.length > 0 ? Math.max(...pesos) : 100;
  const yAxisDomain: [number, number] = [
      minPeso > 5 ? Math.floor(minPeso - 5) : 0,
      maxPeso > 0 ? Math.ceil(maxPeso + 5) : 100
  ];

  return (
    <div className="w-full h-80 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={transformedData}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            domain={yAxisDomain} 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}kg`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPeso)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
