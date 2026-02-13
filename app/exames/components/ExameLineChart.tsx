import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ExameLineChartContent = dynamic(() => import('./ExameLineChartContent'), {
  loading: () => <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false,
});

interface ExameLineChartProps {
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

const ExameLineChart = ({ data, title }: ExameLineChartProps) => {
  return <ExameLineChartContent data={data} title={title} />;
};

export default ExameLineChart;
