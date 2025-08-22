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
  CommandList,
  CommandItem,
} from "../../_components/ui/command";
import { Consulta } from "@/app/_components/types";

interface MenuConsultasProps {
  onConsultaSelect: (consulta: Consulta) => void; // Usar o seu tipo Consulta
  selectedConsulta: Consulta | null; // Usar o seu tipo Consulta
  userId: string;
}

const MenuConsultas: React.FC<MenuConsultasProps> = ({
  onConsultaSelect,
  selectedConsulta,
  userId,
}) => {
  const [consultas, setConsultas] = useState<Consulta[]>([]); // Usar o seu tipo Consulta
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchConsultas = async () => {
      try {
        const res = await fetch(`/api/consultas?userId=${userId}`);
        if (!res.ok) {
          throw new Error("Erro ao carregar as consultas");
        }
        const data = await res.json();
        // Assumindo que a API retorna { consultas: [...] } com a estrutura de profissional e unidade
        setConsultas(data.consultas || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Erro ao buscar consultas:", err.message);
        } else {
          console.error("Erro ao buscar consultas:", err);
        }
        setConsultas([]);
      }
    };

    fetchConsultas();
  }, [userId]);

  // Filtrar as consultas no frontend com base no searchValue
  const filteredConsultas = consultas.filter(consulta =>
    consulta.tipo.toLowerCase().includes(searchValue.toLowerCase()) ||
    new Date(consulta.data).toLocaleDateString().includes(searchValue) ||
    consulta.profissional?.nome?.toLowerCase().includes(searchValue.toLowerCase()) ||
    consulta.unidade?.nome?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Função auxiliar para formatar o texto exibido
  const formatConsultaText = (consulta: Consulta): string => { // Usar o seu tipo Consulta
      const dataFormatada = new Date(consulta.data).toLocaleDateString();
      const profissionalNome = consulta.profissional?.nome || "Sem profissional";
      const unidadeNome = consulta.unidade?.nome || "Sem unidade";
      return `${dataFormatada} - ${consulta.tipo} - ${profissionalNome} (${unidadeNome})`;
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
            {selectedConsulta
              ? formatConsultaText(selectedConsulta)
              : "Selecione uma Consulta..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Buscar consulta..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>Nenhuma consulta encontrada.</CommandEmpty>
              <CommandGroup>
                {consultas.length === 0 && searchValue === "" ? (
                   <CommandItem disabled>Carregando consultas...</CommandItem>
                ) : filteredConsultas.map((consulta) => (
                    <CommandItem
                      key={consulta.id}
                       // Valor para busca: incluir todos os campos relevantes e converter para lowercase
                      value={formatConsultaText(consulta).toLowerCase()}
                      onSelect={() => {
                        onConsultaSelect(consulta);
                        setOpen(false);
                        setSearchValue("");
                      }}
                    >
                       {/* Exibir data, tipo, profissional e unidade */}
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedConsulta?.id === consulta.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {formatConsultaText(consulta)}
                    </CommandItem>
                  ))
                }
                 {consultas.length > 0 && filteredConsultas.length === 0 && searchValue !== "" && (
                    <CommandItem disabled>Nenhum resultado encontrado para &quot;{searchValue}&quot;.</CommandItem>
                 )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MenuConsultas;
