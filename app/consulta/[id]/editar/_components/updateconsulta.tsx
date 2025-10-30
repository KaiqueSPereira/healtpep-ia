"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/app/_hooks/use-toast";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Textarea } from "@/app/_components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/app/_components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/app/_components/ui/command";
import Header from "@/app/_components/header";

import { Consultatype } from "@prisma/client";
import { Check, ChevronLeftIcon, ChevronsUpDown } from "lucide-react";

// Tipos
interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
}

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
}

interface FormData {
  tipo: Consultatype;
  profissionalId: string;
  unidadeId: string;
  motivo: string;
}

interface ConsultaPageProps {
  params: { id: string };
}

// Selectors
const TipoConsultaSelector = ({ selectedTipo, onSelect }: { selectedTipo: string; onSelect: (tipo: Consultatype) => void }) => {
  const [open, setOpen] = useState(false);
  const tiposConsulta = Object.values(Consultatype);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
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

const ProfissionalConsultaSelector = ({ selectedProfissional, onSelect, profissionais }: { selectedProfissional: string; onSelect: (id: string) => void; profissionais: Profissional[] }) => {
  const [open, setOpen] = useState(false);
  const nomeProfissional = useMemo(() => profissionais.find(p => p.id === selectedProfissional)?.nome || "Selecione um profissional...", [profissionais, selectedProfissional]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
          {nomeProfissional}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhum profissional encontrado.</CommandEmpty>
            <CommandGroup>
              {profissionais.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => { onSelect(p.id); setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${selectedProfissional === p.id ? "opacity-100" : "opacity-0"}`} />
                  {`${p.nome} - ${p.especialidade}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const UnidadeConsultaSelector = ({ selectedUnidade, onSelect, unidades }: { selectedUnidade: string; onSelect: (id: string) => void; unidades: Unidade[] }) => {
  const [open, setOpen] = useState(false);
  const nomeUnidade = useMemo(() => unidades.find(u => u.id === selectedUnidade)?.nome || "Selecione uma unidade...", [unidades, selectedUnidade]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
          {nomeUnidade}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
            <CommandGroup>
              {unidades.map((u) => (
                <CommandItem key={u.id} value={u.id} onSelect={() => { onSelect(u.id); setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${selectedUnidade === u.id ? "opacity-100" : "opacity-0"}`} />
                  {`${u.nome} - ${u.tipo}`}
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consultaRes, profRes, unidadesRes] = await Promise.all([
          fetch(`/api/consultas/${params.id}`),
          fetch("/api/profissionais"),
          fetch("/api/unidadesaude"),
        ]);

        const consultaData = await consultaRes.json();
        const profData = await profRes.json();
        const unidadesData = await unidadesRes.json();

        if (consultaData && !consultaData.error) {
          setFormData({
            tipo: consultaData.tipo,
            profissionalId: consultaData.profissional?.id || "",
            unidadeId: consultaData.unidade?.id || "",
            motivo: consultaData.motivo || "",
          });
          const dataObj = new Date(consultaData.data);
          setDate(dataObj.toISOString().split("T")[0]);
          setTime(dataObj.toTimeString().slice(0, 5));
        }

        setProfissionais(profData);
        setUnidades(unidadesData);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({ title: "Erro ao carregar dados.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleUpdateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!formData || !date || !time) {
      toast({ title: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    try {
      const combinedDateTime = new Date(`${date}T${time}`);
      const payload = {
        ...formData,
        data: combinedDateTime.toISOString(),
      };

      const response = await fetch(`/api/consultas/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Consulta atualizada com sucesso!", variant: "default" });
        router.push(`/consulta/${params.id}`);
        router.refresh();
      } else {
        const errorData = await response.json();
        toast({ title: "Erro ao atualizar consulta.", description: errorData.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <h1>Carregando...</h1>;
  if (!formData) return <h1>Consulta não encontrada</h1>;

  return (
    <div>
      <Header />
      <header className="flex items-center justify-between p-5">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/consulta/${params.id}`}>
            <ChevronLeftIcon />
          </Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </header>

      <main className="space-y-6 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Tipo de Consulta:</h2>
            <TipoConsultaSelector
              selectedTipo={formData.tipo}
              onSelect={(tipo) => handleUpdateField('tipo', tipo)}
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">Data e Hora:</h2>
            <div className="flex items-center gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border bg-transparent px-3 py-2" />
              <p>às</p>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded border bg-transparent px-3 py-2" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Profissional:</h2>
            <ProfissionalConsultaSelector
              profissionais={profissionais}
              selectedProfissional={formData.profissionalId}
              onSelect={(id) => handleUpdateField('profissionalId', id)}
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">Unidade:</h2>
            <UnidadeConsultaSelector
              unidades={unidades}
              selectedUnidade={formData.unidadeId}
              onSelect={(id) => handleUpdateField('unidadeId', id)}
            />
          </div>
        </div>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>Registros sobre a consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Escreva aqui os dados sobre a consulta..."
              className="mt-2 w-full min-h-[150px]"
              value={formData.motivo}
              onChange={(e) => handleUpdateField('motivo', e.target.value)}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UpdateConsulta;
