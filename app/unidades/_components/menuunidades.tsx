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
  CommandItem,
  CommandList,
} from "../../_components/ui/command";
// CORREÇÃO: Importa o tipo correto diretamente do Prisma Client
import { UnidadeDeSaude } from "@prisma/client";
import { useRouter } from 'next/navigation';


// CORREÇÃO: Atualiza a interface de props com o tipo correto
interface MenuUnidadesProps {
  onUnidadeSelect: (unidade: UnidadeDeSaude | null) => void;
  selectedUnidade: UnidadeDeSaude | null;
  unidades: UnidadeDeSaude[];
  disabled?: boolean;
}

const MenuUnidades: React.FC<MenuUnidadesProps> = ({ onUnidadeSelect, selectedUnidade, unidades, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleUnidadeSelect = (unidade: UnidadeDeSaude) => {
    onUnidadeSelect(unidade);
    setOpen(false);
  };

  const handleAddNewUnidade = () => {
    router.push("/unidades/novo");
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
            disabled={disabled}
          >
            {selectedUnidade
              ? selectedUnidade.nome
              : "Selecione uma Unidade..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar unidade..." />
            <CommandList>
              <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
              <CommandGroup>
                {unidades.length === 0 ? (
                  <CommandItem disabled>Nenhuma unidade disponível.</CommandItem>
                ) : (
                  unidades.map((unidade) => (
                    <CommandItem
                      key={unidade.id}
                      value={unidade.id}
                      onSelect={() => handleUnidadeSelect(unidade)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedUnidade?.id === unidade.id ? "opacity-100" : "opacity-0"}`}
                      />
                      {unidade.nome}
                    </CommandItem>
                  ))
                )}
                <CommandItem
                  key="add-new-unit"
                  value="add-new-unit"
                  onSelect={handleAddNewUnidade}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Adicionar Nova Unidade
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuUnidades;
