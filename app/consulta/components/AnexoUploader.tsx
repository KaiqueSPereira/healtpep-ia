"use client";

import { useState, useRef } from 'react';
import { z } from 'zod';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { TipoAnexo } from '@prisma/client';
import { toast } from '@/app/_hooks/use-toast';
import { Loader2, Paperclip } from 'lucide-react';

interface AnexoUploaderProps {
    consultaId: string;
    onUploadSuccess: () => void; // Callback para atualizar a lista de anexos
}

// Validação do lado do cliente
const fileSchema = typeof window !== 'undefined' ? z.instanceof(File) : z.any();
const formSchema = z.object({
    file: fileSchema.refine(file => file && file.size > 0, 'É necessário selecionar um arquivo.'),
    tipo: z.nativeEnum(TipoAnexo, { errorMap: () => ({ message: "É necessário selecionar um tipo." }) }),
});

export default function AnexoUploader({ consultaId, onUploadSuccess }: AnexoUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [tipo, setTipo] = useState<TipoAnexo | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null); 
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

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
                const errorData = await response.text();
                throw new Error(errorData || 'Falha ao enviar anexo.');
            }

            toast({ title: 'Anexo enviado com sucesso!' });
            
            // Limpa o formulário
            setFile(null);
            setTipo(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            onUploadSuccess(); // Informa o componente pai sobre o sucesso

        } catch (err) { 
            const message = (err as Error).message;
            setError(message);
            toast({ title: 'Erro ao enviar anexo', description: message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="grid gap-4 md:grid-cols-2">
                 <div className='space-y-2'>
                    <label htmlFor='file-upload' className="text-sm font-medium">Arquivo</label>
                    <Input id='file-upload' ref={fileInputRef} type="file" onChange={handleFileChange} className="file:text-sm file:font-medium"/>
                 </div>
                 <div className='space-y-2'>
                    <label className="text-sm font-medium">Tipo de Anexo</label>
                     <Select onValueChange={(value: TipoAnexo) => setTipo(value)} value={tipo ?? undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(TipoAnexo).map(type => (
                                <SelectItem key={type} value={type}>
                                    {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1).toLowerCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting || !file || !tipo} className="w-full">
                {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                    <><Paperclip className="mr-2 h-4 w-4" /> Adicionar Anexo</>
                )}
            </Button>
        </form>
    );
}
