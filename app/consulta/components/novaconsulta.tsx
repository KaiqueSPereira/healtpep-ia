'use client';

import ConsultaTipoSelector from "@/app/_components/consultatiposelector";
import MenuUnidades from "@/app/unidades/_components/menuunidades";
import { Profissional, Unidade, CondicaoSaude } from "@/app/_components/types"; 
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
import MenuCondicoes from "@/app/condicoes/_Components/MenuCondicoes"; 
import { set } from "date-fns";
type Consultatype = "Emergencia" | "Rotina" | "Tratamento" | "Retorno" | "Exame";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Label } from "@/app/_components/ui/label";

const NovaConsulta = ({ onSaveSuccess }: { onSaveSuccess?: () => void }) => {
  const { data: session } = useSession();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [manualTime, setManualTime] = useState<string>("");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<Consultatype | undefined>();
  const [allProfissionais, setAllProfissionais] = useState<Profissional[]>([]);
  const [filteredProfissionais, setFilteredProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [condicoesSaude, setCondicoesSaude] = useState<CondicaoSaude[]>([]); // UPDATED
  const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null); // UPDATED
  const form = useForm({ defaultValues: { queixas: "", tipoexame: "", anotacaoExame: "" } });

  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);

  useEffect(() => {
    const fetchUnidades = async () => {
      if (!session?.user?.id) {
        setUnidades([]);
        return;
      }
      try {
        const response = await fetch(`/api/unidadesaude?userId=${session.user.id}`);
        if (!response.ok) throw new Error("Erro ao buscar unidades");
        const data = await response.json();
        setUnidades(data || []);
      } catch (error) {
        console.error("Erro ao buscar unidades:", error);
        toast({ title: "Erro ao carregar unidades.", variant: "destructive" });
      }
    };
    fetchUnidades();
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchAllProfissionais = async () => {
      if (!session?.user?.id) return;
      try {
        const response = await fetch(`/api/profissionais?userId=${session.user.id}`);
        if (!response.ok) throw new Error("Erro ao buscar profissionais");
        const data: Profissional[] = await response.json();
        setAllProfissionais(data || []);
      } catch (error) {
        console.error("Erro ao buscar os profissionais:", error);
        toast({ title: "Erro ao carregar profissionais.", variant: "destructive" });
      }
    };
    fetchAllProfissionais();
  }, [session?.user?.id]);

  useEffect(() => {
    if (selectedUnidade) {
      const profissionaisDaUnidade = allProfissionais.filter(p => p.unidades?.some(u => u.id === selectedUnidade.id));
      setFilteredProfissionais(profissionaisDaUnidade);
    } else {
      setFilteredProfissionais(allProfissionais);
    }
  }, [selectedUnidade, allProfissionais]);

  // Buscar Condições de Saúde (ex-Tratamentos)
  useEffect(() => {
    const fetchCondicoesSaude = async () => {
      if (!session?.user?.id) return;
      try {
        // UPDATED API endpoint
        const response = await fetch(`/api/condicoes?userId=${session.user.id}`);
        if (!response.ok) throw new Error("Erro ao buscar condições de saúde");
        const data = await response.json();
        setCondicoesSaude(data || []);
      } catch (error) {
        console.error("Erro ao buscar condições de saúde:", error);
        toast({ title: "Erro ao carregar condições de saúde.", variant: "destructive" });
      }
    };
    fetchCondicoesSaude();
  }, [session?.user?.id]);

  const handleSaveConsulta = async () => {
    if (!selectedDay || !manualTime || !selectedTipo) {
      toast({ title: "Preencha a data, horário e tipo.", variant: "destructive" });
      return;
    }

    const [hour, minute] = manualTime.split(":").map(Number);
    const newDate = set(selectedDay, { hours: hour, minutes: minute });

    if (selectedTipo !== "Exame") {
        const consultaData = {
          tipo: selectedTipo as Consultatype,
          data: newDate,
          unidadeId: selectedUnidade?.id || null,
          profissionalId: selectedProfissional?.id || null,
          condicaoSaudeId: selectedCondicao?.id || null, // UPDATED
          queixas: form.getValues("queixas") || null,
        };

        if (selectedTipo === "Emergencia" && (!consultaData.queixas || !consultaData.unidadeId)) {
           toast({ title: "Emergência requer queixas e unidade.", variant: "destructive" });
           return;
        }
        if (["Tratamento", "Retorno"].includes(selectedTipo) && (!consultaData.condicaoSaudeId || !consultaData.profissionalId || !consultaData.unidadeId)) {
           toast({ title: "Tratamento e Retorno requerem condição, profissional e unidade.", variant: "destructive" });
           return;
        }

        try {
          const response = await fetch("/api/consultas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(consultaData),
          });
          if (!response.ok) {
             const responseData = await response.json();
             throw new Error(responseData.error || "Erro ao salvar a consulta.");
          }
          toast({ title: "Consulta salva com sucesso!" });
          onSaveSuccess?.();
        } catch (error) {
          console.error("Erro ao salvar a consulta:", error);
          toast({ title: (error as Error).message, variant: "destructive" });
        }

    } else { // Lógica para Exame
      const tipoExameValue = form.getValues("tipoexame");
      const anotacaoExameValue = form.getValues("anotacaoExame");

      if (!selectedUnidade?.id || !selectedProfissional?.id || !tipoExameValue) {
        toast({ title: "Para Exames, selecione Unidade, Profissional e Tipo de Exame.", variant: "destructive" });
        return;
      }

      const formData = new FormData();
      formData.append("dataExame", newDate.toISOString());
      formData.append("tipo", tipoExameValue);
      formData.append("unidadesId", selectedUnidade.id);
      formData.append("profissionalId", selectedProfissional.id);
      if (selectedCondicao?.id) { 
        formData.append("condicaoSaudeId", selectedCondicao.id); // UPDATED
      }
      formData.append("nome", tipoExameValue);
      formData.append("anotacao", anotacaoExameValue || "");

      try {
        const response = await fetch("/api/exames", { method: "POST", body: formData });
        if (!response.ok) {
           const responseData = await response.json();
           throw new Error(responseData.error || "Erro ao salvar o exame.");
        }
        toast({ title: "Exame salvo com sucesso!" });
        onSaveSuccess?.();
      } catch (error) {
        console.error("Erro ao salvar o exame:", error);
        toast({ title: (error as Error).message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="p-2 md:p-5">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="w-full md:w-auto">Novo Agendamento</Button>
        </SheetTrigger>
        <SheetContent className="flex h-full w-full flex-col overflow-y-auto p-3 md:p-5">
          <SheetHeader><SheetTitle>Novo Agendamento</SheetTitle></SheetHeader>
          <Calendar mode="single" locale={ptBR} selected={selectedDay} onSelect={setSelectedDay} className="w-full mt-2 md:mt-5" />
          <div className="flex flex-col gap-3 p-3 md:p-5">
            <input type="time" className="rounded border bg-black p-2 text-white" onChange={(e) => setManualTime(e.target.value)} value={manualTime} />
          </div>
          <ConsultaTipoSelector selectedTipo={selectedTipo} onTipoSelect={setSelectedTipo} />
          {selectedTipo && <MenuUnidades unidades={unidades} onUnidadeSelect={(u) => { setSelectedUnidade(u); setSelectedProfissional(null); }} selectedUnidade={selectedUnidade} />}
          {selectedTipo && <MenuProfissionais profissionais={filteredProfissionais} onProfissionalSelect={setSelectedProfissional} selectedProfissional={selectedProfissional} />}
          {selectedTipo && ["Rotina", "Tratamento", "Retorno", "Exame"].includes(selectedTipo) && (
            <MenuCondicoes
              condicoes={condicoesSaude}
              onCondicaoSelect={setSelectedCondicao}
              selectedCondicao={selectedCondicao}
            />
          )}
          {selectedTipo && ["Emergencia", "Rotina", "Tratamento", "Retorno"].includes(selectedTipo) && (
            <Form {...form}>_components
              <FormField control={form.control} name="queixas" render={({ field }) => (
                <FormItem className="w-full"><FormControl><Textarea placeholder="O que te levou ao médico?" {...field} className="mt-2 w-full" /></FormControl><FormMessage /></FormItem>
              )} />
            </Form>
          )}
          {selectedTipo === "Exame" && (
            <div className="flex flex-col gap-4">
              <Form {...form}>
                <FormField control={form.control} name="tipoexame" render={({ field }) => (
                  <FormItem className="w-full">
                    <Label>Tipo de Exame</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo de exame" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Sangue">Sangue</SelectItem>
                        <SelectItem value="Urina">Urina</SelectItem>
                        <SelectItem value="USG">USG</SelectItem>
                        <SelectItem value="Raio-X">Raio-X</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="anotacaoExame" render={({ field }) => (
                  <FormItem className="w-full">
                    <Label>Anotação do Exame</Label>
                    <FormControl><Textarea placeholder="Adicione anotações sobre o exame..." {...field} className="mt-2 w-full" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Form>
            </div>
          )}
          <SheetFooter>
            <SheetClose asChild><Button className="w-full" onClick={handleSaveConsulta}>Salvar</Button></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NovaConsulta;
