"use client";

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

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
    date.setUTCHours(0, 0, 0, 0);
    if (isNaN(date.getTime())) return "Inválido";
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dataString;
  }
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
  const yAxisDomain = [
      minPeso > 10 ? Math.floor(minPeso - 5) : 0,
      maxPeso > 0 ? Math.ceil(maxPeso + 5) : 100
  ];

  return (
    <div className="w-full h-80 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={transformedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" name="Data" />
          <YAxis domain={yAxisDomain} name="Peso (kg)" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
