// app/exame/components/ExameSection.tsx
import React from 'react';
import ExameItem from './ExameItem'; // Importe o ExameItem da mesma pasta
import { Exame } from '@/app/_components/types';


interface ExameSectionProps {
  title: string;
  exames: Exame[]; // Recebe uma lista de Exames
}

const ExameSection = ({ title, exames }: ExameSectionProps) => (
  <div className="mt-5">
    {/* Título da seção */}
    <h2 className="text-xs font-bold uppercase text-gray-400">{title}</h2>
    {/* Lista de cards de exame com overflow horizontal */}
    <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
      {exames.length > 0 ? (
        exames.map((exame) => (
          <ExameItem key={exame.id} exame={exame} /> // Renderiza ExameItem para cada exame
        ))
      ) : (
        <p className="text-gray-500">Nenhum {title.toLowerCase()}.</p>
      )}
    </div>
  </div>
);

export default ExameSection;
