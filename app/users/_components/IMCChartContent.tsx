"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface IMCChartContentProps {
  ultimoIMCCalculado: string | null;
  faixaIMCUltimoRegistro: string | null;
}

const imcLabels = ['Abaixo do peso', 'Peso normal', 'Sobrepeso', 'Obesidade Grau 1', 'Obesidade Grau 2', 'Obesidade Grau 3 (Mórbida)'];
const imcValues = [18.5, 6.5, 5, 5, 5, 10]; // Representa a largura de cada faixa no gráfico
const imcColors = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#d35400', '#c0392b'];

const pieData = imcLabels.map((label, index) => ({
  name: label,
  value: imcValues[index],
}));

export default function IMCChartContent({ ultimoIMCCalculado, faixaIMCUltimoRegistro }: IMCChartContentProps) {
  return (
    <div className="relative w-full h-48 flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            cx="50%"
            cy="100%" // Posiciona o centro na base do container
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={2}
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={faixaIMCUltimoRegistro === entry.name ? imcColors[index] : `${imcColors[index]}80`} 
                stroke={faixaIMCUltimoRegistro === entry.name ? '#ffffff' : 'transparent'}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [null, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full text-center">
        <p className="text-2xl font-bold">{ultimoIMCCalculado}</p>
        <p className="text-sm text-gray-600">{faixaIMCUltimoRegistro}</p>
      </div>
    </div>
  );
}
