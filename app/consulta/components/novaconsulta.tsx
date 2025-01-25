"use client";
import ConsultaTipoSelector from "@/app/_components/consultatiposelector";
import MenuUnidades from "@/app/unidades/_components/menuunidades";
import { Profissional, Unidade } from "@/app/_components/types";
import { Button } from "@/app/_components/ui/button";
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/_components/ui/sheet";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import MenuProfissionais from "@/app/profissionais/_components/munuprofissionais";

// Lista de horĂˇrios disponĂ­veis
const TIME_LIST = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

const NovaConsulta = () => {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const [consultaTipos, setConsultaTipos] = useState<string[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string | undefined>(
    undefined,
  );
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);

  // Buscar os tipos de consulta da API
  useEffect(() => {
    async function fetchConsultaTipos() {
      try {
        const response = await fetch("/api/consultas/tipoconsultas");
        if (!response.ok) {
          throw new Error("Erro ao buscar os tipos de consulta");
        }
        const tipos = await response.json();
        setConsultaTipos(tipos);
      } catch (error) {
        console.error("Erro ao buscar os tipos de consulta:", error);
      }
    }

    fetchConsultaTipos();
  }, []);

  const handleDateSelect = (date: Date | undefined) => setSelectedDay(date);
  const handleTimeSelect = (time: string | undefined) => setSelectedTime(time);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedTime(undefined);
  };
  const handleTipoSelect = (tipo: string) => setSelectedTipo(tipo);
  const handleUnidadeSelect = (unidade: Unidade) => setSelectedUnidade(unidade);
  const handleProfissionalSelect = (profissional: Profissional | null) =>
    setSelectedProfissional(profissional);

  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Nova Consulta</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Consulta</SheetTitle>
          </SheetHeader>
          <div className="border-b border-solid py-5">
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selectedDay}
              onSelect={handleDateSelect}
              styles={{
                head_cell: { width: "100%", textTransform: "capitalize" },
                caption: { textTransform: "capitalize" },
              }}
            />
          </div>
          {selectedDay && (
            <div className="flex flex-col gap-3 p-5">
              <div className="flex gap-3 overflow-auto [&::-webkit-scrollbar]:hidden">
                {TIME_LIST.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => handleTimeSelect(time)}
                    disabled={inputValue !== ""}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <input
                type="time"
                placeholder="Digite a hora"
                className="rounded border bg-black p-2 text-white"
                onChange={handleInputChange}
                value={inputValue}
              />
            </div>
          )}
          {selectedTime && (
            <div className="py-5">
              <ConsultaTipoSelector
                consultaTipos={consultaTipos}
                selectedTipo={selectedTipo}
                onTipoSelect={handleTipoSelect}
              />
            </div>
          )}
          {selectedTipo && (
            <MenuUnidades
              onUnidadeSelect={handleUnidadeSelect}
              selectedUnidade={selectedUnidade}
            />
          )}
          {selectedUnidade && (
            <div className="py-5">
              <h3>Unidade selecionada: {selectedUnidade.nome}</h3>
            </div>
          )}
          <MenuProfissionais
            onprofissionalSelect={handleProfissionalSelect}
            selectedProfissional={selectedProfissional}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NovaConsulta;
