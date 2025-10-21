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
// CORREÇÃO: Importa o tipo correto do Prisma Client
import { Profissional } from "@prisma/client";
import { useRouter } from "next/navigation";

// CORREÇÃO: Atualiza a interface para usar o tipo correto e aceitar a prop 'disabled'
interface MenuProfissionaisProps {
  profissionais: Profissional[];
  onProfissionalSelect: (profissional: Profissional | null) => void;
  selectedProfissional: Profissional | null;
  unidadeId?: string | null;
  disabled?: boolean; // Adiciona a prop disabled
}

const MenuProfissionais: React.FC<MenuProfissionaisProps> = ({
  profissionais,
  onProfissionalSelect,
  selectedProfissional,
  disabled = false, // Define um valor padrão
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSelect = (profissional: Profissional) => {
    onProfissionalSelect(profissional);
    setOpen(false);
  };

  const handleAddNew = () => {
    // CORREÇÃO: Leva para a página de criação, e não para um ID dinâmico
    router.push("/profissionais/novo");
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {/* CORREÇÃO: Aplica a propriedade disabled ao botão */}
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedProfissional
              ? `${selectedProfissional.nome} - ${selectedProfissional.especialidade}`
              : "Selecione um Profissional..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar profissional..." />
            <CommandList>
              <CommandEmpty>Nenhum profissional encontrado.</CommandEmpty>
              <CommandGroup>
                {profissionais.length === 0 ? (
                  <CommandItem disabled>Nenhum profissional disponível.</CommandItem>
                ) : (
                  profissionais.map((profissional) => (
                    <CommandItem
                      key={profissional.id}
                      value={profissional.id}
                      onSelect={() => handleSelect(profissional)}
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
              <CommandGroup>
                <CommandItem onSelect={handleAddNew}>
                  <span className="mr-2 h-4 w-4">+</span>
                  Adicionar Novo Profissional
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuProfissionais;
