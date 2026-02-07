// app/exames/components/ExameSection.tsx
import React from 'react';
import ExameItem from './ExameItem';
import type { Exame, Profissional, UnidadeDeSaude } from "@prisma/client";

type ExameComRelacoes = Exame & {
  profissional: Profissional | null;
  unidades: UnidadeDeSaude | null;
};

interface ExameSectionProps {
  title: string;
  exames: ExameComRelacoes[];
}

const ExameSection = ({ title, exames }: ExameSectionProps) => (
  <div className="mt-5">
    <h2 className="text-xs font-bold uppercase text-gray-400">{title}</h2>
    {/* REVERSÃO: Voltando ao layout de flex com rolagem para evitar sobreposição */}
    <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden py-2">
      {exames.length > 0 ? (
        exames.map((exame) => (
          <ExameItem key={exame.id} exame={exame} />
        ))
      ) : (
        <p className="text-gray-500">Nenhum exame encontrado.</p>
      )}
    </div>
  </div>
);

export default ExameSection;
