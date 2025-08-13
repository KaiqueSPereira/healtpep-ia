"use client";

import React, { useState } from "react"; // Removido useEffect
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
import { useRouter } from 'next/navigation'; // Importar useRouter

interface MenuUnidadesProps {
  onUnidadeSelect: (unidade: Unidade) => void; // Função para selecionar a unidade
  selectedUnidade: Unidade | null;
  unidades: Unidade[]; // Adicionada a prop unidades
}

const MenuUnidades: React.FC<MenuUnidadesProps> = ({ onUnidadeSelect, selectedUnidade, unidades }) => { // Recebendo unidades como prop
  const [open, setOpen] = useState(false);
  const router = useRouter(); // Inicializar useRouter

  // Removido o useEffect que buscava unidades internamente

  const handleUnidadeSelect = (unidade: Unidade) => {
    // Não precisamos mais do estado selectedUnidade interno, pois ele é controlado pelo componente pai
    onUnidadeSelect(unidade); // Atualizar a unidade selecionada no componente pai
    setOpen(false); // Fechar o popover após a seleção
  };

  const handleAddNewUnidade = () => {
    router.push("/unidades/novo"); // Usando router.push para navegação
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
                {unidades.length === 0 ? ( // Usando a prop unidades
                  <CommandItem disabled>Nenhuma unidade disponível</CommandItem>
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
                )}{" "}
                <CommandItem
                  key="add-new-unit"
                  value="add-new-unit"
                  onSelect={handleAddNewUnidade} // Usando a nova função de navegação
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