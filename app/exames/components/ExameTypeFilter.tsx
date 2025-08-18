// app/exames/components/ExameTypeFilter.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/app/_components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { Label } from "@/app/_components/ui/label";
import { Separator } from "@/app/_components/ui/separator";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Input } from "@/app/_components/ui/input"; // Importe o componente Input


interface Resultado {
  nome: string;
}

interface Exame {
  resultados?: Resultado[];
}

interface ExameTypeFilterProps {
  exames: Exame[];
  onSelectTypes: (selectedTypes: string[]) => void;
  onSelectResultsForChart: (selectedResults: string[]) => void;
}

const ExameTypeFilter: React.FC<ExameTypeFilterProps> = ({ exames, onSelectTypes, onSelectResultsForChart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilterTypes, setSelectedFilterTypes] = useState<string[]>([]);
  const [selectedChartResults, setSelectedChartResults] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para o termo de busca

  // Use useMemo para memorizar a lista completa de nomes de resultados
  const allResultNames = useMemo(() => {
    return Array.from(new Set(exames.flatMap(exame =>
      exame.resultados?.map(resultado => resultado.nome) || []
    ))).sort();
  }, [exames]); // A dependência é apenas 'exames'

  // Use useMemo para filtrar os nomes de resultados com base no termo de busca
  const filteredResultNames = useMemo(() => {
    if (!searchTerm) {
      return allResultNames;
    }
    return allResultNames.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allResultNames, searchTerm]); // Depende de allResultNames e searchTerm


  // useEffect para inicializar os estados locais e chamar as props de callback
  useEffect(() => {
      // Verifique se allResultNames não está vazio antes de inicializar
      if (allResultNames.length > 0) {
          // Compare com o estado atual antes de atualizar para evitar loops desnecessários
          // Esta verificação pode ser menos crucial agora com useMemo para allResultNames
          // Mas podemos mantê-la para segurança.
          if (JSON.stringify(selectedFilterTypes) !== JSON.stringify(allResultNames)) {
              setSelectedFilterTypes(allResultNames);
          }
          if (JSON.stringify(selectedChartResults) !== JSON.stringify(allResultNames)) {
              setSelectedChartResults(allResultNames);
          }
      } else {
           // Limpa os estados se não houver nomes de resultados
           if (selectedFilterTypes.length > 0) setSelectedFilterTypes([]);
           if (selectedChartResults.length > 0) setSelectedChartResults([]);
           // Chame as props de callback com arrays vazios
 }
       // Limpar o termo de busca quando a lista de exames mudar
       setSearchTerm('');
  }, [allResultNames, onSelectTypes, onSelectResultsForChart, selectedFilterTypes, selectedChartResults]); // Depende de allResultNames, das funções de callback, e dos estados selecionados

  const handleCheckboxChange = (type: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFilterTypes([...selectedFilterTypes, type]);
      setSelectedChartResults([...selectedChartResults, type]); // Mantenha em sync por enquanto
    } else {
      setSelectedFilterTypes(selectedFilterTypes.filter(selectedType => selectedType !== type));
      setSelectedChartResults(selectedChartResults.filter(selectedResult => selectedResult !== type)); // Mantenha em sync por enquanto
    }
  };

  const handleApplyFilter = () => {
    onSelectTypes(selectedFilterTypes);
    onSelectResultsForChart(selectedChartResults);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setSelectedFilterTypes([]);
    setSelectedChartResults([]);
    onSelectTypes([]);
    onSelectResultsForChart([]);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    setSelectedFilterTypes(allResultNames);
    setSelectedChartResults(allResultNames);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">Filtrar</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Tipos de Exame e Resultados para Gráfico</h4>
            <p className="text-sm text-muted-foreground">
              Selecione os tipos para filtrar e os resultados para o gráfico.
            </p>
          </div>
          <Separator />
           {/* Campo de busca */}
          <Input
            placeholder="Buscar exame..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="mb-2"
          />
          <ScrollArea className="h-40 pr-4">
             <div className="grid gap-2">
                {/* Renderize a lista filtrada */}
                {filteredResultNames.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                     <Checkbox
                        id={`checkbox-${type}`}
                        checked={selectedFilterTypes.includes(type)}
                        onCheckedChange={(isChecked: boolean) => handleCheckboxChange(type, isChecked)}
                     />
                     <Label htmlFor={`checkbox-${type}`} className="text-sm font-normal">
                        {type}
                     </Label>
                  </div>
                ))}
                {/* Mensagem se nenhum resultado for encontrado na busca */}
                 {filteredResultNames.length === 0 && searchTerm !== '' && (
                     <p className="text-sm text-muted-foreground text-center">Nenhum resultado encontrado.</p>
                 )}
             </div>
          </ScrollArea>
           <Separator />
           <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={handleClearFilter}>Limpar</Button>
               {/* O botão "Selecionar Todos" agora selecionará todos os resultados _completos_, não apenas os filtrados pela busca */}
               <Button variant="outline" size="sm" onClick={handleSelectAll}>Selecionar Todos</Button>
              <Button size="sm" onClick={handleApplyFilter}>Aplicar</Button>
           </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExameTypeFilter;
