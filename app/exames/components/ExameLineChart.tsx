import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ExameLineChartProps {
  data: {
    labels: string[]; // Datas dos exames
    datasets: {
      label: string; // Nome do resultado (ex: "Glicose")
      data: number[]; // Valores do resultado
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  title: string; // Título do gráfico
}

const ExameLineChart = ({ data, title }: ExameLineChartProps) => {
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: (screenWidth < 768 ? 'bottom' : 'top') as 'bottom' | 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Data do Exame',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Valor do Resultado',
        },
      },
    },
  };

  return <Line options={options} data={data} />;
};

export default ExameLineChart;
