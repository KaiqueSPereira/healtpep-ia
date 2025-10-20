'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/app/_components/header';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Label } from "@/app/_components/ui/label";
import { Avatar, AvatarImage } from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button";
import { Loader2, AlertTriangle, ChevronRight, PlusCircle } from 'lucide-react';
import Link from "next/link";
import { useToast } from "@/app/_hooks/use-toast";
import PesoHistoryChart from '@/app/users/_components/PesoHistoryChart';
import IMCChart from '../_components/IMCChart';
import { Badge } from '@/app/_components/ui/badge';

// Interface unificada para os dados do dashboard
interface UserDashboardData {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    dadosSaude: {
        id: string;
        userId: string;
        CNS: string | null;
        tipoSanguineo: string | null;
        sexo: string | null;
        dataNascimento: string | null;
        altura: string | null;
        alergias: string[];
    } | null;
    historicoPeso: {
        id: string;
        peso: string;
        data: string;
    }[];
    condicoesSaude: {
        id: string;
        nome: string;
        createdAt: string;
        cidCodigo: string | null;
        cidDescricao: string | null;
        profissional: { nome: string; especialidade: string; } | null;
    }[];
}

const calcularIdade = (dataNascimento: string | null | undefined): number | null => {
    if (!dataNascimento) return null;
    const today = new Date();
    const birthDate = new Date(dataNascimento);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const formatarData = (data: string | null | undefined) => {
    if (!data) return "Não informado";
    const dateObj = new Date(data);
    if (isNaN(dateObj.getTime())) return "Data inválida";
    return dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default function UserProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();

    const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pacientes/dashboard/${id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao carregar dados do paciente`);
            }
            const data: UserDashboardData = await response.json();
            setDashboardData(data);
            setError(null);
        } catch (err: any) {
            const errorMessage = err.message || "Ocorreu um erro inesperado.";
            setError(errorMessage);
            toast({ variant: "destructive", title: "Erro ao Carregar Dados", description: errorMessage });
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        if (id) {
            fetchDashboardData();
        } else {
             setError("ID do usuário não fornecido.");
             setLoading(false);
        }
    }, [id, fetchDashboardData]);

    const alturaNumerica = dashboardData?.dadosSaude?.altura ? parseFloat(dashboardData.dadosSaude.altura) : null;

    return (
        <>
            <Header />
            <div className="container mx-auto p-4">
                {loading ? (
                    <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin" /></div>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : !dashboardData ? (
                    <p className="text-center">Nenhum dado de usuário encontrado.</p>
                ) : (
                    <Card className="border-none">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Perfil do Paciente</CardTitle>
                                <Link href={`/users/${dashboardData.id}/editar`} passHref><Button variant="outline" size="sm">Editar</Button></Link>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-semibold">
                                            {dashboardData.name || "Não informado"}
                                            <span className="text-lg font-normal text-muted-foreground ml-2">
                                                {dashboardData.dadosSaude?.dataNascimento ? `(${calcularIdade(dashboardData.dadosSaude.dataNascimento)} anos)` : ''}
                                            </span>
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{dashboardData.email}</p>
                                </div>
                                {dashboardData.image && (
                                    <Avatar className="h-24 w-24 border"><AvatarImage src={dashboardData.image} alt={dashboardData.name || "User Image"} /></Avatar>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><Label>Tipo Sanguíneo</Label><p className="font-semibold">{dashboardData.dadosSaude?.tipoSanguineo || "-"}</p></div>
                                <div><Label>Sexo</Label><p className="font-semibold">{dashboardData.dadosSaude?.sexo || "-"}</p></div>
                                <div><Label>Nascimento</Label><p className="font-semibold">{formatarData(dashboardData.dadosSaude?.dataNascimento)}</p></div>
                                <div><Label>CNS</Label><p className="font-semibold">{dashboardData.dadosSaude?.CNS || "-"}</p></div>
                            </div>

                            <div>
                                <Label>Alergias</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {dashboardData.dadosSaude?.alergias?.length ? (
                                        dashboardData.dadosSaude.alergias.map((alergia, index) => (
                                            <Badge key={index} variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{alergia}</Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Nenhuma alergia informada.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <PesoHistoryChart 
                                        userId={dashboardData.id}
                                        historicoPeso={dashboardData.historicoPeso} 
                                        loading={loading}
                                        error={error}
                                        onDataChange={fetchDashboardData}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                     {alturaNumerica ? (
                                        <IMCChart
                                            userHeight={alturaNumerica}
                                            historicoPeso={dashboardData.historicoPeso}
                                        />
                                    ) : (
                                        <div className='flex items-center justify-center h-full bg-gray-100 rounded-lg p-4'>
                                            <p className='text-sm text-center text-muted-foreground'>Informe a altura do paciente para calcular o IMC.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold">Condições de Saúde</h3>
                                     <Link href={`/condicoes/novo?userId=${dashboardData.id}`} passHref>
                                        <Button variant="outline" size="sm"><PlusCircle className="h-4 w-4 mr-2"/>Adicionar</Button>
                                    </Link>
                                </div>
                                {dashboardData.condicoesSaude?.length ? (
                                    <div className="grid gap-3">
                                        {dashboardData.condicoesSaude.map((condicao) => (
                                            <Link href={`/condicoes/${condicao.id}`} key={condicao.id} passHref>
                                                <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
                                                    <CardContent className="p-4 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-semibold">{condicao.nome}</p>
                                                            {condicao.cidCodigo && (
                                                                <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded-md inline-block my-1">
                                                                    {condicao.cidCodigo}: {condicao.cidDescricao}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground">Registrado em: {formatarData(condicao.createdAt)}</p>
                                                            {condicao.profissional && (
                                                                <p className="text-sm text-muted-foreground">com {condicao.profissional.nome} ({condicao.profissional.especialidade})</p>
                                                            )}
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center pt-4">Nenhuma condição de saúde encontrada.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
