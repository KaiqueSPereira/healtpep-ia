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
import { Unidade } from "../../_components/types";

interface MenuUnidadesProps {
  onUnidadeSelect: (unidade: Unidade) => void; // Função para selecionar a unidade
  selectedUnidade: Unidade | null;
}

const MenuUnidades: React.FC<MenuUnidadesProps> = ({ onUnidadeSelect }) => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [open, setOpen] = useState(false);

  // Carregar as unidades da API
  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const res = await fetch("/api/unidadesaude");
        if (!res.ok) {
          throw new Error("Erro ao carregar as unidades");
        }
        const data: Unidade[] = await res.json();
        setUnidades(data);
      } catch (err: any) {
        console.error("Erro:", err.message);
      }
    };
    fetchUnidades();
  }, []);

  const handleUnidadeSelect = (unidade: Unidade) => {
    setSelectedUnidade(unidade);
    onUnidadeSelect(unidade); // Atualizar a unidade selecionada no componente pai
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {selectedUnidade
              ? selectedUnidade.nome
              : "Selecione uma Unidade..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Buscar unidade..." />
            <CommandList>
              <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
              <CommandGroup>
                {unidades.length === 0 ? (
                  <CommandItem disabled>Carregando unidades...</CommandItem>
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
              </CommandGroup>

              <CommandItem
                key="add-new-unit"
                value="add-new-unit"
                onSelect={() => {
                  window.location.href = "/unidades/[unidadeId]"; // Redireciona para a pĂˇgina de adicionar unidade
                }}
              >
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Adicionar Nova Unidade
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuUnidades;
