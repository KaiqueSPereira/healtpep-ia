'use client';

import ConsultaTipoSelector from "@/app/_components/consultatiposelector";
import MenuUnidades from "@/app/unidades/_components/menuunidades";
import { Profissional, Unidade, CondicaoSaude, Consulta } from "@/app/_components/types";
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
import MenuConsultas from "./menuconsultas";
import { useSession } from "next-auth/react";

const NovaConsulta = ({ onSaveSuccess }: { onSaveSuccess?: () => void }) => {
  const { data: session } = useSession();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [manualTime, setManualTime] = useState<string>("");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<Consultatype | undefined>();
  const [allProfissionais, setAllProfissionais] = useState<Profissional[]>([]);
  const [filteredProfissionais, setFilteredProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [condicoesSaude, setCondicoesSaude] = useState<CondicaoSaude[]>([]);
  const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null);
  const [selectedConsultaOrigem, setSelectedConsultaOrigem] = useState<Consulta | null>(null);

  const form = useForm({ defaultValues: { queixas: "", tipoexame: "", anotacaoExame: "" } });
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unidadesRes, profissionaisRes, condicoesRes, consultasRes] = await Promise.all([
          fetch("/api/unidades"),
          fetch("/api/profissionais"),
          fetch("/api/condicoessaude"),
          fetch("/api/consultas"),
        ]);

        if (!unidadesRes.ok) throw new Error("Falha ao buscar unidades");
        if (!profissionaisRes.ok) throw new Error("Falha ao buscar profissionais");
        if (!condicoesRes.ok) throw new Error("Falha ao buscar condições de saúde");
        if (!consultasRes.ok) throw new Error("Falha ao buscar consultas");

        const unidadesData = await unidadesRes.json();
        const profissionaisData = await profissionaisRes.json();
        const condicoesData = await condicoesRes.json();
        const consultasData = await consultasRes.json();

        setUnidades(unidadesData);
        setAllProfissionais(profissionaisData);
        setCondicoesSaude(condicoesData);
        setConsultas(Array.isArray(consultasData) ? consultasData : consultasData.consultas || []);

      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
        toast({
          title: "Erro ao carregar dados",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUnidade) {
      const profissionaisFiltrados = allProfissionais.filter(profissional => 
        profissional.unidades?.some(unidade => unidade.id === selectedUnidade.id)
      );
      setFilteredProfissionais(profissionaisFiltrados);
    } else {
      setFilteredProfissionais(allProfissionais);
    }
    setSelectedProfissional(null);
  }, [selectedUnidade, allProfissionais]);

  const handleConsultaOrigemSelect = (consulta: Consulta | null) => {
    setSelectedConsultaOrigem(consulta);
    if (consulta) {
      if (consulta.unidade) {
        setSelectedUnidade(consulta.unidade);
      }
      if (consulta.profissional) {
        setSelectedProfissional(consulta.profissional);
      }
      if (consulta.condicaoSaude) {
          setSelectedCondicao(consulta.condicaoSaude);
      }
    }
  };

  const handleSaveConsulta = async () => {
    if (!selectedDay || !manualTime || !selectedTipo) {
      toast({ title: "Preencha a data, horário e tipo.", variant: "destructive" });
      return;
    }

    if (selectedTipo === 'Retorno' && !selectedConsultaOrigem) {
        toast({ title: "Para Retorno, selecione a consulta original.", variant: "destructive" });
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
          condicaoSaudeId: selectedCondicao?.id || null,
          queixas: form.getValues("queixas") || null,
          consultaOrigemId: selectedConsultaOrigem?.id || null,
          userId: session?.user?.id,
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
      
      // DEBUG: Log para verificar o ID do usuário
      console.log("Tentando salvar exame. ID do usuário da sessão:", session?.user?.id);

      if (!selectedUnidade?.id || !selectedProfissional?.id || !tipoExameValue) {
        toast({ title: "Para Exames, selecione Unidade, Profissional e Tipo de Exame.", variant: "destructive" });
        return;
      }

      const formData = new FormData();
      
      if (session?.user?.id) {
        formData.append("userId", session.user.id);
      } else {
        // Se o ID não existir, pare a execução e avise o usuário.
        toast({ title: "Erro de autenticação: ID de usuário não encontrado. Faça login novamente.", variant: "destructive" });
        return; 
      }
      
      formData.append("dataExame", newDate.toISOString());
      formData.append("tipo", tipoExameValue);
      formData.append("unidadesId", selectedUnidade.id);
      formData.append("profissionalId", selectedProfissional.id);
      if (selectedCondicao?.id) {
        formData.append("condicaoSaudeId", selectedCondicao.id);
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
        toast({ title: `Erro ao salvar o exame: ${(error as Error).message}`, variant: "destructive" });
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
          <div className="space-y-4 flex-1 pr-2 overflow-y-auto">
            <Calendar mode="single" locale={ptBR} selected={selectedDay} onSelect={setSelectedDay} className="w-full mt-2 md:mt-5" />
            <div className="flex flex-col gap-3">
              <input type="time" className="rounded border bg-background p-2 text-foreground w-full" onChange={(e) => setManualTime(e.target.value)} value={manualTime} />
            </div>
            <ConsultaTipoSelector selectedTipo={selectedTipo} onTipoSelect={setSelectedTipo} />
            
            {selectedTipo === 'Retorno' && (
              <div className="space-y-2">
                  <Label>Consulta de Origem</Label>
                  <MenuConsultas 
                    consultas={consultas}
                    onConsultaSelect={handleConsultaOrigemSelect}
                    selectedConsulta={selectedConsultaOrigem}
                  />
              </div>
            )}

            {selectedTipo && <MenuUnidades unidades={unidades} onUnidadeSelect={setSelectedUnidade} selectedUnidade={selectedUnidade} />}
            {selectedTipo && <MenuProfissionais profissionais={filteredProfissionais} onProfissionalSelect={setSelectedProfissional} selectedProfissional={selectedProfissional} />}
            
            {selectedTipo && ["Rotina", "Tratamento", "Retorno", "Exame"].includes(selectedTipo) && (
                <MenuCondicoes
                condicoes={condicoesSaude}
                onCondicaoSelect={setSelectedCondicao}
                selectedCondicao={selectedCondicao}
                />
            )}

            {selectedTipo && ["Emergencia", "Rotina", "Tratamento", "Retorno"].includes(selectedTipo) && (
                <Form {...form}>
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
          </div>
          
          <SheetFooter className="mt-4">
            <SheetClose asChild><Button className="w-full" onClick={handleSaveConsulta}>Salvar</Button></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NovaConsulta;
