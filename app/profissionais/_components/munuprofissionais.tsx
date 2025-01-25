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
import { se } from "date-fns/locale";

interface MenuProfissionaisProps {
  onprofissionalSelect: (profissional: Profissional) => void; // Função para selecionar a unidade
  selectedProfissional: Profissional | null;
}

const MenuProfissionais: React.FC<MenuProfissionaisProps> = ({
  onprofissionalSelect,
}) => {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [open, setOpen] = useState(false);

  // Carregar as unidades da API
  useEffect(() => {
    const fetchProfissionais = async () => {
      try {
        const res = await fetch("/api/profissional");
        if (!res.ok) {
          throw new Error("Erro ao carregar os dados dos especialistas");
        }
        const data: Profissional[] = await res.json();
        setProfissionais(data);
      } catch (err: any) {
        console.error("Erro:", err.message);
      }
    };
    fetchProfissionais();
  }, []);

  const handleProfissionalSelect = (profissional: Profissional) => {
    setSelectedProfissional(profissional);
    onprofissionalSelect(profissional); // Atualizar a unidade selecionada no componente pai
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
            {selectedProfissional
              ? selectedProfissional.nome
              : "Selecione um Especialista..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Buscar especialista..." />
            <CommandList>
              <CommandEmpty>Nenhum especialista encontrado</CommandEmpty>
              <CommandGroup>
                {profissionais.length === 0 ? (
                  <CommandItem disabled>
                    Carregando Especialistas...
                  </CommandItem>
                ) : (
                  profissionais.map((profissionais) => (
                    <CommandItem
                      key={profissionais.id}
                      value={profissionais.id}
                      onSelect={() => handleProfissionalSelect(profissionais)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedProfissional?.id === profissionais.id ? "opacity-100" : "opacity-0"}`}
                      />
                      {profissionais.nome}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>

              <CommandItem
                key="add-new-unit"
                value="add-new-unit"
                onSelect={() => {
                  window.location.href = "/profissionais/[profissionalId]"; // Redireciona para a pĂˇgina de adicionar unidade
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
