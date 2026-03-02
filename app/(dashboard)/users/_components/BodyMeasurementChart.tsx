'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Ruler, ArrowUp, ArrowDown, Minus } from 'lucide-react';

// Interface ajustada para nomes curtos
interface PesoRegistro {
  id: string;
  peso: string;
  data: string;
  pescoco?: string | null;
  torax?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  bracoE?: string | null;
  bracoD?: string | null;
  pernaE?: string | null;
  pernaD?: string | null;
  pantE?: string | null;
  pantD?: string | null;
}

interface BodyMeasurementChartProps {
  historicoPeso: PesoRegistro[];
}

const BodyMeasurementChart = ({ historicoPeso }: BodyMeasurementChartProps) => {
  const { latest, previous } = useMemo(() => {
    const sortedData = [...historicoPeso]
      .filter(
        (item) =>
          item.pescoco ||
          item.torax ||
          item.cintura ||
          item.quadril ||
          item.bracoE ||
          item.bracoD ||
          item.pernaE ||
          item.pernaD ||
          item.pantE ||
          item.pantD
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return { latest: sortedData[0] || null, previous: sortedData[1] || null };
  }, [historicoPeso]);

  const Measurement = ({
    label,
    value,
    prevValue,
    className,
  }: {
    label: string;
    value?: string | null;
    prevValue?: string | null;
    className?: string;
  }) => {
    const currentValue = value ? parseFloat(value) : null;
    const previousValue = prevValue ? parseFloat(prevValue) : null;
    const diff = currentValue !== null && previousValue !== null ? currentValue - previousValue : null;

    if (currentValue === null || isNaN(currentValue)) return null;

    return (
      <div className={`absolute ${className} text-center w-24`}>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold">{currentValue.toFixed(1)} cm</div>
        {diff !== null && diff !== 0 && !isNaN(diff) && (
          <div
            className={`flex items-center justify-center text-xs ${diff < 0 ? 'text-green-500' : 'text-red-500'}`}>
            {diff < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
            {Math.abs(diff).toFixed(1)}
          </div>
        )}
         {diff === 0 && (
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <Minus size={12} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 h-full flex flex-col">
      <h3 className="font-semibold mb-4 flex items-center">
        <Ruler className="mr-2 h-5 w-5" />
        Medidas Corporais
      </h3>
      {!latest ? (
        <div className="flex flex-grow items-center justify-center text-muted-foreground">
          Nenhum registro de medidas encontrado.
        </div>
      ) : (
        <div className="relative mx-auto flex h-96 w-48 justify-center mt-4">
          {/* Body SVG */}
          <svg
            viewBox="0 0 200 500"
            className="h-full w-auto"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g className="text-gray-300 dark:text-gray-700">
              <circle cx="100" cy="50" r="30" />
              <rect x="90" y="80" width="20" height="20" rx="5" />
              <path d="M 75 100 L 60 250 L 140 250 L 125 100 Z" />
              <path d="M 75 100 L 55 110 C 35 120, 35 140, 45 230 L 60 250 Z" />
              <path d="M 125 100 L 145 110 C 165 120, 165 140, 155 230 L 140 250 Z" />
              <path d="M 60 250 L 40 450 L 80 450 L 95 250 Z" />
              <path d="M 140 250 L 160 450 L 120 450 L 105 250 Z" />
            </g>
          </svg>

          {/* Medidas com nomes curtos */}
          <Measurement label="Pescoço" value={latest.pescoco} prevValue={previous?.pescoco} className="top-12 -right-12" />
          <Measurement label="Tórax" value={latest.torax} prevValue={previous?.torax} className="top-24 -left-12" />
          <Measurement label="Braço D" value={latest.bracoD} prevValue={previous?.bracoD} className="top-36 -right-12" />
          <Measurement label="Braço E" value={latest.bracoE} prevValue={previous?.bracoE} className="top-36 -left-12" />
          <Measurement label="Cintura" value={latest.cintura} prevValue={previous?.cintura} className="top-48 -left-12" />
          <Measurement label="Quadril" value={latest.quadril} prevValue={previous?.quadril} className="top-56 -right-12" />
          <Measurement label="Perna D" value={latest.pernaD} prevValue={previous?.pernaD} className="bottom-24 -right-12" />
          <Measurement label="Perna E" value={latest.pernaE} prevValue={previous?.pernaE} className="bottom-24 -left-12" />
          <Measurement label="Pant. D" value={latest.pantD} prevValue={previous?.pantD} className="bottom-8 -right-12" />
          <Measurement label="Pant. E" value={latest.pantE} prevValue={previous?.pantE} className="bottom-8 -left-12" />
        </div>
      )}
    </div>
  );
};

export default BodyMeasurementChart;
