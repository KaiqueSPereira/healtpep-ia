'use client';

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { Button } from "@/app/_components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/app/_components/ui/command";
import { Exame } from "@/app/_components/types"; // Ajuste o caminho se necessário

interface MenuExamesProps {
  exames: Exame[];
  onExameSelect: (exame: Exame | null) => void;
  selectedExame: Exame | null;
}

const MenuExames: React.FC<MenuExamesProps> = ({
  exames = [],
  onExameSelect,
  selectedExame,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Garante que a data do exame seja um objeto Date
  const pastExames = exames.filter(exame => {
    const dataExame = exame.dataExame ? new Date(exame.dataExame) : null;
    return dataExame && dataExame <= new Date();
  });

  const filteredExames = pastExames.filter(exame =>
    (exame.tipo && exame.tipo.toLowerCase().includes(searchValue.toLowerCase())) ||
    (exame.dataExame && new Date(exame.dataExame).toLocaleDateString().includes(searchValue)) ||
    (exame.profissional?.nome?.toLowerCase().includes(searchValue.toLowerCase())) ||
    (exame.unidades?.nome?.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const formatExameText = (exame: Exame): string => {
    const dataFormatada = exame.dataExame ? new Date(exame.dataExame).toLocaleDateString() : 'Data não informada';
    const tipoExame = exame.tipo || "Exame";
    const profissionalNome = exame.profissional?.nome || "Sem profissional";
    const unidadeNome = exame.unidades?.nome || "Sem unidade";
    return `${dataFormatada} - ${tipoExame} - ${profissionalNome} (${unidadeNome})`;
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedExame ? formatExameText(selectedExame) : "Selecione um Exame..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Buscar exame..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>Nenhum exame encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onExameSelect(null);
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${!selectedExame ? "opacity-100" : "opacity-0"}`} />
                  Nenhum (limpar seleção)
                </CommandItem>
                {
                  filteredExames.map((exame) => (
                    <CommandItem
                      key={exame.id}
                      value={formatExameText(exame).toLowerCase()}
                      onSelect={() => {
                        if (selectedExame?.id === exame.id) {
                          onExameSelect(null);
                        } else {
                          onExameSelect(exame);
                        }
                        setOpen(false);
                        setSearchValue("");
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedExame?.id === exame.id ? "opacity-100" : "opacity-0"}`}
                      />
                      {formatExameText(exame)}
                    </CommandItem>
                  ))
                }
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuExames;
