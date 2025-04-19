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
import { Consultas } from "@prisma/client";

// Tipo com profissional incluído
interface ConsultaComProfissional extends Consultas {
  profissional?: {
    id: string;
    nome: string;
  };
}

interface MenuConsultasProps {
  onConsultaSelect: (consulta: Consultas) => void;
  selectedConsulta: Consultas | null;
  userId: string;
  profissional?: {
    id: string;
    nome: string;
  };
}

const MenuConsultas: React.FC<MenuConsultasProps> = ({
  onConsultaSelect,
  selectedConsulta,
  userId,
}) => {
  const [consultas, setConsultas] = useState<ConsultaComProfissional[]>([]);
  const [open, setOpen] = useState(false);


  useEffect(() => {
    if (!userId) return;

    const fetchConsultas = async () => {
      try {
        const res = await fetch(`/api/consultas?userId=${userId}`);
        if (!res.ok) {
          throw new Error("Erro ao carregar as consultas");
        }
        const data = await res.json();
        setConsultas(data.consultas); // Espera que a API inclua 'profissional'
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Erro ao buscar consultas:", err.message);
        } else {
          console.error("Erro ao buscar consultas:", err);
        }
      }
    };

    fetchConsultas();
  }, [userId]);

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
              ? `${new Date(selectedConsulta.data).toLocaleDateString()} - ${selectedConsulta.tipo}`
              : "Selecione uma Consulta..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar consulta..." />
            <CommandList>
              <CommandEmpty>Nenhuma consulta encontrada.</CommandEmpty>
              <CommandGroup>
                {consultas.length === 0 ? (
                  <CommandItem disabled>Carregando consultas...</CommandItem>
                ) : (
                  consultas.map((consulta) => (
                    <CommandItem
                      key={consulta.id}
                      value={consulta.id}
                      onSelect={() => onConsultaSelect(consulta)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedConsulta?.id === consulta.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {new Date(consulta.data).toLocaleDateString()} -{" "}
                      {consulta.tipo} -{" "}
                      {consulta.profissional?.nome || "Sem profissional"}
                    </CommandItem>
                  ))
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
