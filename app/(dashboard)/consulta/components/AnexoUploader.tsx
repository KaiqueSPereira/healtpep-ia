"use client";

import { useState, useRef } from 'react';
import { z } from 'zod';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { toast } from '@/app/_hooks/use-toast';
import { Loader2, Paperclip, X } from 'lucide-react';
import { Anexo } from '@/app/_components/types';

interface AnexoUploaderProps {
    consultaId: string;
    onAnexoAdicionado: (newAnexo: Anexo) => void; 
    onClose: () => void;
}

// MODIFICAÇÃO: Definir os tipos de anexo diretamente no frontend
const tiposAnexo = [
    { value: 'Atestado', label: 'Atestado' },
    { value: 'Declaracao', label: 'Declaração' },
    { value: 'Encaminhamento', label: 'Encaminhamento' },
    { value: 'Receita_Medica', label: 'Receita Médica' },
    { value: 'Relatorio', label: 'Relatório' },
    { value: 'Outro', label: 'Outro' },
] as const;

type TipoAnexoValue = typeof tiposAnexo[number]['value'];

const fileSchema = typeof window !== 'undefined' ? z.instanceof(File) : z.any();
const formSchema = z.object({
    file: fileSchema.refine(file => file && file.size > 0, 'É necessário selecionar um arquivo.'),
    // MODIFICAÇÃO: Usar o array de tipos definidos acima para validação
    tipo: z.enum(tiposAnexo.map(t => t.value) as [string, ...string[]]),
});

export default function AnexoUploader({ consultaId, onAnexoAdicionado, onClose }: AnexoUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [tipo, setTipo] = useState<TipoAnexoValue | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) setFile(selectedFile);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const validationResult = formSchema.safeParse({ file, tipo });
            if (!validationResult.success) {
                const errorMessage = validationResult.error.errors.map(e => e.message).join('\n');
                throw new Error(errorMessage);
            }

            const { file: validFile, tipo: validTipo } = validationResult.data;
            const formData = new FormData();
            formData.append('file', validFile as Blob);
            formData.append('tipo', validTipo);

            const response = await fetch(`/api/consultas/${consultaId}/anexos`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao enviar anexo.');
            }
            
            const newAnexo = await response.json();

            toast({ title: 'Anexo enviado com sucesso!', description: `O arquivo foi salvo como: ${newAnexo.nomeArquivo}` });
            onAnexoAdicionado(newAnexo);
            onClose();

        } catch (err) { 
            const message = (err as Error).message;
            toast({ title: 'Erro ao enviar anexo', description: message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Adicionar Novo Anexo</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className='space-y-2'>
                        <label htmlFor='file-upload' className="text-sm font-medium">Arquivo</label>
                        <Input id='file-upload' ref={fileInputRef} type="file" onChange={handleFileChange} className="file:text-sm file:font-medium"/>
                    </div>
                    <div className='space-y-2'>
                        <label className="text-sm font-medium">Tipo de Anexo</label>
                        <Select onValueChange={(value: TipoAnexoValue) => setTipo(value)} value={tipo ?? undefined}>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                            <SelectContent>
                                {/* MODIFICAÇÃO: Mapear os tipos de anexo do frontend */}
                                {tiposAnexo.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                         <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                         <Button type="submit" disabled={isSubmitting || !file || !tipo}>
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                            ) : (
                                <><Paperclip className="mr-2 h-4 w-4" /> Adicionar Anexo</>
                            )}
                        </Button>
                    </div>
                </form>
             </div>
        </div>
    );
}
