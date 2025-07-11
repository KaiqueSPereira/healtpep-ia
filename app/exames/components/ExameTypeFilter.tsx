// app/exames/components/ExameTypeFilter.tsx
import React, { useState, useEffect } from 'react';
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

  const allResultNames = Array.from(new Set(exames.flatMap(exame =>
    exame.resultados?.map(resultado => resultado.nome) || []
  ))).sort();

  useEffect(() => {
      setSelectedFilterTypes(allResultNames);
      setSelectedChartResults(allResultNames);
      onSelectTypes(allResultNames);
      onSelectResultsForChart(allResultNames);
  }, [exames, allResultNames, onSelectTypes, onSelectResultsForChart]);


  const handleCheckboxChange = (type: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFilterTypes([...selectedFilterTypes, type]);
      setSelectedChartResults([...selectedChartResults, type]);
    } else {
      setSelectedFilterTypes(selectedFilterTypes.filter(selectedType => selectedType !== type));
      setSelectedChartResults(selectedChartResults.filter(selectedResult => selectedResult !== type));
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


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {/* Keeping simplified button content for now */}
        <Button variant="outline">Filtrar</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Tipos de Exame e Resultados para Gráfico</h4>
            <p className="text-sm text-muted-foreground">
              Selecione os tipos para filtrar e os resultados para o gráfico.
            </p>
          </div>
          <Separator />
          <ScrollArea className="h-40 pr-4">
             <div className="grid gap-2">
                {allResultNames.map(type => (
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
             </div>
          </ScrollArea>
           <Separator />
           <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={handleClearFilter}>Limpar</Button>
               <Button variant="outline" size="sm" onClick={handleSelectAll}>Selecionar Todos</Button>
              <Button size="sm" onClick={handleApplyFilter}>Aplicar</Button>
           </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExameTypeFilter;
