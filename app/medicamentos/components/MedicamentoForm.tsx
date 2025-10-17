
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
import { CalendarIcon, Loader2, Trash, Check, Pill, Droplets, Beaker, Syringe } from "lucide-react";
import { Calendar } from "@/app/_components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { toast } from "@/app/_hooks/use-toast";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/_components/ui/alert-dialog";
import { useSession } from "next-auth/react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/app/_components/ui/command";
import { useDebounce } from "@uidotdev/usehooks";

// Tipos
import { Profissional, Consulta, Tratamento, MedicamentoComRelacoes } from "@/app/_components/types";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/consulta/components/menuconsultas";
import MenuTratamentos from "@/app/tratamentos/_Components/menutratamentos";

interface MedicamentoAnvisa {
    id: string;
    nomeComercial: string;
    principioAtivo: string;
    linkBula: string;
}

const TipoMedicamento = { USO_CONTINUO: 'USO_CONTINUO', TRATAMENTO_CLINICO: 'TRATAMENTO_CLINICO', ESPORADICO: 'ESPORADICO' } as const;
const FrequenciaTipo = { HORA: 'HORA', DIA: 'DIA', SEMANA: 'SEMANA', MES: 'MES' } as const;
const StatusMedicamento = { ATIVO: 'ATIVO', CONCLUIDO: 'CONCLUIDO', SUSPENSO: 'SUSPENSO' } as const;

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
    tratamentoId: z.string().optional(),
});

type MedicamentoFormData = z.infer<typeof formSchema>;

interface MedicamentoFormProps {
    onFormSubmit: () => void;
    profissionais: Profissional[];
    tratamentos: Tratamento[];
    medicamento?: MedicamentoComRelacoes | null;
}

const getFormaIcon = (forma?: string) => {
    if (!forma) return null;
    const formaLower = forma.toLowerCase();
    const iconProps = { className: "h-4 w-4" };

    if (formaLower.includes('comprimido') || formaLower.includes('cápsula') || formaLower.includes('pilula')) {
        return <Pill {...iconProps} />;
    }
    if (formaLower.includes('gota')) {
        return <Droplets {...iconProps} />;
    }
    if (formaLower.includes('xarope') || formaLower.includes('solução')) {
        return <Beaker {...iconProps} />;
    }
    if (formaLower.includes('injeção') || formaLower.includes('injetável')) {
        return <Syringe {...iconProps} />;
    }
    return null;
};

export default function MedicamentoForm({ onFormSubmit, profissionais, tratamentos, medicamento }: MedicamentoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { data: session } = useSession();
    const isEditMode = !!medicamento;

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 750);
    const [searchResults, setSearchResults] = useState<MedicamentoAnvisa[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
    const [selectionMade, setSelectionMade] = useState(false);

    const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
    const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
    const [selectedTratamento, setSelectedTratamento] = useState<Tratamento | null>(null);

    const form = useForm<MedicamentoFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: "",
            principioAtivo: "",
            linkBula: "",
            tipo: TipoMedicamento.ESPORADICO,
            status: StatusMedicamento.ATIVO,
        },
    });

    useEffect(() => {
        const resetValues = (med: MedicamentoComRelacoes | null) => {
            const isEditing = !!med;
            form.reset({
                nome: isEditing ? med.nome : "",
                principioAtivo: isEditing ? med.principioAtivo ?? undefined : "",
                linkBula: isEditing ? med.linkBula ?? undefined : "",
                posologia: isEditing ? med.posologia ?? undefined : undefined,
                forma: isEditing ? med.forma ?? undefined : undefined,
                tipo: isEditing ? med.tipo : TipoMedicamento.ESPORADICO,
                dataInicio: isEditing ? new Date(med.dataInicio) : new Date(),
                dataFim: isEditing && med.dataFim ? new Date(med.dataFim) : undefined,
                status: isEditing ? med.status : StatusMedicamento.ATIVO,
                estoque: isEditing ? med.estoque ?? undefined : undefined,
                quantidadeCaixa: isEditing ? med.quantidadeCaixa ?? undefined : undefined,
                quantidadeDose: isEditing ? med.quantidadeDose ?? undefined : undefined,
                frequenciaNumero: isEditing ? med.frequenciaNumero ?? undefined : undefined,
                frequenciaTipo: isEditing ? med.frequenciaTipo ?? undefined : undefined,
                profissionalId: isEditing ? med.profissionalId ?? undefined : undefined,
                consultaId: isEditing ? med.consultaId ?? undefined : undefined,
                tratamentoId: isEditing ? med.tratamentoId ?? undefined : undefined,
            });
            setSearchTerm(isEditing ? med.nome : "");
            setSelectionMade(true); 
            setSelectedProfissional(isEditing ? med.profissional ?? null : null);
            const consultaComDataCorrigida = isEditing && med.consulta ? { ...med.consulta, data: new Date(med.consulta.data).toISOString() } : null;
            setSelectedConsulta(consultaComDataCorrigida);
            setSelectedTratamento(isEditing ? med.tratamento ?? null : null);
        };

        resetValues(medicamento ?? null);
    }, [medicamento, form]);

    useEffect(() => {
        if (debouncedSearchTerm.length < 3 || selectionMade) {
            setSearchResults([]);
            if(selectionMade) setIsSearchPopoverOpen(false);
            return;
        }

        const fetchMedicamentos = async () => {
            setIsSearching(true);
            setIsSearchPopoverOpen(true);
            try {
                const response = await fetch(`/api/medicamentos/br-search?name=${debouncedSearchTerm}`);
                if (!response.ok) throw new Error("Falha na busca por medicamentos.");
                const data: MedicamentoAnvisa[] = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error(error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        fetchMedicamentos();
    }, [debouncedSearchTerm, selectionMade]);

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
                const errorData = await response.json();
                throw new Error(errorData.error || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o medicamento.`);
            }
            toast({ title: `Medicamento ${isEditMode ? 'atualizado' : 'adicionado'} com sucesso!` });
            onFormSubmit();
        } catch (err) {
            const message = (err as Error).message;
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
        } catch (err) {
            const message = (err as Error).message;
            toast({ title: "Erro", description: message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setIsDeleteDialogOpen(false);
        }
    }
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setSelectionMade(false);
    };

    const handleSelectMedicamento = (med: MedicamentoAnvisa) => {
        form.setValue("nome", med.nomeComercial);
        form.setValue("principioAtivo", med.principioAtivo);
        form.setValue("linkBula", med.linkBula);
        setSearchTerm(med.nomeComercial);
        setSelectionMade(true);
        setIsSearchPopoverOpen(false);
    };

    const tipoMedicamento = form.watch("tipo");
    const formaValue = form.watch("forma");

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    
                    <FormItem>
                        <FormLabel>Nome do Medicamento</FormLabel>
                        <Popover open={isSearchPopoverOpen} onOpenChange={setIsSearchPopoverOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="Digite para buscar (ex: Dipirona)"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            onFocus={() => { if (!selectionMade && searchTerm.length > 2 && searchResults.length > 0) setIsSearchPopoverOpen(true); }}
                                            className="pr-10"
                                        />
                                        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                                    </div>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandList>
                                        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {searchResults.map((med) => (
                                                <CommandItem
                                                    key={med.id}
                                                    value={med.nomeComercial}
                                                    onSelect={() => handleSelectMedicamento(med)}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", med.nomeComercial === form.getValues("nome") ? "opacity-100" : "opacity-0")} />
                                                    <div>
                                                        <p className="font-semibold">{med.nomeComercial}</p>
                                                        <p className="text-xs text-muted-foreground">{med.principioAtivo}</p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="forma" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Forma</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            {getFormaIcon(formaValue)}
                                        </div>
                                        <Input placeholder="Ex: Comprimido, Gotas..." {...field} value={field.value ?? ''} className="pl-10" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="tipo" render={({ field }) => (<FormItem><FormLabel>Tipo de Tratamento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent>{Object.values(TipoMedicamento).map((tipo) => (<SelectItem key={tipo} value={tipo}>{tipo.replace('_', ' ')}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    
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
