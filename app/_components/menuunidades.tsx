"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  endereco: string;
}

const MenuUnidades: React.FC = () => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [open, setOpen] = useState(false);

  // Carregar as unidades da API
  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const res = await fetch("/api/unidadesaude"); // Aqui, você pode usar sua API
        if (!res.ok) {
          throw new Error("Erro ao carregar as unidades");
        }
        const data: Unidade[] = await res.json();
        console.log("Unidades recebidas:", data); // Verifique se as unidades estão sendo recebidas corretamente
        setUnidades(data);
      } catch (err: any) {
        console.error("Erro:", err.message);
      }
    };
    fetchUnidades();
  }, []);

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
                      onSelect={(currentValue) => {
                        // Atualiza a unidade selecionada
                        const selected = unidades.find(
                          (u) => u.id === currentValue,
                        );
                        if (selected) {
                          setSelectedUnidade(selected);
                          setOpen(false);
                        }
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedUnidade?.id === unidade.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {unidade.nome} - {unidade.tipo} - {unidade.endereco}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>

              {/* Adicionar Nova Unidade */}
              <CommandItem
                key="add-new-unit"
                value="add-new-unit"
                onSelect={() => {
                  window.location.href = "/unidades/[unidadeId]"; // Redireciona para a página de adicionar unidade
                }}
              >
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Adicionar Nova Unidade
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Exibir a unidade selecionada */}
      {selectedUnidade && (
        <div>
          <h3>Unidade Selecionada:</h3>
          <p>
            {selectedUnidade.nome} - {selectedUnidade.tipo} -{" "}
            {selectedUnidade.endereco}
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuUnidades;
