'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/app/_components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { cn } from "@/app/_lib/utils";
import { CalendarIcon, Loader2, Trash } from "lucide-react";
import { Calendar } from "@/app/_components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { toast } from "@/app/_hooks/use-toast";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { useSession } from "next-auth/react";
import { Profissional, Consulta, CondicaoSaude, MedicamentoComRelacoes } from "@/app/_components/types";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/consulta/components/menuconsultas";
import MenuCondicoes from "@/app/condicoes/_Components/MenuCondicoes";

const TipoMedicamento = { Uso_Continuo: 'Uso_Continuo', Tratamento_Clinico: 'Tratamento_Clinico', Esporadico: 'Esporadico' } as const;
const FrequenciaTipo = { Hora: 'Hora', Dia: 'Dia', Semana: 'Semana', Mes: 'Mes' } as const;
const StatusMedicamento = { Ativo: 'Ativo', Concluido: 'Concluido', Suspenso: 'Suspenso' } as const;

const formSchema = z.object({
    nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
    principioAtivo: z.string().optional(),
    linkBula: z.string().url().optional().or(z.literal('')), 
    posologia: z.string().optional(),
    forma: z.string().optional(),
    tipo: z.nativeEnum(TipoMedicamento, { required_error: "O tipo é obrigatório." }),
    dataInicio: z.date({ required_error: "A data de início é obrigatória." }),
    dataFim: z.date().optional(),
    status: z.nativeEnum(StatusMedicamento, { required_error: "O status é obrigatório." }),
    estoque: z.coerce.number().min(0).optional(),
    quantidadeCaixa: z.coerce.number().min(0).optional(),
    quantidadeDose: z.coerce.number().min(0).optional(),
    frequenciaNumero: z.coerce.number().min(0).optional(),
    frequenciaTipo: z.nativeEnum(FrequenciaTipo).optional(),
    profissionalId: z.string().optional(),
    consultaId: z.string().optional(),
    condicaoSaudeId: z.string().optional(),
});

type MedicamentoFormData = z.infer<typeof formSchema>;

interface MedicamentoFormProps {
    onSave: () => void; 
    medicamento?: MedicamentoComRelacoes | null;
}

export default function MedicamentoForm({ onSave, medicamento }: MedicamentoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { data: session } = useSession();
    const isEditMode = !!medicamento;

    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [consultas, setConsultas] = useState<Consulta[]>([]);
    const [condicoesSaude, setCondicoesSaude] = useState<CondicaoSaude[]>([]);

    const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
    const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
    const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null);

    const form = useForm<MedicamentoFormData>({ 
        resolver: zodResolver(formSchema), 
        defaultValues: { 
            nome: "", 
            principioAtivo: "", 
            linkBula: "", 
            tipo: TipoMedicamento.Esporadico, 
            status: StatusMedicamento.Ativo 
        } 
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user?.id) return;
            try {
                const [profissionaisRes, condicoesRes, consultasRes] = await Promise.all([
                    fetch('/api/profissionais'),
                    fetch('/api/condicoessaude'),
                    fetch('/api/consultas')
                ]);

                if (profissionaisRes.ok) setProfissionais(await profissionaisRes.json());
                if (condicoesRes.ok) setCondicoesSaude(await condicoesRes.json());
                if (consultasRes.ok) {
                    const data = await consultasRes.json();
                    setConsultas(Array.isArray(data) ? data : data.consultas || []);
                }
            } catch {
                toast({ title: "Erro ao carregar dados", description: "Não foi possível carregar informações para os menus.", variant: "destructive" });
            }
        };
        fetchData();
    }, [session]);

    useEffect(() => {
         const resetValues = (med: MedicamentoComRelacoes | null) => {
            const isEditing = !!med;
            form.reset({
                nome: isEditing ? med.nome : "",
                principioAtivo: isEditing ? med.principioAtivo ?? undefined : "",
                linkBula: isEditing ? med.linkBula ?? undefined : "",
                posologia: isEditing ? med.posologia ?? undefined : undefined,
                forma: isEditing ? med.forma ?? undefined : undefined,
                tipo: isEditing ? med.tipo : TipoMedicamento.Esporadico,
                dataInicio: isEditing ? new Date(med.dataInicio) : new Date(),
                dataFim: isEditing && med.dataFim ? new Date(med.dataFim) : undefined,
                status: isEditing ? med.status : StatusMedicamento.Ativo,
                estoque: isEditing ? med.estoque ?? undefined : undefined,
                quantidadeCaixa: isEditing ? med.quantidadeCaixa ?? undefined : undefined,
                quantidadeDose: isEditing ? med.quantidadeDose ?? undefined : undefined,
                frequenciaNumero: isEditing ? med.frequenciaNumero ?? undefined : undefined,
                frequenciaTipo: isEditing ? med.frequenciaTipo ?? undefined : undefined,
                profissionalId: isEditing ? med.profissionalId ?? undefined : undefined,
                consultaId: isEditing ? med.consultaId ?? undefined : undefined,
                condicaoSaudeId: isEditing ? med.condicaoSaudeId ?? undefined : undefined,
            });
            setSelectedProfissional(isEditing ? med.profissional ?? null : null);
            const consultaComDataCorrigida = isEditing && med.consulta ? { ...med.consulta, data: new Date(med.consulta.data) } : null;
            setSelectedConsulta(consultaComDataCorrigida);
            setSelectedCondicao(isEditing ? med.condicaoSaude ?? null : null);
        };

        resetValues(medicamento ?? null);
    }, [medicamento, form]);

    async function onSubmit(values: MedicamentoFormData) {
        setIsSubmitting(true);
        try {
            const url = isEditMode && medicamento ? `/api/medicamentos/${medicamento.id}` : '/api/medicamentos';
            const method = isEditMode ? 'PATCH' : 'POST';
            const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o medicamento.`);
            }
            toast({ title: `Medicamento ${isEditMode ? 'atualizado' : 'adicionado'} com sucesso!` });
            onSave();
        } catch (err) {
            toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onDelete() {
        if (!medicamento) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/medicamentos/${medicamento.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao apagar o medicamento.');
            toast({ title: "Medicamento apagado com sucesso!" });
            onSave();
        } catch (err) {
            toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setIsDeleteDialogOpen(false);
        }
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome do Medicamento</FormLabel><FormControl><Input placeholder="Ex: Paracetamol" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="principioAtivo" render={({ field }) => (<FormItem><FormLabel>Princípio Ativo</FormLabel><FormControl><Input placeholder="(Opcional)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="forma" render={({ field }) => (<FormItem><FormLabel>Forma</FormLabel><FormControl><Input placeholder="Ex: Comprimido, Xarope, Gotas" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="tipo" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Uso_Continuo">Uso Contínuo</SelectItem><SelectItem value="Tratamento_Clinico">Tratamento Clínico</SelectItem><SelectItem value="Esporadico">Uso Esporádico</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Concluido">Concluído</SelectItem><SelectItem value="Suspenso">Suspenso</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="dataInicio" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><>{field.value ? format(field.value, 'PPP') : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="dataFim" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Fim (Opcional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><>{field.value ? format(field.value, 'PPP') : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="posologia" render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações sobre a posologia, dosagem... (opcional)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="border p-3 rounded-md space-y-3">
                        <p className="text-sm font-medium text-center">Associações (Opcional)</p>
                        <FormField control={form.control} name="profissionalId" render={({ field }) => (<FormItem><FormLabel>Profissional</FormLabel><MenuProfissionais profissionais={profissionais} onProfissionalSelect={(p: Profissional | null) => { setSelectedProfissional(p); field.onChange(p?.id ?? undefined); }} selectedProfissional={selectedProfissional} /><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="consultaId" render={({ field }) => (<FormItem><FormLabel>Consulta</FormLabel><MenuConsultas consultas={consultas} onConsultaSelect={(c: Consulta | null) => { setSelectedConsulta(c); field.onChange(c?.id ?? undefined); }} selectedConsulta={selectedConsulta} /><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="condicaoSaudeId" render={({ field }) => (<FormItem><FormLabel>Condição de Saúde</FormLabel><MenuCondicoes condicoes={condicoesSaude} onCondicaoSelect={(c: CondicaoSaude | null) => { setSelectedCondicao(c); field.onChange(c?.id ?? undefined); }} selectedCondicao={selectedCondicao} /><FormMessage /></FormItem>)} />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
                        {isEditMode && (<Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isSubmitting}><Trash className="mr-2 h-4 w-4" />Apagar</Button>)}                        
                        <Button type="submit" className="w-full sm:w-auto mb-2 sm:mb-0" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? 'Salvar Alterações' : 'Adicionar Medicamento')}</Button>
                    </div>
                </form>
            </Form>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá apagar permanentemente o medicamento.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete}>Apagar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
