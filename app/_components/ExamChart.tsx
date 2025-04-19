// app/_components/ExamChart.tsx
"use client";

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Exam {
  dataExame: Date | string;
  nome: string;
  resultados: { glucose?: number; creatinine?: number }; // Adjust the type based on your actual data structure
}

interface ExamChartProps {
  examData: Exam[];
}

const ExamChart: React.FC<ExamChartProps> = ({ examData }) => {
  // --- 1. Data Filtering and Processing ---
  const bloodAndUrineExams = examData.filter(exam =>
    exam.nome.toLowerCase().includes('sangue') || exam.nome.toLowerCase().includes('urina') // Adjust filtering as needed
  );

  // --- Example: Extract glucose for blood tests (adapt to your actual data) ---
  const bloodGlucoseData = bloodAndUrineExams
    .filter(exam => exam.nome.toLowerCase().includes('sangue'))
    .map(exam => ({
      x: new Date(exam.dataExame).toLocaleDateString(), // Format date for chart
      // y: JSON.parse(exam.resultados)?.glucose || null, // Example: Extract glucose value. Adapt!
      y: 100 // Placeholder value replace with LLM call.
    }));

  // --- Example: Extract creatinine for urine tests (adapt to your actual data) ---
  const urineCreatinineData = bloodAndUrineExams
    .filter(exam => exam.nome.toLowerCase().includes('urina'))
    .map(exam => ({
      x: new Date(exam.dataExame).toLocaleDateString(),
      // y: JSON.parse(exam.resultados)?.creatinine || null, // Example: Extract creatinine. Adapt!
      y: 100 // Placeholder value replace with LLM call.
    }));

  // --- 2. Chart Data and Options ---
  const chartData: ChartData<"line"> = {
    labels: bloodGlucoseData.map(data => data.x).concat(urineCreatinineData.map(data => data.x)), // Combine dates
    datasets: [
      {
        label: 'Blood Glucose', // Adjust label
        data: bloodGlucoseData.map(data => data.y),
        borderColor: '#FF6384', // Example color
        backgroundColor: '#FF6384',
        tension: 0.1
      },
      {
        label: 'Urine Creatinine', // Adjust label
        data: urineCreatinineData.map(data => data.y),
        borderColor: '#36A2EB', // Example color
        backgroundColor: '#36A2EB',
        tension: 0.1
      },
    ],
  };

  const chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Latest Blood and Urine Test Results' }, // Adjust title
    },
    scales: {
      x: {
        type: 'category',
        display: true,
        title: { display: true, text: 'Date' },
      },
      y: {
        type: 'linear',
        display: true,
        title: { display: true, text: 'Value' },
        beginAtZero: true,
      },
    } as {
      x: { type: 'category'; display: boolean; title: { display: boolean; text: string } };
      y: { type: 'linear'; display: boolean; title: { display: boolean; text: string }; beginAtZero: boolean };
    },
  };

  // --- 3. Rendering ---
  if (bloodGlucoseData.length === 0 && urineCreatinineData.length === 0) { // Adjust this condition
    return <p>No blood or urine test results found.</p>;
  }

  return (
    <div style={{ height: '300px', width: '600px' }}> {/* Adjust styling */}
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ExamChart;