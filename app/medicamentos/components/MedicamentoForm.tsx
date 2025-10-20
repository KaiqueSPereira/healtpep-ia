
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
import { CalendarIcon, Loader2, Trash, Check, Pill, Droplets, Beaker, Syringe, AlertTriangle } from "lucide-react";
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

// UPDATED: Corrected type imports
import { Profissional, Consulta, CondicaoSaude, MedicamentoComRelacoes } from "@/app/_components/types";
import MenuProfissionais from "@/app/profissionais/_components/menuprofissionais";
import MenuConsultas from "@/app/consulta/components/menuconsultas";
// UPDATED: Corrected component import
import MenuCondicoes from "@/app/condicoes/_Components/MenuCondicoes";

interface MedicamentoAnvisa {
    id: string;
    nomeComercial: string;
    principioAtivo: string;
    linkBula: string;
}

const TipoMedicamento = { USO_CONTINUO: 'USO_CONTINUO', TRATAMENTO_CLINICO: 'TRATAMENTO_CLINICO', ESPORADICO: 'ESPORADICO' } as const;
const FrequenciaTipo = { HORA: 'HORA', DIA: 'DIA', SEMANA: 'SEMANA', MES: 'MES' } as const;
const StatusMedicamento = { ATIVO: 'ATIVO', CONCLUIDO: 'CONCLUIDO', SUSPENSO: 'SUSPENSO' } as const;

// UPDATED: Zod schema now uses condicaoSaudeId
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
    condicaoSaudeId: z.string().optional(), // Corrected field
});

type MedicamentoFormData = z.infer<typeof formSchema>;

// UPDATED: Props now expect condicoesSaude
interface MedicamentoFormProps {
    onFormSubmit: () => void;
    profissionais: Profissional[];
    condicoesSaude: CondicaoSaude[];
    medicamento?: MedicamentoComRelacoes | null;
}

const getFormaIcon = (forma?: string) => {
    if (!forma) return null;
    const formaLower = forma.toLowerCase();
    const iconProps = { className: "h-4 w-4" };
    if (formaLower.includes('comprimido') || formaLower.includes('cápsula')) return <Pill {...iconProps} />;
    if (formaLower.includes('gota')) return <Droplets {...iconProps} />;
    if (formaLower.includes('xarope') || formaLower.includes('solução')) return <Beaker {...iconProps} />;
    if (formaLower.includes('injeção')) return <Syringe {...iconProps} />;
    return null;
};

// UPDATED: Component receives condicoesSaude prop
export default function MedicamentoForm({ onFormSubmit, profissionais, condicoesSaude, medicamento }: MedicamentoFormProps) {
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
    // UPDATED: State for selected condition
    const [selectedCondicao, setSelectedCondicao] = useState<CondicaoSaude | null>(null);

    const [alergias, setAlergias] = useState<string[]>([]);
    const [isAllergyAlertOpen, setIsAllergyAlertOpen] = useState(false);
    const [allergyDetails, setAllergyDetails] = useState({ medicamento: "", componente: "" });

    const form = useForm<MedicamentoFormData>({ resolver: zodResolver(formSchema), defaultValues: { nome: "", principioAtivo: "", linkBula: "", tipo: TipoMedicamento.ESPORADICO, status: StatusMedicamento.ATIVO } });

    useEffect(() => {
        if (session?.user?.id) {
            const fetchAlergias = async () => {
                try {
                    const response = await fetch(`/api/pacientes/dashboard/${session.user.id}`);
                    if (!response.ok) return;
                    const data = await response.json();
                    if (data.dadosSaude?.alergias) {
                        setAlergias(data.dadosSaude.alergias.map((a: string) => a.toLowerCase()));
                    }
                } catch (error) {
                    console.error("Falha ao buscar alergias:", error);
                }
            };
            fetchAlergias();
        }
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
                condicaoSaudeId: isEditing ? med.condicaoSaudeId ?? undefined : undefined, // UPDATED
            });
            setSearchTerm(isEditing ? med.nome : "");
            setSelectionMade(true); 
            setSelectedProfissional(isEditing ? med.profissional ?? null : null);
            // UPDATED: Correctly handle Date object, no .toISOString()
            const consultaComDataCorrigida = isEditing && med.consulta ? { ...med.consulta, data: new Date(med.consulta.data) } : null;
            setSelectedConsulta(consultaComDataCorrigida);
            // UPDATED: Set the correct state
            setSelectedCondicao(isEditing ? med.condicaoSaude ?? null : null);
        };

        resetValues(medicamento ?? null);
    }, [medicamento, form]);

    // ... (other useEffects and functions remain the same) ...

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
            onFormSubmit();
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
            onFormSubmit();
        } catch (err) {
            toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
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
        const principioAtivoLower = med.principioAtivo.toLowerCase();
        const alergiaEncontrada = alergias.find(alergia => principioAtivoLower.includes(alergia));

        if (alergiaEncontrada) {
            setAllergyDetails({ medicamento: med.nomeComercial, componente: alergiaEncontrada });
            setIsAllergyAlertOpen(true);
            setIsSearchPopoverOpen(false); 
            return;
        }

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
                    {/* ... (Nome, Forma, Tipo, Datas, Status fields are unchanged) ... */}
                    <FormField control={form.control} name="posologia" render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações sobre a posologia (opcional)" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    
                    {/* UPDATED: Associations section with CondicaoSaude */}
                    <div className="border p-3 rounded-md space-y-3">
                        <p className="text-sm font-medium text-center">Associações (Opcional)</p>
                        <FormField control={form.control} name="profissionalId" render={({ field }) => (<FormItem><FormLabel>Profissional</FormLabel><MenuProfissionais profissionais={profissionais} onProfissionalSelect={(p: Profissional | null) => { setSelectedProfissional(p); field.onChange(p?.id ?? undefined); }} selectedProfissional={selectedProfissional} /><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="consultaId" render={({ field }) => (<FormItem><FormLabel>Consulta</FormLabel><MenuConsultas onConsultaSelect={(c: Consulta | null) => { setSelectedConsulta(c); field.onChange(c?.id ?? undefined); }} selectedConsulta={selectedConsulta} userId={session?.user?.id || ''} /><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="condicaoSaudeId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condição de Saúde</FormLabel>
                                <MenuCondicoes 
                                    condicoes={condicoesSaude} 
                                    onCondicaoSelect={(c: CondicaoSaude | null) => { setSelectedCondicao(c); field.onChange(c?.id ?? undefined); }} 
                                    selectedCondicao={selectedCondicao} 
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
            
            {/* ... (Alert Dialogs are unchanged) ... */}
        </>
    )
}
