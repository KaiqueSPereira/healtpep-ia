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
import React, { useState, useEffect } from "react";
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
import { useSession } from "next-auth/react";
import { toast } from "@/app/_hooks/use-toast";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";
import { set } from "date-fns";
type Consultatype = "Emergencia" | "Rotina" | "Tratamento" | "Retorno" | "Exame";
import { Input } from "@/app/_components/ui/input";

const NovaConsulta = () => {
  const { data: session } = useSession();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [manualTime, setManualTime] = useState<string>("");

  const [selectedTipo, setSelectedTipo] = useState<Consultatype | undefined>();
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [selectedTratamento, setSelectedTratamento] =
    useState<Tratamento | null>(null);
  const form = useForm({ defaultValues: { queixas: "", tipoexame: "" } });

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
        toast("Erro ao carregar profissionais.", "error", { duration: 5000 });
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
        setTratamentos(data || []);
      } catch (error) {
        console.error("Erro ao buscar tratamentos:", error);
        toast("Erro ao carregar tratamentos.", "error", { duration: 5000 });
      }
    };

    fetchTratamentos();
  }, [session?.user?.id]);

  // 📌 Função para salvar a consulta
  const handleSaveConsulta = async () => {
    if (!selectedDay || !manualTime || !selectedTipo) {
      console.error("Preencha a data, horário e tipo da consulta.");
      toast("Preencha a data, horário e tipo da consulta.", "error", { duration: 5000 });
      return;
    }
    const [hour, minute] = manualTime.split(":").map(Number);
    const newDate = set(selectedDay, { hours: hour, minutes: minute });

    const consultaData = {
      tipo: selectedTipo as Consultatype,
      data: newDate,
      unidadeId: selectedUnidade?.id || null,
      profissionalId: selectedProfissional?.id || null,
      tratamentoId: selectedTratamento?.id || null,
      ...(selectedTipo !== "Exame" && {queixas: form.getValues("queixas") || null}),
      ...(selectedTipo === "Exame" && {tipoexame: form.getValues("tipoexame") || null}),
    
    };

    // 📌 Validação específica por tipo de consulta
    if (
      selectedTipo === "Emergencia" &&
      (!consultaData.queixas || !consultaData.unidadeId)
    ) {
      console.error("Emergência requer queixas e unidade.");
        toast("Emergência requer queixas e unidade.", "error", { duration: 5000 });
      return;
    }
    if (
      ["Rotina", "Tratamento", "Retorno"].includes(selectedTipo) &&
      (!consultaData.tratamentoId ||
        !consultaData.profissionalId ||
        !consultaData.unidadeId)
    ) {
      console.error("Consultas requerem tratamento, profissional e unidade.");
      toast("Consultas requerem tratamento, profissional e unidade.", "error", { duration: 5000 });
      return;
    }
    if (
      selectedTipo === "Exame" &&
      (!consultaData.tratamentoId ||
        !consultaData.profissionalId ||
        !consultaData.unidadeId || 
        !consultaData.tipoexame)
    ) {
      console.error("Exames requerem tipo de exame, profissional e unidade.");
      toast("Exames requerem tipo de exame, profissional e unidade.", "error", { duration: 5000 });
      return;
    }
    console.log("Dados enviados:", JSON.stringify(consultaData, null, 2));
    try {
      const response = await fetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultaData),
      });
      console.log(JSON.stringify(consultaData, null, 2));
      if (!response.ok) throw new Error("Erro ao salvar a consulta");

      console.log("Consulta salva com sucesso!");
      toast("Consulta salva com sucesso!", "success", { duration: 5000 });
    } catch (error) {
      console.error("Erro ao salvar a consulta:", error);
      toast("Erro ao salvar a consulta.", "error", { duration: 5000 });
    }
  };

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
            className="w-full mt-2 md:mt-5"
          />

          <div className="flex flex-col gap-3 p-3 md:p-5">
            <input
              type="time"
              className="rounded border bg-black p-2 text-white"
              onChange={(e) => setManualTime(e.target.value)}
              value={manualTime}
            />
          </div>

          <ConsultaTipoSelector
            selectedTipo={selectedTipo}
            onTipoSelect={setSelectedTipo}
          />

          {selectedTipo && (
            <MenuUnidades
              onUnidadeSelect={setSelectedUnidade}
              selectedUnidade={selectedUnidade}
            />
          )}
          {selectedTipo && (
            <MenuProfissionais
              profissionais={profissionais}
              onProfissionalSelect={setSelectedProfissional}
              selectedProfissional={selectedProfissional}
            />
          )}
          {selectedTipo &&
            (selectedTipo === "Rotina" ||
              selectedTipo === "Tratamento" ||
              selectedTipo === "Retorno" ||
              selectedTipo === "Exame") && (
              <MenuTratamentos
                tratamentos={tratamentos}
                onTratamentoSelect={setSelectedTratamento}
                selectedTratamento={selectedTratamento}
              />
            )}

          {selectedTipo && 
            (selectedTipo === "Emergencia" ||
              selectedTipo === "Rotina" ||
              selectedTipo === "Tratamento" ||
              selectedTipo === "Retorno") && (
            <Form {...form}>
              <FormField
                control={form.control}
                name="queixas"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Textarea
                        placeholder="Oque te levou ao médico?"
                        {...field}
                        className="mt-2 w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          )}

          {selectedTipo && selectedTipo === "Exame" && (
            <Form {...form}>
              <FormField
                control={form.control}
                name="tipoexame"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        placeholder="Digite o tipo de exame..."
                        {...field}
                        className="mt-2 w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          )}

          <SheetFooter>
            <SheetClose asChild>
              <Button className="w-full" onClick={handleSaveConsulta}>
                Salvar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NovaConsulta;
