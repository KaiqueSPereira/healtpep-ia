'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import AddGlicemiaDialog from './AddGlicemiaDialog';
import { GlicemiaCapilar } from "@prisma/client";
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

const GlicemiaCapilarCard = ({ userId }: { userId: string }) => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [selectedGlicemiaId, setSelectedGlicemiaId] = useState<string | null>(null);
    const [glicemias, setGlicemias] = useState<GlicemiaCapilar[]>([]);

    const fetchGlicemias = useCallback(async () => {
        try {
            const response = await fetch(`/api/users/${userId}/glicemia`);
            if (response.ok) {
                const data = await response.json();
                const sortedData = data.sort((a: GlicemiaCapilar, b: GlicemiaCapilar) => new Date(b.data).getTime() - new Date(a.data).getTime());
                setGlicemias(sortedData);
            }
        } catch (error) {
            console.error("Failed to fetch glicemias", error);
            toast({ title: "Erro", description: "Não foi possível carregar os registros de glicemia.", variant: "destructive" });
        }
    }, [userId]);

    useEffect(() => {
        fetchGlicemias();
    }, [fetchGlicemias]);

    const handleDeleteClick = (glicemiaId: string) => {
        setSelectedGlicemiaId(glicemiaId);
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedGlicemiaId) return;

        try {
            const response = await fetch(`/api/users/${userId}/glicemia/${selectedGlicemiaId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({ title: "Sucesso", description: "Registro de glicemia excluído com sucesso." });
                fetchGlicemias();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha ao excluir o registro.");
            }
        } catch (error: any) {
            console.error("Failed to delete glicemia", error);
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        }
        setIsConfirmDialogOpen(false);
        setSelectedGlicemiaId(null);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Glicemia Capilar</CardTitle>
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
                                <TableHead>Valor</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {glicemias.length > 0 ? (
                                glicemias.map((glicemia) => (
                                    <TableRow key={glicemia.id}>
                                        <TableCell>{format(parseISO(glicemia.data as unknown as string), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{format(parseISO(glicemia.data as unknown as string), 'HH:mm')}</TableCell>
                                        <TableCell>{glicemia.valor} mg/dL</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(glicemia.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">Nenhum registro encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <AddGlicemiaDialog
                isOpen={isAddDialogOpen}
                setIsOpen={setIsAddDialogOpen}
                userId={userId}
                onGlicemiaAdded={fetchGlicemias}
            />
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de glicemia.
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

export default GlicemiaCapilarCard;
