"use client";

import ConsultaTipoSelector from "@/app/_components/consultatiposelector";
import MenuUnidades from "@/app/(dashboard)/unidades/_components/menuunidades";
// CORREÇÃO: Importando 'ConsultaType' com 'T' maiúsculo.
import { Profissional, Unidade, CondicaoSaude, Consulta, ConsultaType } from "@/app/_components/types";
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
import React, { useState, useEffect, useCallback } from "react";
import MenuProfissionais from "@/app/(dashboard)/profissionais/_components/menuprofissionais";
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
import MenuCondicoes from "@/app/(dashboard)/condicoes/_Components/MenuCondicoes";
import { set } from "date-fns";
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
  // CORREÇÃO: Usando o tipo 'ConsultaType' correto.
  const [tiposConsulta, setTiposConsulta] = useState<ConsultaType[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  
  // CORREÇÃO: Usando o tipo 'ConsultaType' correto.
  const [selectedTipo, setSelectedTipo] = useState<ConsultaType | undefined>();
  const [allProfissionais, setAllProfissionais] = useState<Profissional[]>([]);
  const [filteredProfissionais, setFilteredProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [condicoesSaude, setCondicoesSaude] = useState<CondicaoSaude[]>([]);
  const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null);
  const [selectedConsultaOrigem, setSelectedConsultaOrigem] = useState<Consulta | null>(null);

  const form = useForm({ defaultValues: { queixas: "", tipoexame: "", anotacaoExame: "" } });
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);

  const logAction = useCallback(async (level: 'info' | 'warn' | 'error', message: string, details: object = {}) => {
    if (!session?.user?.id) return;
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message, details, userId: session.user.id, component: 'NovaConsultaForm' }),
      });
    } catch (logError) {
      console.error("Falha ao registrar o log no servidor:", logError);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingInitialData(true);
      try {
        const [unidadesRes, profissionaisRes, condicoesRes, consultasRes, tiposRes] = await Promise.all([
          fetch("/api/unidadesaude"),
          fetch("/api/profissionais"),
          fetch("/api/condicoes"),
          fetch("/api/consultas"),
          fetch("/api/consultas?get=tipos")
        ]);

        if (!unidadesRes.ok) throw new Error("Falha ao buscar unidades");
        if (!profissionaisRes.ok) throw new Error("Falha ao buscar profissionais");
        if (!condicoesRes.ok) throw new Error("Falha ao buscar condições de saúde");
        if (!consultasRes.ok) throw new Error("Falha ao buscar consultas");
        if (!tiposRes.ok) throw new Error("Falha ao buscar tipos de consulta");

        const unidadesData = await unidadesRes.json();
        const profissionaisData = await profissionaisRes.json();
        const condicoesData = await condicoesRes.json();
        const consultasData = await consultasRes.json();
        const tiposData = await tiposRes.json();

        if (!tiposData || tiposData.length === 0) {
          logAction('warn', 'A lista de tipos de consulta retornou vazia ou nula.');
        }

        setUnidades(unidadesData);
        setAllProfissionais(profissionaisData);
        setCondicoesSaude(condicoesData);
        setConsultas(Array.isArray(consultasData) ? consultasData : consultasData.consultas || []);
        setTiposConsulta(tiposData);
        logAction('info', 'Dados iniciais do formulário carregados com sucesso.');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        logAction('error', `Falha ao carregar dados essenciais para o formulário: ${errorMessage}`);
        toast({ title: "Erro ao carregar dados para o formulário.", variant: "destructive" });
      } finally {
        setLoadingInitialData(false);
      }
    };

    if (session?.user?.id) fetchData();
  }, [logAction, session?.user?.id]);

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
      if (consulta.unidade) setSelectedUnidade(consulta.unidade);
      else logAction('warn', 'Consulta de origem selecionada não possui unidade.', { consultaId: consulta.id });
      
      if (consulta.profissional) setSelectedProfissional(consulta.profissional);
      else logAction('warn', 'Consulta de origem selecionada não possui profissional.', { consultaId: consulta.id });
      
      if (consulta.condicaoSaude) setSelectedCondicao(consulta.condicaoSaude);
    }
  };

  const handleSaveConsulta = async () => {
    if (!selectedTipo) {
      toast({ title: "Selecione um tipo de agendamento.", variant: "destructive" });
      return;
    }

    if (selectedTipo === 'Retorno' && !selectedConsultaOrigem) {
        logAction('warn', 'Tentativa de salvar Retorno sem consulta de origem.');
        toast({ title: "Para Retorno, selecione a consulta original.", variant: "destructive" });
        return;
    }

    if (selectedTipo !== "Exame") {
        if (!selectedDay || !manualTime) {
          toast({ title: "Preencha a data e o horário para este tipo de agendamento.", variant: "destructive" });
          return;
        }

        const [hour, minute] = manualTime.split(":").map(Number);
        const newDate = set(selectedDay, { hours: hour, minutes: minute });

        const consultaData = {
          tipo: selectedTipo as ConsultaType,
          data: newDate,
          unidadeId: selectedUnidade?.id || null,
          profissionalId: selectedProfissional?.id || null,
          condicaoSaudeId: selectedCondicao?.id || null,
          queixas: form.getValues("queixas") || null,
          consultaOrigemId: selectedConsultaOrigem?.id || null,
          userId: session?.user?.id,
        };

        if (selectedTipo === "Emergencia" && (!consultaData.queixas || !consultaData.unidadeId)) {
           logAction('warn', 'Tentativa de salvar Emergência sem queixas ou unidade.', { hasQueixas: !!consultaData.queixas, hasUnidade: !!consultaData.unidadeId });
           toast({ title: "Emergência requer queixas e unidade.", variant: "destructive" });
           return;
        }
        if (["Tratamento", "Retorno"].includes(selectedTipo) && (!consultaData.condicaoSaudeId || !consultaData.profissionalId || !consultaData.unidadeId)) {
           // CORREÇÃO: Removido o 'tipo' duplicado.
           logAction('warn', 'Tentativa de salvar Tratamento/Retorno sem campos obrigatórios.', { ...consultaData });
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
             const responseData = await response.json().catch(() => null);
             const error = new Error(responseData?.error || `Erro do servidor: ${response.status} ${response.statusText}`);
             throw error;
          }
          const savedConsulta = await response.json();
          logAction('info', `Consulta do tipo '${selectedTipo}' salva com sucesso.`, { consultaId: savedConsulta.id });
          toast({ title: "Consulta salva com sucesso!" });
          if(onSaveSuccess) onSaveSuccess();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
            logAction('error', `Falha ao salvar consulta: ${errorMessage}`, { error: String(error) });
            toast({ title: "Erro ao salvar a consulta", description: "Ocorreu um problema ao salvar. Tente novamente.", variant: "destructive" });
        }

    } else { // Lógica para Exame
      const tipoExameValue = form.getValues("tipoexame");
      const anotacaoExameValue = form.getValues("anotacaoExame");
      
      if (!session?.user?.id) {
        toast({ title: "Erro de autenticação. Faça login novamente.", variant: "destructive" });
        return; 
      }

      if (!tipoExameValue || !anotacaoExameValue) {
        toast({ title: "Para Exames, o Tipo e a Anotação são obrigatórios.", variant: "destructive" });
        return;
      }

      const formData = new FormData();
      formData.append("userId", session.user.id);
      if (selectedDay && manualTime) {
        const [hour, minute] = manualTime.split(":").map(Number);
        const newDate = set(selectedDay, { hours: hour, minutes: minute });
        formData.append("dataExame", newDate.toISOString());
      }
      formData.append("tipo", tipoExameValue);
      formData.append("nome", tipoExameValue);
      formData.append("anotacao", anotacaoExameValue);
      if (selectedUnidade?.id) formData.append("unidadesId", selectedUnidade.id);
      if (selectedProfissional?.id) formData.append("profissionalId", selectedProfissional.id);
      if (selectedCondicao?.id) formData.append("condicaoSaudeId", selectedCondicao.id);
      if (selectedConsultaOrigem?.id) formData.append("consultaId", selectedConsultaOrigem.id);

      try {
        const response = await fetch("/api/exames", { method: "POST", body: formData });
        if (!response.ok) {
           const responseData = await response.json().catch(() => null);
           const error = new Error(responseData?.error || `Erro do servidor: ${response.status} ${response.statusText}`);
           throw error;
        }
        logAction('info', `Exame do tipo '${tipoExameValue}' salvo com sucesso.`);
        toast({ title: "Exame salvo com sucesso!" });
        if(onSaveSuccess) onSaveSuccess();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        logAction('error', `Falha ao salvar exame: ${errorMessage}`, { error: String(error) });
        toast({ title: "Erro ao salvar o exame", description: "Ocorreu um problema ao salvar. Tente novamente.", variant: "destructive" });
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
            
            <ConsultaTipoSelector 
              tipos={tiposConsulta} 
              loading={loadingInitialData} 
              selectedTipo={selectedTipo} 
              onTipoSelect={setSelectedTipo} 
            />
            
            {(selectedTipo === 'Retorno' || selectedTipo === 'Exame') && (
              <div className="space-y-2">
                  <Label>Consulta de Origem (Opcional)</Label>
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
