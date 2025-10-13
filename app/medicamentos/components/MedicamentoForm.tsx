
"use client";

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
import { ptBR } from 'date-fns/locale'; // CORREÇÃO: Importar o locale pt-BR
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { toast } from "@/app/_hooks/use-toast";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { useSession } from "next-auth/react";

// Tipos corretos e centralizados
import { Profissional, Consulta, Tratamento, MedicamentoComRelacoes } from "@/app/_components/types"; 

// Caminhos corretos para os componentes de menu
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/consulta/components/menuconsultas";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";

const TipoMedicamento = { USO_CONTINUO: 'USO_CONTINUO', TRATAMENTO_CLINICO: 'TRATAMENTO_CLINICO', ESPORADICO: 'ESPORADICO' } as const;
const FrequenciaTipo = { HORA: 'HORA', DIA: 'DIA', SEMANA: 'SEMANA', MES: 'MES' } as const;
const StatusMedicamento = { ATIVO: 'ATIVO', CONCLUIDO: 'CONCLUIDO', SUSPENSO: 'SUSPENSO' } as const;

const formSchema = z.object({
    nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
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
    tratamentoId: z.string().optional(),
});

type MedicamentoFormData = z.infer<typeof formSchema>;

interface MedicamentoFormProps {
    onFormSubmit: () => void;
    profissionais: Profissional[];
    tratamentos: Tratamento[];
    medicamento?: MedicamentoComRelacoes | null;
}

export default function MedicamentoForm({ onFormSubmit, profissionais, tratamentos, medicamento }: MedicamentoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { data: session } = useSession();
    const isEditMode = !!medicamento;

    const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
    const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
    const [selectedTratamento, setSelectedTratamento] = useState<Tratamento | null>(null);

    const form = useForm<MedicamentoFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: "",
            tipo: TipoMedicamento.ESPORADICO,
            status: StatusMedicamento.ATIVO,
        },
    });

    useEffect(() => {
        if (isEditMode && medicamento) {
            form.reset({
                nome: medicamento.nome,
                posologia: medicamento.posologia ?? undefined,
                forma: medicamento.forma ?? undefined,
                tipo: medicamento.tipo,
                dataInicio: new Date(medicamento.dataInicio),
                dataFim: medicamento.dataFim ? new Date(medicamento.dataFim) : undefined,
                status: medicamento.status,
                estoque: medicamento.estoque ?? undefined,
                quantidadeCaixa: medicamento.quantidadeCaixa ?? undefined,
                quantidadeDose: medicamento.quantidadeDose ?? undefined,
                frequenciaNumero: medicamento.frequenciaNumero ?? undefined,
                frequenciaTipo: medicamento.frequenciaTipo ?? undefined,
                profissionalId: medicamento.profissionalId ?? undefined,
                consultaId: medicamento.consultaId ?? undefined,
                tratamentoId: medicamento.tratamentoId ?? undefined,
            });
            setSelectedProfissional(medicamento.profissional ?? null);
            const consultaComDataCorrigida = medicamento.consulta ? { ...medicamento.consulta, data: new Date(medicamento.consulta.data).toISOString() } : null;
            setSelectedConsulta(consultaComDataCorrigida);
            setSelectedTratamento(medicamento.tratamento ?? null);

        } else {
            form.reset({
                nome: "",
                tipo: TipoMedicamento.ESPORADICO,
                status: StatusMedicamento.ATIVO,
                dataInicio: new Date(),
            });
            setSelectedProfissional(null);
            setSelectedConsulta(null);
            setSelectedTratamento(null);
        }
    }, [medicamento, isEditMode, form]);

    const tipoMedicamento = form.watch("tipo");

    async function onSubmit(values: MedicamentoFormData) {
        setIsSubmitting(true);
        try {
            const url = isEditMode && medicamento ? `/api/medicamentos/${medicamento.id}` : '/api/medicamentos';
            const method = isEditMode ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o medicamento.`);
            }
            toast({ title: `Medicamento ${isEditMode ? 'atualizado' : 'adicionado'} com sucesso!` });
            onFormSubmit();
        } catch (err) { // CORREÇÃO: removido ':any'
            const message = (err as Error).message; // CORREÇÃO: asserção de tipo
            toast({ title: "Erro", description: message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onDelete() {
        if (!medicamento) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/medicamentos/${medicamento.id}`, { method: 'DELETE' });
            if (!response.ok) { throw new Error('Falha ao apagar o medicamento.'); }
            toast({ title: "Medicamento apagado com sucesso!" });
            onFormSubmit();
        } catch (err) { // CORREÇÃO: removido ':any'
            const message = (err as Error).message; // CORREÇÃO: asserção de tipo
            toast({ title: "Erro", description: message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setIsDeleteDialogOpen(false);
        }
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Ex: Paracetamol 500mg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="forma" render={({ field }) => (<FormItem><FormLabel>Forma</FormLabel><FormControl><Input placeholder="Ex: Comprimido" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="tipo" render={({ field }) => (<FormItem><FormLabel>Tipo de Tratamento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent>{Object.values(TipoMedicamento).map((tipo) => (<SelectItem key={tipo} value={tipo}>{tipo.replace('_', ' ')}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="dataInicio" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                        {tipoMedicamento === TipoMedicamento.TRATAMENTO_CLINICO && (
                            <FormField control={form.control} name="dataFim" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Fim</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha a data final</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                        )}
                    </div>
                    <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl><SelectContent>{Object.values(StatusMedicamento).map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <div className="border p-3 rounded-md space-y-4">
                        <p className="text-sm font-medium text-center">Cálculo de Duração (Opcional)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="estoque" render={({ field }) => (<FormItem><FormLabel>Nº de Caixas</FormLabel><FormControl><Input type="number" placeholder="Ex: 2" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="quantidadeCaixa" render={({ field }) => (<FormItem><FormLabel>Unidades/Caixa</FormLabel><FormControl><Input type="number" placeholder="Ex: 30" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} /></FormControl></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="quantidadeDose" render={({ field }) => (<FormItem><FormLabel>Dose</FormLabel><FormControl><Input type="number" step="0.5" placeholder="Ex: 1" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="frequenciaNumero" render={({ field }) => (<FormItem><FormLabel>Frequência</FormLabel><FormControl><Input type="number" placeholder="Ex: 2" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="frequenciaTipo" render={({ field }) => (<FormItem><FormLabel>Período</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{Object.values(FrequenciaTipo).map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                        </div>
                    </div>
                    <FormField control={form.control} name="posologia" render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações sobre a posologia (opcional)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    
                    <div className="border p-3 rounded-md space-y-3">
                        <p className="text-sm font-medium text-center">Associações (Opcional)</p>
                        <FormField control={form.control} name="profissionalId" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Profissional</FormLabel>
                                <MenuProfissionais 
                                    profissionais={profissionais}
                                    onProfissionalSelect={(p: Profissional | null) => {
                                        setSelectedProfissional(p);
                                        field.onChange(p?.id ?? undefined);
                                    }}
                                    selectedProfissional={selectedProfissional}
                                />
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="consultaId" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Consulta</FormLabel>
                                <MenuConsultas 
                                    onConsultaSelect={(c: Consulta | null) => {
                                        setSelectedConsulta(c);
                                        field.onChange(c?.id ?? undefined);
                                    }}
                                    selectedConsulta={selectedConsulta}
                                    userId={session?.user?.id || ''}
                                />
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="tratamentoId" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Tratamento</FormLabel>
                                <MenuTratamentos 
                                    tratamentos={tratamentos}
                                    onTratamentoSelect={(t: Tratamento | null) => {
                                        setSelectedTratamento(t);
                                        field.onChange(t?.id ?? undefined);
                                    }}
                                    selectedTratamento={selectedTratamento}
                                />
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
                        {isEditMode && (<Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isSubmitting}><Trash className="mr-2 h-4 w-4" />Apagar</Button>)}
                        <Button type="submit" className="w-full sm:w-auto mb-2 sm:mb-0" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? 'Salvar Alterações' : 'Adicionar Medicamento')}</Button>
                    </div>
                </form>
            </Form>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Tem a certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isto irá apagar permanentemente o medicamento.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDelete}>Continuar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
