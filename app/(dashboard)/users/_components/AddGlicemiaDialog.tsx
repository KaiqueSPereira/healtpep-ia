
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const glicemiaSchema = z.object({
    data: z.string().nonempty("Data é obrigatória"),
    valor: z.string().nonempty("Valor é obrigatório"),
    tipoMedicao: z.string().nonempty("Tipo de medição é obrigatório"),
    observacoes: z.string().optional(),
});

interface AddGlicemiaDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    userId: string;
    onGlicemiaAdded: () => void;
}

const AddGlicemiaDialog = ({ isOpen, setIsOpen, userId, onGlicemiaAdded }: AddGlicemiaDialogProps) => {
    const { register, handleSubmit, control, formState: { errors } } = useForm({
        resolver: zodResolver(glicemiaSchema),
    });

    const onSubmit = async (data: any) => {
        const response = await fetch(`/api/users/${userId}/glicemia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            onGlicemiaAdded();
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Glicemia Capilar</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input type="datetime-local" {...register("data")} />
                    {errors.data && <p className="text-red-500">{errors.data.message as string}</p>}

                    <Input placeholder="Valor (mg/dL)" {...register("valor")} />
                     {errors.valor && <p className="text-red-500">{errors.valor.message as string}</p>}

                    <Controller
                        name="tipoMedicao"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de Medição" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="JEJUM">Jejum</SelectItem>
                                    <SelectItem value="PRE_REFEICAO">Pré-refeição</SelectItem>
                                    <SelectItem value="POS_REFEICAO">Pós-refeição</SelectItem>
                                    <SelectItem value="AO_DEITAR">Ao deitar</SelectItem>
                                    <SelectItem value="COM_SINTOMAS">Com sintomas</SelectItem>
                                    <SelectItem value="SEM_SINTOMAS">Sem sintomas</SelectItem>
                                    <SelectItem value="OUTRO">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.tipoMedicao && <p className="text-red-500">{errors.tipoMedicao.message as string}</p>}

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

export default AddGlicemiaDialog;
