'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/app/_components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/_components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/_components/ui/table';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useToast } from '@/app/_hooks/use-toast';
import { UnidadeDeSaude, Medicamento } from '@prisma/client'; // Importando o tipo diretamente
import MenuUnidades from '@/app/unidades/_components/menuunidades';

// Tipo para o registro de abastecimento retornado pela API (com a unidade aninhada)
interface Abastecimento {
    id: string;
    quantidade: number;
    dataAbastecimento: string;
    observacoes: string | null;
    unidadeDeSaude: {
        id: string;
        nome: string;
    } | null;
}

// Esquema de validação do formulário com Zod
const formSchema = z.object({
    quantidade: z.coerce.number().min(1, 'Quantidade é obrigatória.'),
    dataAbastecimento: z.coerce.date(),
    unidadeDeSaudeId: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface AbastecimentoSectionProps {
    medicamentoId: string;
    onAbastecimentoSuccess: (novoEstoque: number) => void;
}

export default function AbastecimentoSection({ medicamentoId, onAbastecimentoSuccess }: AbastecimentoSectionProps) {
    const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
    const [unidades, setUnidades] = useState<UnidadeDeSaude[]>([]);
    const [selectedUnidade, setSelectedUnidade] = useState<UnidadeDeSaude | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [abastResponse, unidadesResponse] = await Promise.all([
                fetch(`/api/medicamentos/abastecimentos?medicamentoId=${medicamentoId}`),
                fetch('/api/unidades') 
            ]);

            if (!abastResponse.ok) throw new Error('Falha ao buscar histórico de abastecimentos.');
            if (!unidadesResponse.ok) throw new Error('Falha ao buscar unidades de saúde.');

            const abastData = await abastResponse.json();
            const unidadesData = await unidadesResponse.json();

            setAbastecimentos(abastData);
            setUnidades(unidadesData || []);

        } catch (error) {
            toast({ title: "Erro ao carregar dados", description: error instanceof Error ? error.message : 'Erro desconhecido', variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [medicamentoId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUnidadeSelect = (unidade: UnidadeDeSaude | null) => {
        setSelectedUnidade(unidade);
        setValue('unidadeDeSaudeId', unidade ? unidade.id : null, { shouldValidate: true });
    };

    const onSubmit = async (data: FormData) => {
        try {
            const response = await fetch('/api/medicamentos/abastecimentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, medicamentoId }),
            });

            if (!response.ok) throw new Error('Falha ao registrar abastecimento');
            
            const { updatedMedicamento } = await response.json() as { updatedMedicamento: Medicamento };

            toast({ title: "Sucesso", description: "Novo abastecimento registrado." });
            reset({ dataAbastecimento: new Date(), quantidade: 0, observacoes: '' });
            setSelectedUnidade(null);
            setIsDialogOpen(false);
            
            fetchData();
            onAbastecimentoSuccess(updatedMedicamento.estoque ?? 0);

        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar o novo abastecimento.", variant: "destructive" });
        }
    };
    
    const handleOpenDialog = (open: boolean) => {
        if (open) {
            reset({ dataAbastecimento: new Date(), quantidade: undefined, observacoes: '' });
            setSelectedUnidade(null);
        }
        setIsDialogOpen(open);
    }

    return (
        <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg text-foreground">Histórico de Abastecimento</h4>
                <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
                    <DialogTrigger asChild>
                        <Button>Abastecer</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Novo Abastecimento</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <div>
                                <Label htmlFor="quantidade">Quantidade Abastecida</Label>
                                <Input id="quantidade" type="number" {...register('quantidade')} placeholder="Ex: 30"/>
                                {errors.quantidade && <p className="text-sm text-red-500 mt-1">{errors.quantidade.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="dataAbastecimento">Data do Abastecimento</Label>
                                <Input id="dataAbastecimento" type="date" {...register('dataAbastecimento')} defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                            </div>
                             <div>
                                <Label>Unidade de Saúde (Opcional)</Label>
                                <MenuUnidades 
                                    unidades={unidades}
                                    selectedUnidade={selectedUnidade}
                                    onUnidadeSelect={handleUnidadeSelect}
                                />
                            </div>
                            <div>
                                <Label htmlFor="observacoes">Observações (Opcional)</Label>
                                <Textarea id="observacoes" {...register('observacoes')} placeholder="Ex: Farmácia do Posto, Compra particular..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Salvar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <p>Carregando histórico...</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Unidade de Saúde</TableHead>
                            <TableHead>Observações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {abastecimentos.length > 0 ? (
                            abastecimentos.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{format(new Date(item.dataAbastecimento), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{item.quantidade}</TableCell>
                                    <TableCell>{item.unidadeDeSaude?.nome || 'N/A'}</TableCell>
                                    <TableCell>{item.observacoes || 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Nenhum abastecimento registrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
