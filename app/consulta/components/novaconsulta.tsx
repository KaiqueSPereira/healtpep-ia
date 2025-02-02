"use client";

import ConsultaTipoSelector from "@/app/_components/consultatiposelector";
import MenuUnidades from "@/app/unidades/_components/menuunidades";
import { Profissional, Unidade, Tratamento } from "@/app/_components/types";
import { Button } from "@/app/_components/ui/button";
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/app/_components/ui/sheet";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/app/_components/ui/form";
import { Textarea } from "@/app/_components/ui/textarea";
import { set } from "date-fns";
import { useSession } from "next-auth/react";
import { toast } from "@/app/_hooks/use-toast";
import { createConsulta } from "@/app/_actions/create-consulta";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";

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

const NovaConsulta = () => {
  const { data: session } = useSession();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [consultaTipos, setConsultaTipos] = useState<string[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string | undefined>();
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm({ defaultValues: { queixas: "" } });

  // Estado para tratamentos do usuário logado
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [selectedTratamento, setSelectedTratamento] =
    useState<Tratamento | null>(null);

  // Buscar tipos de consulta
  useEffect(() => {
    const fetchConsultaTipos = async () => {
      try {
        const response = await fetch("/api/consultas/tipoconsultas");
        if (!response.ok)
          throw new Error("Erro ao buscar os tipos de consulta");
        const tipos = await response.json();
        setConsultaTipos(tipos);
      } catch (error) {
        console.error("Erro ao buscar os tipos de consulta:", error);
        toast({
          title: "Erro ao carregar tipos de consulta.",
          status: "error",
        });
      }
    };

    fetchConsultaTipos();
  }, []);

  // Buscar profissionais da unidade selecionada
  useEffect(() => {
    const fetchProfissionais = async () => {
      if (!selectedUnidade?.id) {
        setProfissionais([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/unidadesaude?id=${encodeURIComponent(selectedUnidade.id)}`,
        );
        if (!response.ok) throw new Error("Erro ao buscar os dados da unidade");

        const unidade = await response.json();
        setProfissionais(unidade.profissionais || []);
      } catch (error) {
        console.error("Erro ao buscar os profissionais:", error);
        toast({ title: "Erro ao carregar profissionais.", status: "error" });
      }
    };

    fetchProfissionais();
  }, [selectedUnidade]);

  // Buscar tratamentos do usuário logado
  useEffect(() => {
    const fetchTratamentos = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(
          `/api/tratamento?userId=${session.user.id}`,
        );
        if (!response.ok) throw new Error("Erro ao buscar tratamentos");

        const data = await response.json();
        setTratamentos(data || []); // Garantindo que sempre será um array
      } catch (error) {
        console.error("Erro ao buscar tratamentos:", error);
      }
    };

    fetchTratamentos();
  }, [session?.user?.id]);

  return (
    <div className="p-2 md:p-5">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="w-full md:w-auto">Nova Consulta</Button>
        </SheetTrigger>
        <SheetContent className="flex h-full w-full flex-col overflow-y-auto p-3 md:p-5">
          <SheetHeader>
            <SheetTitle>Nova Consulta</SheetTitle>
          </SheetHeader>

          <Calendar
            mode="single"
            locale={ptBR}
            selected={selectedDay}
            onSelect={setSelectedDay}
            className="w-full"
          />

          {selectedDay && (
            <div className="flex flex-col gap-3 p-3 md:p-5">
              <div className="flex gap-3 overflow-auto">
                {TIME_LIST.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <input
                type="time"
                className="rounded border bg-black p-2 text-white"
                onChange={(e) => setInputValue(e.target.value)}
                value={inputValue}
              />
            </div>
          )}

          {selectedTime && (
            <ConsultaTipoSelector
              consultaTipos={consultaTipos}
              selectedTipo={selectedTipo}
              onTipoSelect={setSelectedTipo}
            />
          )}
          {selectedTipo && (
            <MenuUnidades
              onUnidadeSelect={setSelectedUnidade}
              selectedUnidade={selectedUnidade}
            />
          )}
          {selectedUnidade && (
            <MenuProfissionais
              profissionais={profissionais}
              onProfissionalSelect={setSelectedProfissional}
              selectedProfissional={selectedProfissional}
            />
          )}

          {selectedProfissional && (<MenuTratamentos
            nome=""
            userId={session?.user?.id || ""}
            tratamentos={tratamentos}
            onTratamentoSelect={setSelectedTratamento}
            selectedTratamento={selectedTratamento}
          />)}

          {selectedProfissional && (
            <Form {...form}>
              <form>
                <FormField
                  control={form.control}
                  name="queixas"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Textarea
                          placeholder="Escreva aqui as informações sobre a consulta..."
                          {...field}
                          className="mt-2 w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}

          {selectedProfissional && (
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  className="w-full"
                  onClick={() => handleSaveConsulta(selectedProfissional)}
                >
                  Salvar
                </Button>
              </SheetClose>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NovaConsulta;
