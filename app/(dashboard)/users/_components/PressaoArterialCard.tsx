'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import AddPressaoArterialDialog from './AddPressaoArterialDialog';
import { PressaoArterial } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { format, parseISO } from 'date-fns';
import { toast } from "@/app/_hooks/use-toast";

const PressaoArterialCard = ({ userId }: { userId: string }) => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [selectedPressaoId, setSelectedPressaoId] = useState<string | null>(null);
    const [pressoes, setPressoes] = useState<PressaoArterial[]>([]);

    const fetchPressoes = useCallback(async () => {
        try {
            const response = await fetch(`/api/users/${userId}/pressao`);
            if (response.ok) {
                const data = await response.json();
                const sortedData = data.sort((a: PressaoArterial, b: PressaoArterial) => new Date(b.data).getTime() - new Date(a.data).getTime());
                setPressoes(sortedData);
            }
        } catch (error) {
            console.error("Failed to fetch pressoes", error);
            toast({ title: "Erro", description: "Não foi possível carregar os registros de pressão.", variant: "destructive" });
        }
    }, [userId]);

    useEffect(() => {
        fetchPressoes();
    }, [fetchPressoes]);

    const handleDeleteClick = (pressaoId: string) => {
        setSelectedPressaoId(pressaoId);
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPressaoId) return;

        try {
            const response = await fetch(`/api/users/${userId}/pressao/${selectedPressaoId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({ title: "Sucesso", description: "Registro de pressão arterial excluído com sucesso." });
                fetchPressoes();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha ao excluir o registro.");
            }
        } catch (error: any) {
            console.error("Failed to delete pressao", error);
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        }
        setIsConfirmDialogOpen(false);
        setSelectedPressaoId(null);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Pressão Arterial</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-y-auto max-h-[260px] relative pr-2">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Hora</TableHead>
                                <TableHead>Pressão</TableHead>
                                <TableHead>Pulso</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pressoes.length > 0 ? (
                                pressoes.map((pressao) => (
                                    <TableRow key={pressao.id}>
                                        <TableCell>{format(parseISO(pressao.data as unknown as string), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{format(parseISO(pressao.data as unknown as string), 'HH:mm')}</TableCell>
                                        <TableCell>{`${pressao.sistolica} / ${pressao.diastolica} mmHg`}</TableCell>
                                        <TableCell>{`${pressao.pulso} bpm`}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pressao.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">Nenhum registro encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <AddPressaoArterialDialog
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
                userId={userId}
                onPressaoArterialAdded={fetchPressoes}
            />
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de pressão arterial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Confirmar Exclusão</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default PressaoArterialCard;
