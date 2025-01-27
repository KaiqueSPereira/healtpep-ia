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
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { Textarea } from "@/app/_components/ui/textarea";

// Lista de horários disponíveis
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

const formSchema = z.object({
  queixas: z.string().min(1, "A descrição da consulta é obrigatória."),
});

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

  const form = useForm({
    defaultValues: { queixas: "" },
  });

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
    const value = e.target.value;
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
      setInputValue(value);
      setSelectedTime(value);
    } else {
      setInputValue(value);
    }
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
          <div className="border-b py-5">
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selectedDay}
              onSelect={handleDateSelect}
            />
          </div>
          {selectedDay && (
            <div className="flex flex-col gap-3 p-5">
              <div className="flex gap-3 overflow-auto">
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
                className="rounded border p-2"
                onChange={handleInputChange}
                value={inputValue}
              />
            </div>
          )}
          {selectedTime && (
            <ConsultaTipoSelector
              consultaTipos={consultaTipos}
              selectedTipo={selectedTipo}
              onTipoSelect={handleTipoSelect}
            />
          )}
          {selectedTipo && (
            <MenuUnidades
              onUnidadeSelect={handleUnidadeSelect}
              selectedUnidade={selectedUnidade}
            />
          )}
          {selectedUnidade && (
            <MenuProfissionais
              onProfissionalSelect={handleProfissionalSelect}
              selectedProfissional={selectedProfissional}
            />
          )}
          <Form {...form}>
            <form>
              <FormField
                control={form.control}
                name="queixas"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Escreva aqui as informações sobre a consulta..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NovaConsulta;
