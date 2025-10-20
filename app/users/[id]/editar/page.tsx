"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/app/_components/header';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Label } from "@/app/_components/ui/label";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/_components/ui/select";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/app/_hooks/use-toast";
import { Textarea } from '@/app/_components/ui/textarea';

interface DadosSaudePayload {
    CNS?: string | null;
    tipoSanguineo?: string | null;
    sexo?: string | null;
    dataNascimento?: string | null;
    altura?: string | null;
    alergias?: string[];
}

interface UserData {
    id: string;
    name?: string | null;
    email: string;
    dadosSaude?: DadosSaudePayload | null;
}

export default function UserEditPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { toast } = useToast();

    const [formData, setFormData] = useState<UserData | null>(null);
    const [alergiasInput, setAlergiasInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchUserData = async () => {
            setLoading(true);
            try {
                // CORREÇÃO: Busca dados da API unificada do dashboard
                const response = await fetch(`/api/pacientes/dashboard/${id}`);
                if (!response.ok) throw new Error('Erro ao carregar dados para edição.');
                
                const data = await response.json();
                setFormData(data);
                // Converte o array de alergias em uma string para o textarea
                if (data.dadosSaude && Array.isArray(data.dadosSaude.alergias)) {
                    setAlergiasInput(data.dadosSaude.alergias.join(', '));
                }

            } catch (err: any) {
                toast({ variant: "destructive", title: "Erro", description: err.message || "Não foi possível carregar os dados." });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => {
            if (!prev) return null;
            const newData = { ...prev };
            if (!newData.dadosSaude) newData.dadosSaude = {};
            (newData.dadosSaude as any)[id] = value === '' ? null : value;
            return newData;
        });
    };

    const handleSelectChange = (id: keyof DadosSaudePayload, value: string) => {
        setFormData(prev => {
            if (!prev) return null;
            const newData = { ...prev };
            if (!newData.dadosSaude) newData.dadosSaude = {};
            (newData.dadosSaude as any)[id] = value === '' ? null : value;
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || isSaving) return;

        setIsSaving(true);

        try {
            // Converte a string de alergias de volta para um array
            const alergiasArray = alergiasInput.split(',').map(item => item.trim()).filter(Boolean);

            const payload = {
                dadosSaude: {
                    ...formData.dadosSaude,
                    alergias: alergiasArray,
                },
            };

            // CORREÇÃO: Usa o método PATCH para a API unificada
            const response = await fetch(`/api/pacientes/dashboard/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar alterações.');
            }

            toast({ title: "Sucesso!", description: "Dados do paciente atualizados." });
            router.push(`/users/${id}`);

        } catch (err: any) {
            toast({ variant: "destructive", title: "Erro ao Salvar", description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const formatarDataParaInput = (data: string | null | undefined) => {
        if (!data) return '';
        return new Date(data).toISOString().split('T')[0];
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (!formData) return <div className="text-center p-4">Nenhum dado encontrado.</div>;

    return (
        <>
            <Header />
            <div className="container mx-auto p-4 max-w-2xl">
                <Card>
                    <CardHeader><CardTitle>Editar Perfil do Paciente</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" value={formData.name || ''} readOnly className="bg-gray-100" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} readOnly className="bg-gray-100"/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                                    <Input id="dataNascimento" type="date" value={formatarDataParaInput(formData.dadosSaude?.dataNascimento)} onChange={handleChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="altura">Altura (cm)</Label>
                                    <Input id="altura" type="number" step="1" value={formData.dadosSaude?.altura || ''} onChange={handleChange} placeholder="Ex: 175" />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="sexo">Sexo</Label>
                                    <Select onValueChange={(value) => handleSelectChange('sexo', value)} value={formData.dadosSaude?.sexo || ''}>
                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Masculino">Masculino</SelectItem>
                                            <SelectItem value="Feminino">Feminino</SelectItem>
                                            <SelectItem value="Outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tipoSanguineo">Tipo Sanguíneo</Label>
                                    <Select onValueChange={(value) => handleSelectChange('tipoSanguineo', value)} value={formData.dadosSaude?.tipoSanguineo || ''}>
                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem>
                                            <SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem>
                                            <SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem>
                                            <SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="CNS">CNS (Cartão Nacional de Saúde)</Label>
                                <Input id="CNS" value={formData.dadosSaude?.CNS || ''} onChange={handleChange} placeholder="Digite o número do CNS" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="alergias">Alergias (separadas por vírgula)</Label>
                                <Textarea id="alergias" value={alergiasInput} onChange={(e) => setAlergiasInput(e.target.value)} placeholder="Ex: Penicilina, Frutos do mar, Pólen" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancelar</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
