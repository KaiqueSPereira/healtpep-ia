'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Consultatype, Profissional } from '@prisma/client'; // Importar Consultatype e Profissional

// Importar componentes de dropdown/select do Shadcn UI (descomente se estiver usando)
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";

interface ConsultaFilterProps {
  // Props para receber a lista real de profissionais e tipos de consulta do Server Component
  professionals: Profissional[]; // Usar o tipo Profissional do Prisma Client
  consultationTypes: Consultatype[]; // Usar o tipo Consultatype do Prisma Client
}

const ConsultaFilter: React.FC<ConsultaFilterProps> = ({ professionals, consultationTypes }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados locais para a barra de pesquisa e filtros, inicializados com os searchParams da URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedProfissional, setSelectedProfissional] = useState(searchParams.get('profissionalId') || '');
  const [selectedTipo, setSelectedTipo] = useState(searchParams.get('tipo') || '');

  // Efeito para atualizar os searchParams na URL quando os estados locais mudam
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Definir ou remover o parâmetro 'search'
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }

    // Definir ou remover o parâmetro 'profissionalId'
    if (selectedProfissional) {
      params.set('profissionalId', selectedProfissional);
    } else {
      params.delete('profissionalId');
    }

    // Definir ou remover o parâmetro 'tipo'
    if (selectedTipo) {
      params.set('tipo', selectedTipo);
    } else {
      params.delete('tipo');
    }

    // Atualiza a URL sem recarregar a página.
    // Adicionado um debounce para não atualizar a URL a cada tecla digitada na busca.
    const handler = setTimeout(() => {
        router.push(`?${params.toString()}`, { scroll: false });
    }, 500); // Delay de 500ms antes de aplicar a busca/filtros

    // Limpar o timeout se os estados mudarem antes do delay terminar
    return () => {
        clearTimeout(handler);
    };

  }, [searchTerm, selectedProfissional, selectedTipo, router, searchParams]); // Dependências do useEffect

  // Handlers para as mudanças nos inputs/selects
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleProfissionalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedProfissional(event.target.value);
  };

  const handleTipoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedTipo(event.target.value);
  };

  // Função para resetar os filtros
  const handleResetFilters = () => {
      setSearchTerm('');
      setSelectedProfissional('');
      setSelectedTipo('');
      // O useEffect se encarregará de atualizar a URL com os valores vazios
  };


  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Barra de Pesquisa */}
      <Input
        type="text"
        placeholder="Pesquisar consultas..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="flex-grow"
      />

      {/* Dropdown de Profissionais (usando select nativo) */}
       <select
         value={selectedProfissional}
         onChange={handleProfissionalChange} // Usar o handler para select nativo
         className="border rounded-md p-2"
       >
           <option value="">Todos Profissionais</option>
           {/* Mapear sobre a lista REAL de profissionais recebida via props */}
           {professionals.map(profissional => (
               <option key={profissional.id} value={profissional.id}>{profissional.nome}</option>
           ))}
       </select>


      {/* Dropdown de Tipos de Consulta (usando select nativo) */}
        <select
          value={selectedTipo}
          onChange={handleTipoChange} // Usar o handler para select nativo
          className="border rounded-md p-2"
        >
            <option value="">Todos Tipos</option>
            {/* Mapear sobre a lista REAL de tipos de consulta recebida via props */}
            {consultationTypes.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
            ))}
        </select>

      {/* Botão de Reset */}
      <Button
        onClick={handleResetFilters} // Usar o handler de reset
        variant="outline"
      >
        Limpar Filtros
      </Button>
    </div>
  );
};

export default ConsultaFilter;
