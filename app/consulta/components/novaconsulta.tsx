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
  const [allProfissionais, setAllProfissionais] = useState<Profissional[]>([]); // Lista completa de profissionais
  const [filteredProfissionais, setFilteredProfissionais] = useState<Profissional[]>([]); // Lista filtrada de profissionais
  const [selectedProfissional, setSelectedProfissional] =
    useState<Profissional | null>(null);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [selectedTratamento, setSelectedTratamento] =
    useState<Tratamento | null>(null);
  const form = useForm({ defaultValues: { queixas: "", tipoexame: "", anotacaoExame: "" } });

  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);

  // Buscar unidades do usuário logado
  useEffect(() => {
    const fetchUnidades = async () => {
      if (!session?.user?.id) {
        setUnidades([]);
        return;
      }

      console.log("Fetching units for user:", session.user.id);

      try {
        const response = await fetch(
          `/api/unidadesaude?userId=${session.user.id}`
        );
        if (!response.ok) throw new Error("Erro ao buscar unidades");

        const data = await response.json();
        console.log("Units fetched:", data);
        setUnidades(data || []);
      } catch (error) {
        console.error("Erro ao buscar unidades:", error);
        toast({
          title: "Erro ao carregar unidades.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    fetchUnidades();
  }, [session?.user?.id]);

  // Buscar TODOS os profissionais do usuário logado
  useEffect(() => {
    const fetchAllProfissionais = async () => { // Renomeado aqui
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/profissional?userId=${session.user.id}`);
        if (!response.ok) throw new Error("Erro ao buscar profissionais");
        const data: Profissional[] = await response.json();
        setAllProfissionais(data || []); // Armazena na lista completa
      } catch (error) {
        console.error("Erro ao buscar os profissionais:", error);
        toast({
          title: "Erro ao carregar profissionais.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    fetchAllProfissionais(); // Chamada com o novo nome
  }, [session?.user?.id]);

  // Filtrar profissionais com base na unidade selecionada
  useEffect(() => {
    if (selectedUnidade) {
      const profissionaisDaUnidade = allProfissionais.filter(profissional =>
        // Verifica se o profissional tem alguma unidade cujo ID coincide com o da unidade selecionada
        profissional.unidades.some(unidade => unidade.id === selectedUnidade.id)
      );
      setFilteredProfissionais(profissionaisDaUnidade);
    } else {
      // Se nenhuma unidade estiver selecionada, mostre todos os profissionais
      setFilteredProfissionais(allProfissionais);
    }
     // Ao mudar a unidade selecionada, resetar o profissional selecionado
     // Isso é feito no onUnidadeSelect agora
     // setSelectedProfissional(null); // Removido daqui
  }, [selectedUnidade, allProfissionais]); // Depende da unidade selecionada e da lista completa de profissionais

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

      } catch (error) { // Adicionado o catch block que faltava
        console.error("Erro ao buscar tratamentos:", error);
        toast({
          title: "Erro ao carregar tratamentos.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    fetchTratamentos(); // Chamada correta para buscar tratamentos
  }, [session?.user?.id]);

  // 📌 Função para salvar a consulta
  const handleSaveConsulta = async () => {
    // --- Validação inicial comum ---
    if (!selectedDay || !manualTime || !selectedTipo) {
      toast({
        title: "Preencha a data, horário e tipo da consulta/exame.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    // --- Fim da validação inicial comum ---

    const [hour, minute] = manualTime.split(":").map(Number);
    const newDate = set(selectedDay, { hours: hour, minutes: minute });

    // --- Lógica e Validação para outros tipos de consulta ---
    if (selectedTipo !== "Exame") {
        const consultaData = {
          tipo: selectedTipo as Consultatype,
          data: newDate,
          unidadeId: selectedUnidade?.id || null,
          profissionalId: selectedProfissional?.id || null,
          tratamentoId: selectedTratamento?.id || null,
          queixas: form.getValues("queixas") || null, // Queixas apenas para outros tipos
        };

       // Validação específica para outros tipos
        if (selectedTipo === "Emergencia" && (!consultaData.queixas || !consultaData.unidadeId)) {
           toast({ title: "Emergência requer queixas e unidade.", variant: "destructive", duration: 5000 });
           return;
        }
        if (["Tratamento", "Retorno"].includes(selectedTipo) && (!consultaData.tratamentoId || !consultaData.profissionalId || !consultaData.unidadeId)) {
           toast({ title: "Tratamento e Retorno requerem tratamento, profissional e unidade.", variant: "destructive", duration: 5000 });
           return;
        }

        // --- Envio para API de Consultas ---
        console.log("Dados enviados para consultas:", JSON.stringify(consultaData, null, 2));
        try {
          const response = await fetch("/api/consultas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(consultaData),
          });

          console.log("Status da Resposta (Consulta):", response.status);
          const responseData = await response.json();
          console.log("Resposta (Consulta):", responseData);


          if (!response.ok) {
             const errorMsg = responseData.error || "Erro ao salvar a consulta.";
             console.error(`Erro ao salvar a consulta: ${errorMsg}`);
             toast({
               title: errorMsg,
               variant: "destructive",
               duration: 5000,
             });
             return;
          }

          console.log("Consulta salva com sucesso!");
          toast({
            title: "Consulta salva com sucesso!",
            variant: "default",
            duration: 5000,
          });
 onSaveSuccess?.(); // Chamar callback de sucesso

        } catch (error) {
          console.error("Erro geral ao salvar a consulta:", error);
          toast({
            title: "Erro ao salvar a consulta.",
            variant: "destructive",
            duration: 5000,
          });
        }
      // --- Fim Envio para API de Consultas ---


    } else if (selectedTipo === "Exame") { // --- Lógica e Validação para Exame ---
      const tipoExameValue = form.getValues("tipoexame");
      const anotacaoExameValue = form.getValues("anotacaoExame");


      if (!selectedUnidade?.id || !selectedProfissional?.id || !tipoExameValue) {
        toast({
          title: "Para Exames, selecione Unidade, Profissional e Tipo de Exame.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      console.log("Debug - selectedUnidade:", selectedUnidade);
      console.log("Debug - selectedUnidade?.id:", selectedUnidade?.id);
      console.log("Debug - selectedProfissional:", selectedProfissional); // Mantido objeto completo para debug
      console.log("Debug - selectedProfissional?.id:", selectedProfissional?.id);
      console.log("Debug - tipoExameValue:", tipoExameValue);


      const formData = new FormData();
      formData.append("dataExame", newDate.toISOString());
      formData.append("tipo", "Exame"); // Tipo fixo como "Exame" para a API

      // Verificações e adição ao FormData
      if (selectedUnidade?.id) {
        formData.append("unidadesId", selectedUnidade.id);
      } else {
         console.error("Erro: selectedUnidade ou selectedUnidade.id é undefined/null ao construir FormData para Exame.");
         toast({
           title: "Erro interno: dados da unidade ausentes.",
           variant: "destructive",
           duration: 5000,
         });
         return; // Interrompe se a unidade for nula aqui
      }

      if (selectedProfissional?.id) {
        formData.append("profissionalId", selectedProfissional.id);
      } else {
          console.error("Erro: selectedProfissional ou selectedProfissional.id é undefined/null ao construir FormData para Exame.");
          toast({
            title: "Erro interno: dados do profissional ausentes.",
            variant: "destructive",
            duration: 5000,
          });
          return; // Interrompe se o profissional for nulo aqui
      }

      if (selectedTratamento?.id) { // Tratamento é opcional para Exame no seu schema
        formData.append("tratamentoId", selectedTratamento.id);
      }
      formData.append("nome", tipoExameValue); // Mapeia o tipo do select para \'nome\' na API de exames
      formData.append("anotacao", anotacaoExameValue || ""); // Adiciona a nova anotação

      // --- Envio para API de Exames ---
      try {
        const response = await fetch("/api/exames", { method: "POST", body: formData });

        console.log("Status da Resposta (Exame):", response.status);
        const responseData = await response.json();
        console.log("Resposta (Exame):", responseData);

        if (!response.ok) {
           const errorMsg = responseData.error || "Erro ao salvar o exame.";
           console.error(`Erro ao salvar o exame: ${errorMsg}`);
           toast({
             title: errorMsg,
             variant: "destructive",
             duration: 5000,
           });
           return;
        }

        console.log("Exame salvo com sucesso!");
        toast({
          title: "Exame salvo com sucesso!",
          variant: "default",
          duration: 5000,
        });
 onSaveSuccess?.(); // Chamar callback de sucesso

      } catch (error) {
        console.error("Erro geral ao salvar o exame:", error);
        toast({
          title: "Erro ao salvar o exame.",
          variant: "destructive",
          duration: 5000,
        });
      }
      // --- Fim Envio para API de Exames ---
    }


    // Limpar formulário ou fechar sheet se necessário
    // form.reset(); // Considerar se deseja resetar
    // setSelectedDay(undefined);
    // setManualTime("");
    // setSelectedTipo(undefined);
    // setSelectedUnidade(null);
    // setSelectedProfissional(null);
    // setSelectedTratamento(null);

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
              unidades={unidades}
              onUnidadeSelect={(unidade) => {
                setSelectedUnidade(unidade);
                setSelectedProfissional(null); // Resetar profissional ao mudar a unidade
              }}
              selectedUnidade={selectedUnidade}
            />
          )}
          {selectedTipo && (
            <MenuProfissionais
              profissionais={filteredProfissionais} // Usando a lista filtrada
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
                        placeholder="Oque te levou ao médico???"
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
          {/* Novos campos para Exame */}
          {selectedTipo === "Exame" && (
              <div className="flex flex-col gap-4">
                   <Form {...form}>
                       {/* Campo para selecionar o tipo de exame */}
                      <FormField
                          control={form.control}
                          name="tipoexame"
                          render={({ field }) => (
                              <FormItem className="w-full">
                                  <Label>Tipo de Exame</Label>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder="Selecione o tipo de exame" />
                                          </SelectTrigger>
                                      </FormControl>
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
                          )}
                      />
                      {/* Campo para Anotação do Exame */}
                       <FormField
                          control={form.control}
                          name="anotacaoExame" // Novo nome para a anotação do exame
                          render={({ field }) => (
                              <FormItem className="w-full">
                                  <Label>Anotação do Exame</Label> {/* Label para a anotação */}
                                  <FormControl>
                                      <Textarea
                                          placeholder="Adicione anotações sobre o exame..."
                                          {...field}
                                          className="mt-2 w-full"
                                      />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </Form>
              </div>
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
