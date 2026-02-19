'use client';

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { Button } from "@/app/_components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/_components/ui/command";
import { CondicaoSaude } from "@/app/_components/types";

interface MenuCondicoesProps {
  condicoes: CondicaoSaude[];
  onCondicaoSelect: (condicao: CondicaoSaude | null) => void;
  selectedCondicao: CondicaoSaude | null;
}

const MenuCondicoes: React.FC<MenuCondicoesProps> = ({
  condicoes = [],
  onCondicaoSelect,
  selectedCondicao,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Selecione uma condição de saúde"
            title={
              selectedCondicao
                ? selectedCondicao.nome
                : "Selecione uma Condição..."
            }
            className="w-full justify-between"
          >
            {selectedCondicao
              ? selectedCondicao.nome
              : "Selecione uma Condição..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar Condição..." />
            <CommandList>
              {condicoes.length === 0 ? (
                <CommandEmpty>Nenhuma condição cadastrada.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {condicoes.map((condicao) => (
                    <CommandItem
                      key={condicao.id}
                      value={condicao.id.toString()}
                      onSelect={() => {
                        onCondicaoSelect(condicao);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedCondicao?.id === condicao.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {condicao.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuCondicoes;
