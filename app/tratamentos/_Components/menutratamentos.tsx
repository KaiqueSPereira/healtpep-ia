"use client";

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Tratamento } from "@/app/_components/types";

interface MenuTratamentoProps {
  tratamentos: Tratamento[]; // ← mesmo se isso vier como undefined, agora tratamos
  onTratamentoSelect: (tratamento: Tratamento) => void;
  selectedTratamento: Tratamento | null;
}

const MenuTratamentos: React.FC<MenuTratamentoProps> = ({
  tratamentos = [], // ← fallback para []
  onTratamentoSelect,
  selectedTratamento,
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Selecione um tratamento"
            title={
              selectedTratamento
                ? selectedTratamento.nome
                : "Selecione um Tratamento..."
            }
            className="w-full justify-between"
          >
            {selectedTratamento
              ? selectedTratamento.nome
              : "Selecione um Tratamento..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar Tratamento..." />
            <CommandList>
              {tratamentos.length === 0 ? (
                <CommandEmpty>Nenhum tratamento cadastrado</CommandEmpty>
              ) : (
                <CommandGroup>
                  {tratamentos.map((tratamento) => (
                    <CommandItem
                      key={tratamento.id}
                      value={tratamento.id.toString()}
                      onSelect={() => {
                        onTratamentoSelect(tratamento);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedTratamento?.id === tratamento.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {tratamento.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandItem
                key="add-new-tratamento"
                value="add-new-tratamento"
                onSelect={() => {
                  router.push("/tratamentos/[tratamentoId]");
                  setOpen(false);
                }}
              >
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Adicionar Novo Tratamento
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuTratamentos;
