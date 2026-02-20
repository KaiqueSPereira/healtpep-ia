'use client';

import { Dispatch, SetStateAction } from 'react';
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Consultatype, Profissional } from '@prisma/client';

interface ConsultaFilterProps {
  professionals: Profissional[];
  consultationTypes: Consultatype[];
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  profissionalId: string;
  setProfissionalId: Dispatch<SetStateAction<string>>;
  tipo: Consultatype | '';
  setTipo: Dispatch<SetStateAction<Consultatype | ''>>;
}

const ConsultaFilter: React.FC<ConsultaFilterProps> = ({
  professionals,
  consultationTypes,
  searchTerm,
  setSearchTerm,
  profissionalId,
  setProfissionalId,
  tipo,
  setTipo,
}) => {

  // A lógica de estado e useEffect foi movida para o componente pai (ConsultasPage)
  // Este componente agora apenas renderiza a UI e chama as funções do pai.

  const handleResetFilters = () => {
    setSearchTerm('');
    setProfissionalId('');
    setTipo('');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <Input
        type="text"
        placeholder="Pesquisar por termo ou data..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-grow"
      />

      <select
        value={profissionalId}
        onChange={(e) => setProfissionalId(e.target.value)}
        className="border rounded-md p-2 bg-white text-black dark:bg-gray-800 dark:text-white"
      >
        <option value="">Todos Profissionais</option>
        {professionals.map(p => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </select>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as Consultatype | '')}
        className="border rounded-md p-2 bg-white text-black dark:bg-gray-800 dark:text-white"
      >
        <option value="">Todos Tipos</option>
        {consultationTypes.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <Button onClick={handleResetFilters} variant="outline">
        Limpar
      </Button>
    </div>
  );
};

export default ConsultaFilter;
