"use client";

import React, { useEffect, useState } from "react";
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
  CommandItem,
  CommandList,
} from "../../_components/ui/command";
import { Profissional } from "@/app/_components/types";

interface MenuProfissionaisProps {
  profissionais: Profissional[]; // Lista completa de profissionais
  onProfissionalSelect: (profissional: Profissional) => void; // Callback ao selecionar um profissional
  selectedProfissional: Profissional | null; // Profissional atualmente selecionado
  unidadeId?: string; // Agora o unidadeId é opcional
}

const MenuProfissionais: React.FC<MenuProfissionaisProps> = ({
  profissionais,
  onProfissionalSelect,
  selectedProfissional,
  unidadeId,
}) => {
  const [open, setOpen] = useState(false);
  const [filteredProfissionais, setFilteredProfissionais] = useState<
    Profissional[]
  >([]);

  // Filtramos os profissionais caso unidadeId seja passado
  useEffect(() => {
    if (unidadeId) {
      setFilteredProfissionais(
        profissionais.filter((p) => p.unidades.some((u) => u.id === unidadeId)),
      );
    } else {
      setFilteredProfissionais(profissionais); // Sem unidadeId, exibe todos os profissionais
    }
  }, [unidadeId, profissionais]);

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
            {selectedProfissional
              ? selectedProfissional.nome
              : "Selecione um Especialista..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar especialista..." />
            <CommandList>
              <CommandEmpty>Nenhum especialista encontrado</CommandEmpty>
              <CommandGroup>
                {filteredProfissionais.length === 0 ? (
                  <CommandItem disabled>
                    Nenhum especialista disponível
                  </CommandItem>
                ) : (
                  filteredProfissionais.map((profissional) => (
                    <CommandItem
                      key={profissional.id}
                      value={profissional.id}
                      onSelect={() => onProfissionalSelect(profissional)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedProfissional?.id === profissional.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {profissional.nome} - {profissional.especialidade}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
              <CommandItem
                key="add-new-unit"
                value="add-new-unit"
                onSelect={() => {
                  window.location.href = "/profissionais/[profissionalId]";
                }}
              >
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Adicionar Novo Especialista
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuProfissionais;
