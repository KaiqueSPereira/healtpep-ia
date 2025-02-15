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
import {ptBR } from "date-fns/locale";
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
import { useSession } from "next-auth/react";
import { toast } from "@/app/_hooks/use-toast";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";
import { set } from "date-fns";
import { Consultatype } from "@prisma/client";


const NovaConsulta = () => {
  const { data: session } = useSession();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [manualTime, setManualTime] = useState<string>("");
  const [consultaTipos, setConsultaTipos] = useState<string[]>([]);
  
  const [selectedTipo, setSelectedTipo] = useState<Consultatype | undefined>();
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [selectedTratamento, setSelectedTratamento] =
    useState<Tratamento | null>(null);
  const form = useForm({ defaultValues: { queixas: "" } });

  useEffect(() => {
    const fetchConsultaTipos = async () => {
      try {
        const response = await fetch("/api/consultas/tipoconsultas");
        if (!response.ok)
          throw new Error("Erro ao buscar os tipos de consulta");
        const tipos = await response.json();
        setConsultaTipos(Array.isArray(tipos) ? tipos : []);
      } catch (error) {
        console.error("Erro ao buscar os tipos de consulta:", error);
        toast({
          title: "Erro ao carregar tipos de consulta.",
          variant: "destructive",
        });
      }
    };

    fetchConsultaTipos();
  }, []);

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
        toast({
          title: "Erro ao carregar profissionais.",
          variant: "destructive",
        });
      }
    };

    fetchProfissionais();
  }, [selectedUnidade]);

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



  const handleSaveConsulta = async() => {
    if (!selectedDay || !manualTime) return;
    const hour = Number(manualTime.split(":")[0]);
    const minute = Number(manualTime.split(":")[1]);
    const newDate = set(selectedDay, {
      minutes: minute,
      hours: hour,
    });
    const consultaData = {
      tipo: selectedTipo as Consultatype,
      data: newDate,
      unidadeId: selectedUnidade?.id || "",
      profissionalId: selectedProfissional?.id || "",
      tratamento: selectedTratamento?.id || "",
      queixas: form.getValues("queixas"),
    };
    if (
      !selectedDay ||
      !manualTime ||
      !selectedTipo ||
      !selectedUnidade ||
      !selectedProfissional ||
      !selectedTratamento
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos antes de salvar.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch("/api/consultas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consultaData),
      });

      if (!response.ok) throw new Error("Erro ao salvar a consulta");

      toast({
        title: "Sucesso",
        description: "Consulta salva com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao salvar a consulta:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a consulta.",
        variant: "destructive",
      });
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
            className="w-full"
          />

          {selectedDay && (
            <div className="flex flex-col gap-3 p-3 md:p-5">
              <input
                type="time"
                className="rounded border bg-black p-2 text-white"
                onChange={(e) => setManualTime(e.target.value)}
                value={manualTime}
              />
            </div>
          )}

          {manualTime && (
            <div className="grid grid-cols-2 gap-4">
              <ConsultaTipoSelector
                consultaTipos={consultaTipos}
                selectedTipo={selectedTipo}
                onTipoSelect={setSelectedTipo}
              />
            </div>
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
          {selectedProfissional && (
            <MenuTratamentos
              tratamentos={tratamentos}
              onTratamentoSelect={setSelectedTratamento}
              selectedTratamento={selectedTratamento}
            />
          )}

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
                <Button className="w-full" onClick={handleSaveConsulta}>
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
