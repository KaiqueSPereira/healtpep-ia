'use client';

import { Dispatch, SetStateAction } from 'react';
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
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

// Valor especial para representar a opção "todos"
const ALL_ITEMS_VALUE = 'all';

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

  const handleResetFilters = () => {
    setSearchTerm('');
    setProfissionalId('');
    setTipo('');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <Input
        type="text"
        placeholder="Pesquisar por termo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-grow"
      />

      <Select 
        value={profissionalId || ALL_ITEMS_VALUE} 
        onValueChange={(value) => setProfissionalId(value === ALL_ITEMS_VALUE ? '' : value)}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Todos Profissionais" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_ITEMS_VALUE}>Todos Profissionais</SelectItem>
          {professionals.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={tipo || ALL_ITEMS_VALUE} 
        onValueChange={(value) => setTipo(value === ALL_ITEMS_VALUE ? '' : (value as Consultatype))}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Todos Tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_ITEMS_VALUE}>Todos Tipos</SelectItem>
          {consultationTypes.map(t => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleResetFilters} variant="outline">
        Limpar
      </Button>
    </div>
  );
};

export default ConsultaFilter;
