'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/app/_hooks/use-toast";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Textarea } from "@/app/_components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/app/_components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/app/_components/ui/command";
import { Consultatype } from "@prisma/client";
import { Check, ChevronLeftIcon, ChevronsUpDown } from "lucide-react";
import HistoricoTratamentoCard from "../../../components/HistoricoTratamentoCard";
// Importação do tipo centralizado
import { Consulta, Exame, Profissional, Unidade, CondicaoSaude, TimelineItem } from "@/app/_components/types"; 
import ConsultaPageSkeleton from "../../../components/ConsultaPageSkeleton";
import { ConsultaData, HistoricoTratamentoItem, ExameComRelacoes } from "../../../types";
import MenuConsultas from "../../../components/menuconsultas";
import MenuExames from "@/app/(dashboard)/exames/components/MenuExames";
import MenuProfissionais from "@/app/(dashboard)/profissionais/_components/menuprofissionais";
import MenuUnidades from "@/app/(dashboard)/unidades/_components/menuunidades";
import MenuCondicoes from "@/app/(dashboard)/condicoes/_Components/MenuCondicoes";

// Tipos
interface FormData {
  tipo: Consultatype;
  motivo: string;
}

interface ConsultaUpdatePayload {
    tipo: Consultatype;
    motivo: string;
    data: string;
    profissionalId: string | null;
    unidadeId: string | null;
    consultaOrigemId: string | null;
    condicoes?: { set: { id: string }[] };
}

interface ConsultaPageProps {
  params: { id: string };
}

// Selector de Tipo de Consulta
const TipoConsultaSelector = ({ selectedTipo, onSelect }: { selectedTipo: string; onSelect: (tipo: Consultatype) => void }) => {
    const [open, setOpen] = useState(false);
    const tiposConsulta = Object.values(Consultatype);
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedTipo || "Selecione o Tipo..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandList>
              <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
              <CommandGroup>
                {tiposConsulta.map((tipo) => (
                  <CommandItem key={tipo} value={tipo} onSelect={() => { onSelect(tipo); setOpen(false); }}>
                    <Check className={`mr-2 h-4 w-4 ${selectedTipo === tipo ? "opacity-100" : "opacity-0"}`} />
                    {tipo}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

const UpdateConsulta = ({ params }: ConsultaPageProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [consulta, setConsulta] = useState<ConsultaData | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data states
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [allConsultas, setAllConsultas] = useState<Consulta[]>([]);
  const [allExames, setAllExames] = useState<Exame[]>([]);
  const [allCondicoes, setAllCondicoes] = useState<CondicaoSaude[]>([]);

  // Selection states
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [selectedConsultaOrigem, setSelectedConsultaOrigem] = useState<Consulta | null>(null);
  const [selectedExame, setSelectedExame] = useState<Exame | null>(null);
  const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responses = await Promise.all([
            fetch(`/api/consultas/${params.id}`),
            fetch("/api/profissionais"),
            fetch("/api/unidadesaude"),
            fetch("/api/consultas?get=all"),
            fetch("/api/exames?forMenu=true"),
            fetch("/api/condicoes"),
        ]);

        for (const response of responses) {
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Erro de rede ou resposta inválida." }));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }
        }

        const [consultaData, profData, unidadesData, allConsultasData, allExamesData, allCondicoesData] = await Promise.all(responses.map(res => res.json()));

        if (Array.isArray(profData)) setProfissionais(profData);
        if (Array.isArray(unidadesData)) setUnidades(unidadesData);
        if (Array.isArray(allConsultasData)) setAllConsultas(allConsultasData);
        if (Array.isArray(allExamesData)) setAllExames(allExamesData);
        if (Array.isArray(allCondicoesData)) setAllCondicoes(allCondicoesData);

        if (consultaData && typeof consultaData === 'object' && !Array.isArray(consultaData)) {
            setConsulta(consultaData);
            setFormData({
              tipo: consultaData.tipo as Consultatype,
              motivo: consultaData.motivo || "",
            });
            const dataObj = new Date(consultaData.data);
            setDate(dataObj.toISOString().split("T")[0]);
            setTime(dataObj.toTimeString().slice(0, 5));
  
            if (consultaData.profissional && Array.isArray(profData)) {
              setSelectedProfissional(profData.find(p => p.id === consultaData.profissional?.id) || null);
            }
            if (consultaData.unidade && Array.isArray(unidadesData)) {
              setSelectedUnidade(unidadesData.find(u => u.id === consultaData.unidade?.id) || null);
            }
            if (consultaData.consultaOrigem) {
              setSelectedConsultaOrigem(consultaData.consultaOrigem as Consulta);
            }
            if (consultaData.condicoes && consultaData.condicoes.length > 0 && Array.isArray(allCondicoesData)) {
                const linkedCondicao = allCondicoesData.find(c => c.id === consultaData.condicoes[0].id);
                if(linkedCondicao) setSelectedCondicao(linkedCondicao);
            }
            if (Array.isArray(allExamesData)) {
                const linkedExame = allExamesData.find(ex => ex.consultaId === params.id);
                if (linkedExame) setSelectedExame(linkedExame);
            }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        toast({ title: "Erro ao carregar dados.", description: errorMessage, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const timelineUnificada: TimelineItem[] = useMemo(() => {
    if (!consulta) return [];
    
    const consultas: TimelineItem[] = (consulta.historicoTratamento || [])
        .filter(item => !!item.data)
        .map((item: HistoricoTratamentoItem) => ({
            id: item.id,
            data: item.data, 
            tipo: item.tipo,
            motivo: item.motivo,
            profissional: item.profissional,
            unidade: item.unidade,
            entryType: 'consulta',
            href: `/consulta/${item.id}`
        }));

    const isRetorno = !!consulta.consultaOrigem;
    const examesDoContexto = isRetorno ? consulta.consultaOrigem?.Exame || [] : consulta.Exame || [];

    const exames: TimelineItem[] = examesDoContexto
        .filter((exame: ExameComRelacoes) => !!exame.dataExame)
        .map((exame: ExameComRelacoes) => ({
            id: exame.id,
            data: exame.dataExame!,
            tipo: exame.tipo || 'Exame',
            motivo: 'Solicitação de Exame',
            anotacao: exame.anotacao,
            profissional: exame.profissional,
            unidade: exame.unidades,
            entryType: 'exame',
            href: `/exames/${exame.id}`
        }));

    const todosOsItens = [...consultas, ...exames];
    todosOsItens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    return todosOsItens;
}, [consulta]);

  const handleUpdateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleTipoChange = (newTipo: Consultatype) => {
    handleUpdateField('tipo', newTipo);
    if (newTipo !== Consultatype.Retorno) {
        setSelectedConsultaOrigem(null);
    }
  };

  const linkExameToConsulta = async (exameId: string | null, consultaId: string) => {
    try {
      const res = await fetch(`/api/exames/${exameId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consultaId }) });
      if (!res.ok) throw new Error('Falha ao vincular exame.');
      toast({ title: "Exame vinculado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao vincular exame.", variant: 'destructive' });
      console.error(error);
    }
  };
  
  const unlinkExameFromConsulta = async (exameId: string) => {
    try {
      const res = await fetch(`/api/exames/${exameId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consultaId: null }) });
      if (!res.ok) throw new Error('Falha ao desvincular exame.');
      toast({ title: "Exame desvinculado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao desvincular exame.", variant: 'destructive' });
      console.error(error);
    }
  };

  const handleExameSelect = async (exame: Exame | null) => {
    const currentConsultaId = params.id;
    const oldExameId = selectedExame?.id;
    if (oldExameId && oldExameId !== exame?.id) {
      await unlinkExameFromConsulta(oldExameId);
    }
    if (exame) {
      await linkExameToConsulta(exame.id, currentConsultaId);
      setSelectedExame(exame);
    } else {
      setSelectedExame(null);
    }
  };

  const handleSave = async () => {
    if (!formData || !date || !time) {
      toast({ title: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    try {
      const combinedDateTime = new Date(`${date}T${time}`);
      const payload: ConsultaUpdatePayload = {
        ...formData,
        data: combinedDateTime.toISOString(),
        profissionalId: selectedProfissional?.id || null,
        unidadeId: selectedUnidade?.id || null,
        consultaOrigemId: selectedConsultaOrigem?.id || null,
      };

      if (selectedCondicao) {
        payload.condicoes = { set: [{ id: selectedCondicao.id }] };
      } else {
        payload.condicoes = { set: [] };
      }

      const response = await fetch(`/api/consultas/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Consulta atualizada com sucesso!" });
        router.push(`/consulta/${params.id}`);
        router.refresh();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro ao atualizar consulta.", description: errorData.error, variant: "destructive" });
      }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
        toast({ title: "Erro ao salvar", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <ConsultaPageSkeleton />;
  if (!formData || !consulta) return <h1>Consulta não encontrada</h1>;

  const consultasFiltradas = Array.isArray(allConsultas) ? allConsultas.filter(c => c.id !== consulta.id) : [];

  return (
    <div className="h-full flex flex-col">
        <header className="relative w-full px-5 py-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push(`/consulta/${params.id}`)} className="absolute left-5 top-1/2 -translate-y-1/2">
                <ChevronLeftIcon className="h-6 w-6" />
                <span className="ml-2">Voltar</span>
            </Button>
            <div className="flex-1 text-center">
                <h1 className="text-xl font-semibold">Editar Consulta</h1>
            </div>
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar alterações"}
                </Button>
            </div>
        </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 space-y-6">
              <Card>
                  <CardHeader><CardTitle>Dados da Consulta</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium mb-1">Tipo de Consulta</label>
                              <TipoConsultaSelector
                                  selectedTipo={formData.tipo}
                                  onSelect={handleTipoChange}
                              />
                          </div>
                          {formData.tipo === Consultatype.Retorno && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Consulta de Origem</label>
                                <MenuConsultas
                                    consultas={consultasFiltradas} 
                                    selectedConsulta={selectedConsultaOrigem}
                                    onConsultaSelect={setSelectedConsultaOrigem}
                                />
                            </div>
                          )}
                           <div>
                              <label className="block text-sm font-medium mb-1">Condição de Saúde</label>
                              <MenuCondicoes
                                  condicoes={allCondicoes}
                                  selectedCondicao={selectedCondicao}
                                  onCondicaoSelect={setSelectedCondicao}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">Data e Hora</label>
                              <div className="flex items-center gap-2">
                                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input input-bordered w-full" />
                                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input input-bordered w-full" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">Profissional</label>
                               <MenuProfissionais 
                                profissionais={profissionais}
                                onProfissionalSelect={setSelectedProfissional}
                                selectedProfissional={selectedProfissional}
                               />
                          </div>
                          <div>
                              <label className="block text-sm font-medium mb-1">Unidade</label>
                              <MenuUnidades 
                                unidades={unidades}
                                onUnidadeSelect={setSelectedUnidade}
                                selectedUnidade={selectedUnidade}
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Registros sobre a consulta</label>
                          <Textarea
                              placeholder="Escreva aqui os dados sobre a consulta..."
                              className="w-full min-h-[150px]"
                              value={formData.motivo}
                              onChange={(e) => handleUpdateField('motivo', e.target.value)}
                          />
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="w-full lg:w-1/3 space-y-6">
               <Card>
                  <CardHeader><CardTitle>Vincular Exame de Origem</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Exame de Origem</label>
                          <MenuExames
                              exames={allExames}
                              selectedExame={selectedExame}
                              onExameSelect={handleExameSelect}
                          />
                      </div>
                  </CardContent>
              </Card>

              <HistoricoTratamentoCard 
                items={timelineUnificada}
                consultaAtualId={consulta.id}
              />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UpdateConsulta;
