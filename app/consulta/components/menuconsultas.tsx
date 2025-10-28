"use client";

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

// CORREÇÃO: Receber 'consultas' como prop e remover 'userId'
interface MenuConsultasProps {
  consultas: Consulta[];
  onConsultaSelect: (consulta: Consulta | null) => void;
  selectedConsulta: Consulta | null;
}

const MenuConsultas: React.FC<MenuConsultasProps> = ({
  consultas = [], // Usar a lista de consultas vinda das props
  onConsultaSelect,
  selectedConsulta,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // REMOÇÃO: O useEffect que buscava os dados foi removido.

  const filteredConsultas = consultas.filter(consulta =>
    consulta.tipo.toLowerCase().includes(searchValue.toLowerCase()) ||
    new Date(consulta.data).toLocaleDateString().includes(searchValue) ||
    consulta.profissional?.nome?.toLowerCase().includes(searchValue.toLowerCase()) ||
    consulta.unidade?.nome?.toLowerCase().includes(searchValue.toLowerCase())
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
              placeholder="Buscar consulta..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>Nenhuma consulta encontrada.</CommandEmpty>
              <CommandGroup>
                 {/* Adicionado um item para desmarcar a seleção */}
                <CommandItem
                    onSelect={() => {
                        onConsultaSelect(null);
                        setOpen(false);
                    }}
                >
                    <Check className={`mr-2 h-4 w-4 ${!selectedConsulta ? "opacity-100" : "opacity-0"}`} />
                    Nenhuma (limpar seleção)
                </CommandItem>
                {consultas.length === 0 && searchValue === "" ? (
                   <CommandItem disabled>Carregando consultas...</CommandItem>
                ) : filteredConsultas.map((consulta) => (
                    <CommandItem
                      key={consulta.id}
                      value={formatConsultaText(consulta).toLowerCase()}
                      onSelect={() => {
                        onConsultaSelect(consulta);
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
                 {consultas.length > 0 && filteredConsultas.length === 0 && searchValue !== "" && (
                    <CommandItem disabled>Nenhum resultado encontrado para &quot;{searchValue}&quot;.</CommandItem>
                 )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuConsultas;
