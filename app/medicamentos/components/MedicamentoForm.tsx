import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Textarea } from "@/app/_components/ui/textarea";
import { toast } from "@/app/_hooks/use-toast";
import { MedicamentoComRelacoes } from "@/app/_components/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FrequenciaTipo, StatusMedicamento, TipoMedicamento } from '@prisma/client';

// Esquema de validação com Zod, alinhado ao schema.prisma
const medicamentoSchema = z.object({
  nome: z.string().min(3, { message: "O nome do medicamento deve ter no mínimo 3 caracteres." }),
  principioAtivo: z.string().optional().nullable(),
  linkBula: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().nullable(),
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  tipo: z.nativeEnum(TipoMedicamento),
  dataInicio: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de início inválida" }),
  dataFim: z.string().optional().nullable(),
  status: z.nativeEnum(StatusMedicamento),
  estoque: z.number().int().optional().nullable(),
  quantidadeCaixa: z.number().int().optional().nullable(),
  quantidadeDose: z.number().optional().nullable(),
  frequenciaNumero: z.number().int().optional().nullable(),
  frequenciaTipo: z.nativeEnum(FrequenciaTipo).optional().nullable(),
});

type MedicamentoFormData = z.infer<typeof medicamentoSchema>;

interface MedicamentoFormProps {
    medicamento?: MedicamentoComRelacoes | null;
    onSave: () => void;
}

export default function MedicamentoForm({ medicamento, onSave }: MedicamentoFormProps) {
    const { data: session } = useSession();
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<MedicamentoFormData>({
        resolver: zodResolver(medicamentoSchema),
        defaultValues: {
            ...medicamento,
            dataInicio: medicamento?.dataInicio ? new Date(medicamento.dataInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dataFim: medicamento?.dataFim ? new Date(medicamento.dataFim).toISOString().split('T')[0] : ''
        }
    });

    const status = watch("status");
    const tipo = watch("tipo");
    const frequenciaTipo = watch("frequenciaTipo");

    const onSubmit = async (data: MedicamentoFormData) => {
        try {
            const method = medicamento ? 'PUT' : 'POST';
            const endpoint = medicamento ? `/api/medicamentos/${medicamento.id}` : '/api/medicamentos';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, userId: session?.user.id })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao salvar medicamento');
            }

            toast({ title: "Sucesso!", description: `Medicamento ${medicamento ? 'atualizado' : 'criado'} com sucesso.` });
            onSave();
        } catch (error) {
            toast({ title: "Erro", description: error instanceof Error ? error.message : "Ocorreu um erro", variant: "destructive" });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-1 rounded-lg bg-card text-card-foreground">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="nome">Nome do Medicamento</Label>
                    <Input id="nome" {...register("nome")} />
                    {errors.nome && <p className="text-red-500 text-sm">{errors.nome.message}</p>}
                </div>
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
                        <SelectContent>
                            {Object.values(TipoMedicamento).map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo.message}</p>}
                </div>
                <div>
                    <Label htmlFor="forma">Forma Farmacêutica</Label>
                    <Input id="forma" {...register("forma")} />
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
            
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="quantidadeDose">Quantidade por Dose</Label>
                    <Input id="quantidadeDose" type="number" step="0.1" {...register("quantidadeDose", { valueAsNumber: true })} />
                </div>
                <div>
                    <Label htmlFor="frequenciaNumero">Frequência (Número)</Label>
                    <Input id="frequenciaNumero" type="number" {...register("frequenciaNumero", { valueAsNumber: true })} />
                </div>
                <div>
                    <Label htmlFor="frequenciaTipo">Frequência (Período)</Label>
                    <Select onValueChange={(value) => setValue("frequenciaTipo", value as FrequenciaTipo)} value={frequenciaTipo || undefined}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                            {Object.values(FrequenciaTipo).map(ft => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="estoque">Estoque Atual (unidades)</Label>
                    <Input id="estoque" type="number" {...register("estoque", { valueAsNumber: true })} />
                </div>
                <div>
                    <Label htmlFor="quantidadeCaixa">Unidades por Caixa</Label>
                    <Input id="quantidadeCaixa" type="number" {...register("quantidadeCaixa", { valueAsNumber: true })} />
                </div>
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
                    <SelectContent>
                        {Object.values(StatusMedicamento).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                 {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit">Salvar</Button>
            </div>
        </form>
    );
}
