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
import { Unidade } from "../../_components/types";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";


interface MenuUnidadesProps {
  onUnidadeSelect: (unidade: Unidade) => void;
  selectedUnidade: Unidade | null;
  unidades: Unidade[];
}

const MenuUnidades: React.FC<MenuUnidadesProps> = ({ onUnidadeSelect, selectedUnidade, unidades }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
    const currentUser = session?.user;


  // Filter units based on currentUser.id
  // Adicionado um check para garantir que currentUser e currentUser.id existem antes de filtrar
  const filteredUnidades = currentUser?.id
    ? unidades.filter(unidade => unidade.userId === currentUser.id)
    : []; // Retorna um array vazio se o usuário não estiver logado


  const handleUnidadeSelect = (unidade: Unidade) => {
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
                {filteredUnidades.length === 0 ? ( // Use filteredUnidades
                  <CommandItem disabled>Nenhuma unidade disponível para este usuário</CommandItem>
                ) : (
                  filteredUnidades.map((unidade) => ( // Use filteredUnidades
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
                )}{" "}
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