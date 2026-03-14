'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Schema de validação com a ordem correta
const pressaoSchema = z.object({
    data: z.string().nonempty("Data é obrigatória"),
    sistolica: z.string().nonempty("Pressão sistólica é obrigatória"),
    diastolica: z.string().nonempty("Pressão diastólica é obrigatória"),
    pulso: z.string().nonempty("Pulso é obrigatório"),
    observacoes: z.string().optional(),
});

interface AddPressaoArterialDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    userId: string;
    onPressaoArterialAdded: () => void;
}

const AddPressaoArterialDialog = ({ isOpen, setIsOpen, userId, onPressaoArterialAdded }: AddPressaoArterialDialogProps) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(pressaoSchema),
    });

    const onSubmit = async (data: any) => {
        const response = await fetch(`/api/users/${userId}/pressao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            onPressaoArterialAdded();
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Pressão Arterial</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input type="datetime-local" {...register("data")} />
                    {errors.data && <p className="text-red-500">{errors.data.message as string}</p>}

                    {/* Campo de Pressão Sistólica */}
                    <Input placeholder="Sistólica (mmHg)" {...register("sistolica")} />
                    {errors.sistolica && <p className="text-red-500">{errors.sistolica.message as string}</p>}

                    {/* Campo de Pressão Diastólica */}
                    <Input placeholder="Diastólica (mmHg)" {...register("diastolica")} />
                    {errors.diastolica && <p className="text-red-500">{errors.diastolica.message as string}</p>}

                    <Input placeholder="Pulso (bpm)" {...register("pulso")} />
                    {errors.pulso && <p className="text-red-500">{errors.pulso.message as string}</p>}

                    <Textarea placeholder="Observações" {...register("observacoes")} />

                    <DialogFooter>
                        <Button type="submit">Salvar</Button>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPressaoArterialDialog;
