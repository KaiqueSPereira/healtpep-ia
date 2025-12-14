'use client';

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Textarea } from "@/app/_components/ui/textarea";
import { toast } from "@/app/_hooks/use-toast";
import { MedicamentoComRelacoes, CondicaoSaude, Profissional, Consulta } from "@/app/_components/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FrequenciaTipo, StatusMedicamento, TipoMedicamento } from '@prisma/client';
import { useState, useEffect } from 'react';
import MenuCondicoes from "@/app/condicoes/_Components/MenuCondicoes";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/consulta/components/menuconsultas";
import { Popover, PopoverContent } from "@/app/_components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/app/_components/ui/command";
import { cn } from "@/app/_lib/utils";
import { Pill, CircleDot, Beaker, Droplets, Syringe, SprayCan, Calculator } from 'lucide-react';
import { PopoverAnchor } from "@radix-ui/react-popover";

const formasFarmaceuticas = [
  { name: 'Comprimido', icon: <Pill className="h-6 w-6 mb-1" /> },
  { name: 'Cápsula', icon: <CircleDot className="h-6 w-6 mb-1" /> },
  { name: 'Líquido', icon: <Beaker className="h-6 w-6 mb-1" /> },
  { name: 'Gotas', icon: <Droplets className="h-6 w-6 mb-1" /> },
  { name: 'Injeção', icon: <Syringe className="h-6 w-6 mb-1" /> },
  { name: 'Spray', icon: <SprayCan className="h-6 w-6 mb-1" /> },
];

const formatEnum = (text: string) => {
    if (!text) return '';
    const replaced = text.replace(/_/g, ' ');
    return replaced.charAt(0).toUpperCase() + replaced.slice(1).toLowerCase();
};

const medicamentoSchema = z.object({
  nome: z.string().min(3, { message: "O nome do medicamento deve ter no mínimo 3 caracteres." }),
  principioAtivo: z.string().optional().nullable(),
  linkBula: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().nullable(),
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  tipo: z.nativeEnum(TipoMedicamento),
  dataInicio: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Data de início inválida" }),
  dataFim: z.string().optional().nullable(),
  status: z.nativeEnum(StatusMedicamento),
  estoque: z.preprocess(val => (val === "" || val === null) ? null : Number(val), z.number().int().positive('Estoque deve ser positivo').optional().nullable()),
  quantidadeCaixa: z.preprocess(val => (val === "" || val === null) ? null : Number(val), z.number().int().optional().nullable()),
  quantidadeDose: z.preprocess(val => (val === "" || val === null) ? null : Number(val), z.number().positive('A quantidade por dose deve ser positiva').optional().nullable()),
  frequenciaNumero: z.preprocess(val => (val === "" || val === null) ? null : Number(val), z.number().int().positive('A frequência deve ser positiva').optional().nullable()),
  frequenciaTipo: z.nativeEnum(FrequenciaTipo).optional().nullable(),
  condicaoSaudeId: z.string().optional().nullable(),
  profissionalId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
});

type MedicamentoFormData = z.infer<typeof medicamentoSchema>;

interface MedicamentoFormProps {
    medicamento?: MedicamentoComRelacoes | null;
    onSave: () => void;
    condicoes: CondicaoSaude[];
    profissionais: Profissional[];
    consultas: Consulta[];
}

interface AnvisaMed {
  id: string;
  nomeComercial: string;
  principioAtivo: string;
  linkBula: string;
}

export default function MedicamentoForm({ medicamento, onSave, condicoes, profissionais, consultas }: MedicamentoFormProps) {
    const { data: session } = useSession();
    const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null);
    const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
    const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
    const [anvisaResults, setAnvisaResults] = useState<AnvisaMed[]>([]);
    const [isAnvisaLoading, setIsAnvisaLoading] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [duracaoCalculada, setDuracaoCalculada] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, setValue, watch, getValues } = useForm<MedicamentoFormData>({
        resolver: zodResolver(medicamentoSchema),
        defaultValues: {
            ...medicamento,
            dataInicio: medicamento?.dataInicio ? new Date(medicamento.dataInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dataFim: medicamento?.dataFim ? new Date(medicamento.dataFim).toISOString().split('T')[0] : ''
        }
    });
    
    const status = watch("status");
    const tipo = watch("tipo");
    const forma = watch("forma");

    // Observar campos para habilitar/desabilitar botão de cálculo
    const estoque = watch("estoque");
    const quantidadeDose = watch("quantidadeDose");
    const frequenciaNumero = watch("frequenciaNumero");
    const frequenciaTipo = watch("frequenciaTipo");
    const dataInicio = watch("dataInicio");

    const canCalculate = estoque && quantidadeDose && frequenciaNumero && frequenciaTipo && dataInicio;

    useEffect(() => {
        if (medicamento) {
            setSelectedCondicao(medicamento.condicaoSaude || null);
            setSelectedProfissional(medicamento.profissional || null);
            setSelectedConsulta(medicamento.consulta || null);
            setValue("condicaoSaudeId", medicamento.condicaoSaudeId);
            setValue("profissionalId", medicamento.profissionalId);
            setValue("consultaId", medicamento.consultaId);
        }
    }, [medicamento, setValue]);

    const triggerAnvisaSearch = async () => {
        const nome = getValues("nome");
        if (nome && nome.length >= 3) {
            setIsAnvisaLoading(true);
            setIsPopoverOpen(true);
            try {
                const res = await fetch(`/api/medicamentos/br-search?name=${encodeURIComponent(nome)}`);
                const data = await res.json();
                setAnvisaResults(data);
            } catch { setAnvisaResults([]); } finally { setIsAnvisaLoading(false); }
        }
    };

    const handleSelectAnvisaMed = (med: AnvisaMed) => {
        setValue("nome", med.nomeComercial, { shouldValidate: true });
        setValue("principioAtivo", med.principioAtivo, { shouldValidate: true });
        setValue("linkBula", med.linkBula, { shouldValidate: true });
        setIsPopoverOpen(false);
        setAnvisaResults([]);
    };

    const handleCalcularDuracao = () => {
        const { estoque, quantidadeDose, frequenciaNumero, frequenciaTipo, dataInicio } = getValues();

        if (!canCalculate) {
            toast({ title: "Campos incompletos", description: "Preencha Estoque, Dose, Frequência e Data de Início para calcular.", variant: "destructive" });
            return;
        }

        let dosesPorDia = 0;
        switch (frequenciaTipo) {
            case 'Hora': dosesPorDia = (24 / frequenciaNumero!) * quantidadeDose! ; break;
            case 'Dia': dosesPorDia = frequenciaNumero! * quantidadeDose!; break;
            case 'Semana': dosesPorDia = (frequenciaNumero! / 7) * quantidadeDose!; break;
            case 'Mes': dosesPorDia = (frequenciaNumero! / 30) * quantidadeDose!; break; // Aproximação
            default: toast({ title: "Erro no cálculo", description: "Tipo de frequência inválido.", variant: "destructive"}); return;
        }

        if (dosesPorDia <= 0) {
             toast({ title: "Erro no cálculo", description: "A frequência de uso deve ser válida.", variant: "destructive"});
             return;
        }

        const duracaoEmDias = Math.floor(estoque! / dosesPorDia);
        const dataInicioDate = new Date(dataInicio! + 'T00:00:00'); // Garante que a hora não influencie o cálculo
        const dataFimDate = new Date(dataInicioDate.setDate(dataInicioDate.getDate() + duracaoEmDias));
        const dataFimString = dataFimDate.toISOString().split('T')[0];

        setValue("dataFim", dataFimString, { shouldValidate: true });
        setDuracaoCalculada(`Duração estimada: ${duracaoEmDias} dias.`);
        toast({ title: "Cálculo realizado!", description: `A data final foi preenchida com ${dataFimString}.`});
    };

    const onSubmit = async (data: MedicamentoFormData) => {
        try {
            const method = medicamento ? 'PUT' : 'POST';
            const endpoint = medicamento ? `/api/medicamentos/${medicamento.id}` : '/api/medicamentos';
            
            const payload = { ...data, userId: session?.user.id, dataFim: data.dataFim || null };

            const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

            if (!response.ok) {
                 const errorData = await response.json();
                 const errorMessage = errorData.error || (Array.isArray(errorData) ? errorData.map(e => e.message).join(', ') : `Falha ao salvar medicamento.`);
                 throw new Error(errorMessage);
            }
            toast({ title: "Sucesso!", description: `Medicamento ${medicamento ? 'atualizado' : 'criado'} com sucesso.` });
            onSave();
        } catch (error) {
            toast({ title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido", variant: "destructive" });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1 rounded-lg bg-card text-card-foreground">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Medicamento</Label>
                        <PopoverAnchor asChild>
                             <Input id="nome" {...register("nome")} onBlur={triggerAnvisaSearch} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); triggerAnvisaSearch(); } }} autoComplete="off" />
                        </PopoverAnchor>
                        {errors.nome && <p className="text-red-500 text-sm">{errors.nome.message}</p>}
                    </div>
                     <PopoverContent className="w-[--radix-popover-anchor-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Command>
                            <CommandEmpty>{isAnvisaLoading ? "Buscando..." : "Nenhum medicamento encontrado."}</CommandEmpty>
                            {!isAnvisaLoading && anvisaResults.length > 0 && (
                                <CommandGroup heading={`${anvisaResults.length} resultados encontrados`}>
                                    {anvisaResults.map((med) => (
                                        <CommandItem key={med.id} onSelect={() => handleSelectAnvisaMed(med)} className="cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{med.nomeComercial}</span>
                                                <span className="text-xs text-muted-foreground">{med.principioAtivo}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </Command>
                    </PopoverContent>
                </Popover>
                <div>
                    <Label htmlFor="principioAtivo">Princípio Ativo</Label>
                    <Input id="principioAtivo" {...register("principioAtivo")} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="tipo">Tipo de Medicamento</Label>
                    <Select onValueChange={(value) => setValue("tipo", value as TipoMedicamento)} value={tipo}>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>{Object.values(TipoMedicamento).map(t => <SelectItem key={t} value={t}>{formatEnum(t)}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo.message}</p>}
                </div>
                <div className="space-y-2"></div>
            </div>

            <div className="space-y-2">
                <Label>Forma Farmacêutica</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {formasFarmaceuticas.map((f) => (
                        <Button key={f.name} type="button" variant="outline" onClick={() => setValue("forma", f.name, { shouldValidate: true })} className={cn("flex flex-col items-center justify-center h-20 text-center p-2", forma === f.name && "ring-2 ring-primary border-primary")}>
                            {f.icon}
                            <span className="text-xs">{f.name}</span>
                        </Button>
                    ))}
                </div>
                 {errors.forma && <p className="text-red-500 text-sm">{errors.forma.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Associar a (Opcional)</Label>
              <div className="grid grid-cols-1 gap-2">
                <MenuCondicoes condicoes={condicoes} selectedCondicao={selectedCondicao} onCondicaoSelect={(c) => {setSelectedCondicao(c); setValue('condicaoSaudeId', c?.id || null);}}/>
                <MenuProfissionais profissionais={profissionais} selectedProfissional={selectedProfissional} onProfissionalSelect={(p) => {setSelectedProfissional(p); setValue('profissionalId', p?.id || null);}} />
                <MenuConsultas consultas={consultas} selectedConsulta={selectedConsulta} onConsultaSelect={(c) => {setSelectedConsulta(c); setValue('consultaId', c?.id || null);}}/>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="dataInicio">Data de Início</Label>
                    <Input id="dataInicio" type="date" {...register("dataInicio")} />
                    {errors.dataInicio && <p className="text-red-500 text-sm">{errors.dataInicio.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="dataFim">Data de Fim (Opcional)</Label>
                    <Input id="dataFim" type="date" {...register("dataFim")} />
                </div>
            </div>

            <div>
                <Label htmlFor="posologia">Posologia / Instruções</Label>
                <Textarea id="posologia" {...register("posologia")} />
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="quantidadeDose">Quantidade por Dose</Label>
                    <Input id="quantidadeDose" type="text" inputMode="decimal" {...register("quantidadeDose")} />
                    {errors.quantidadeDose && <p className="text-red-500 text-sm">{errors.quantidadeDose.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                        <Label htmlFor="frequenciaNumero">Frequência</Label>
                        <Input id="frequenciaNumero" type="number" {...register("frequenciaNumero")} />
                         {errors.frequenciaNumero && <p className="text-red-500 text-sm">{errors.frequenciaNumero.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="frequenciaTipo">Período</Label>
                        <Select onValueChange={(value) => setValue("frequenciaTipo", value as FrequenciaTipo)} value={watch("frequenciaTipo") || undefined}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{Object.values(FrequenciaTipo).map(ft => <SelectItem key={ft} value={ft}>{formatEnum(ft)}</SelectItem>)}</SelectContent>
                        </Select>
                         {errors.frequenciaTipo && <p className="text-red-500 text-sm">{errors.frequenciaTipo.message}</p>}
                    </div>
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                 <div>
                    <Label htmlFor="estoque">Estoque Atual (unidades)</Label>
                    <Input id="estoque" type="number" {...register("estoque")} />
                    {errors.estoque && <p className="text-red-500 text-sm">{errors.estoque.message}</p>}
                </div>
                <div>
                    <Label htmlFor="quantidadeCaixa">Unidades por Caixa</Label>
                    <Input id="quantidadeCaixa" type="number" {...register("quantidadeCaixa")} />
                </div>
            </div>

             {/* --- BOTÃO DE CÁLCULO DE DURAÇÃO --- */}
            <div className="space-y-2">
                <Button type="button" onClick={handleCalcularDuracao} disabled={!canCalculate} className="w-full md:w-auto">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calcular Duração e Data Final
                </Button>
                {duracaoCalculada && <p className="text-sm text-muted-foreground pt-1">{duracaoCalculada}</p>}
            </div>

             <div>
                <Label htmlFor="linkBula">Link para a Bula</Label>
                <Input id="linkBula" {...register("linkBula")} />
                {errors.linkBula && <p className="text-red-500 text-sm">{errors.linkBula.message}</p>}
            </div>

            <div>
                <Label htmlFor="status">Status do Tratamento</Label>
                <Select onValueChange={(value) => setValue("status", value as StatusMedicamento)} value={status}>
                    <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                    <SelectContent>{Object.values(StatusMedicamento).map(s => <SelectItem key={s} value={s}>{formatEnum(s)}</SelectItem>)}</SelectContent>
                </Select>
                 {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
}
