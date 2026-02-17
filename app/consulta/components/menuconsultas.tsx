'use client';

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../_components/ui/popover";
import { Button } from "../../_components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from "../../_components/ui/command";
import { Consulta } from "@/app/_components/types";

interface MenuConsultasProps {
  consultas: Consulta[];
  onConsultaSelect: (consulta: Consulta | null) => void;
  selectedConsulta: Consulta | null;
}

const MenuConsultas: React.FC<MenuConsultasProps> = ({
  consultas = [],
  onConsultaSelect,
  selectedConsulta,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filtra para mostrar apenas consultas que já aconteceram (data <= hoje)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Garante que consultas de hoje sejam incluídas
  const pastConsultas = consultas.filter(consulta => new Date(consulta.data) <= today);

  // Aplica o filtro de busca sobre as consultas passadas
  const filteredConsultas = pastConsultas.filter(consulta =>
    (consulta.tipo.toLowerCase().includes(searchValue.toLowerCase())) ||
    (new Date(consulta.data).toLocaleDateString().includes(searchValue)) ||
    (consulta.profissional?.nome?.toLowerCase().includes(searchValue.toLowerCase())) ||
    (consulta.unidade?.nome?.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const formatConsultaText = (consulta: Consulta): string => {
      const dataFormatada = new Date(consulta.data).toLocaleDateString();
      const profissionalNome = consulta.profissional?.nome || "Sem profissional";
      const unidadeNome = consulta.unidade?.nome || "Sem unidade";
      return `${dataFormatada} - ${consulta.tipo} - ${profissionalNome} (${unidadeNome})`;
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
            {selectedConsulta
              ? formatConsultaText(selectedConsulta)
              : "Selecione uma Consulta..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Buscar consulta..." // Texto revertido
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {/* Mensagem genérica quando a lista (já filtrada por data) está vazia */}
              <CommandEmpty>Nenhuma consulta encontrada.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                    onSelect={() => {
                        onConsultaSelect(null);
                        setOpen(false);
                    }}
                >
                    <Check className={`mr-2 h-4 w-4 ${!selectedConsulta ? "opacity-100" : "opacity-0"}`} />
                    Nenhuma (limpar seleção)
                </CommandItem>
                {
                  filteredConsultas.map((consulta) => (
                    <CommandItem
                      key={consulta.id}
                      value={formatConsultaText(consulta).toLowerCase()}
                      onSelect={() => {
                        // Lógica de toggle: seleciona se for diferente, deseleciona se for igual
                        if (selectedConsulta?.id === consulta.id) {
                            onConsultaSelect(null);
                        } else {
                            onConsultaSelect(consulta);
                        }
                        setOpen(false);
                        setSearchValue("");
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedConsulta?.id === consulta.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {formatConsultaText(consulta)}
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

export default MenuConsultas;
