'use client';
import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { PlusCircle, CalendarIcon } from 'lucide-react';
import AddRegistroDialog from './AddMedidasDialog';
import DateRangePickerDialog from './DateRangePickerDialog';

interface PesoRegistro {
  id: string;
  data: string;
  peso: string;
}

interface PesoHistoryChartProps {
  userId: string;
  historicoPeso: PesoRegistro[];
  altura: number | null;
  onDataChange: () => void;
}

const FILTER_OPTIONS: { [key: string]: number } = {
  '7D': 7,
  '15D': 15,
  '30D': 30,
  '90D': 90,
  '1A': 365,
};

const PesoHistoryChart = ({ userId, historicoPeso, altura, onDataChange }: PesoHistoryChartProps) => {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isDateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>('Todos');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  const filteredAndSortedHistory = useMemo(() => {
    if (!historicoPeso) return [];
    
    let filtered = [...historicoPeso];

    if (activeFilter && FILTER_OPTIONS[activeFilter]) {
      const daysToSubtract = FILTER_OPTIONS[activeFilter];
      const startDate = startOfDay(subDays(new Date(), daysToSubtract));
      filtered = filtered.filter(item => parseISO(item.data) >= startDate);
    } else if (customDateRange.from && customDateRange.to) {
        const startDate = startOfDay(customDateRange.from);
        const endDate = endOfDay(customDateRange.to);
        filtered = filtered.filter(item => {
            const itemDate = parseISO(item.data);
            return itemDate >= startDate && itemDate <= endDate;
        });
    } else if (activeFilter === 'Todos') {
      // Nenhum filtro de data aplicado
    }

    return filtered.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [historicoPeso, activeFilter, customDateRange]);

  const formattedHistoryForChart = useMemo(() => {
    return filteredAndSortedHistory.map(item => ({
      ...item,
      data: format(parseISO(item.data), 'dd/MM'),
      peso: parseFloat(item.peso.replace(',', '.')),
    }));
  }, [filteredAndSortedHistory]);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    setCustomDateRange({ from: undefined, to: undefined });
  };

  const handleCustomDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setCustomDateRange(range);
    setActiveFilter(null); // Desativa filtros rápidos
    setDateRangeModalOpen(false);
  };

  return (
    <div className="bg-card p-6 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Histórico de Peso</h3>
          <div className="flex items-center space-x-2 mt-2 flex-wrap">
            <Badge
              variant={activeFilter === 'Todos' ? 'default' : 'outline'}
              onClick={() => handleFilterClick('Todos')}
              className="cursor-pointer"
            >
              Todos
            </Badge>
            {Object.keys(FILTER_OPTIONS).map(key => (
              <Badge
                key={key}
                variant={activeFilter === key ? 'default' : 'outline'}
                onClick={() => handleFilterClick(key)}
                className="cursor-pointer"
              >
                {key}
              </Badge>
            ))}
            <Button onClick={() => setDateRangeModalOpen(true)} size="sm" variant="outline" className="h-7">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Personalizado
            </Button>
          </div>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" variant="outline" className="flex-shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Registro
        </Button>
      </div>

      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={formattedHistoryForChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="data" stroke="#888" fontSize={12} />
            <YAxis 
                stroke="#888" 
                fontSize={12} 
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(value) => `${value}kg`}
            />
            <Tooltip
                contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    borderColor: '#ef4444',
                }}
            />
            <Area type="monotone" dataKey="peso" stroke="#ef4444" fillOpacity={1} fill="url(#colorPeso)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <AddRegistroDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onRegistroAdded={onDataChange}
        userId={userId}
        altura={altura}
      />

      <DateRangePickerDialog
        isOpen={isDateRangeModalOpen}
        onOpenChange={setDateRangeModalOpen}
        onDateChange={handleCustomDateChange}
        currentRange={customDateRange}
      />
    </div>
  );
};

export default PesoHistoryChart;
