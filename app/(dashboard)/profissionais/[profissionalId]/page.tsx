
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Avatar, AvatarFallback } from "@/app/_components/ui/avatar";
import { Button } from "@/app/_components/ui/button"; // Mantido para o botão de edição
import Link from "next/link";
import AgendamentoItem from "../../consulta/components/agendamentosItem";


interface ProfissionalDetailsPageProps {
    params: {
        profissionalId: string;
    };
}

const ProfissionalDetailsPage = async ({ params }: ProfissionalDetailsPageProps) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return notFound();
    }

    const profissional = await db.profissional.findUnique({
        where: {
            id: params.profissionalId,
            userId: session.user.id,
        },
    });

    if (!profissional) {
        return notFound();
    }

    const consultas = await db.consultas.findMany({
        where: {
            profissionalId: params.profissionalId,
            userId: session.user.id,
        },
        include: {
            unidade: true,
        },
        orderBy: {
            data: 'desc',
        },
    });

    const agora = new Date();
    const consultasFuturas = consultas
        .filter(c => new Date(c.data) >= agora)
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const consultasPassadas = consultas
        .filter(c => new Date(c.data) < agora);

    const inicialDoNome = profissional.nome?.charAt(0).toUpperCase() || '?';

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24">
                        {/* Se houver uma URL de imagem, pode ser usada aqui */}
                        {/* <AvatarImage src={profissional.imageUrl} alt={profissional.nome} /> */}
                        <AvatarFallback>{inicialDoNome}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl font-bold">{profissional.nome}</h1>
                        {profissional.especialidade && (
                            <p className="text-lg text-muted-foreground">{profissional.especialidade}</p>
                        )}
                    </div>
                    <Link href={`/profissionais/${profissional.id}/edit`}>
                        <Button variant="outline">Editar</Button>
                    </Link>
                </CardContent>
            </Card>

            <section>
                <h2 className="text-xl font-semibold mb-4">Consultas Agendadas</h2>
                {consultasFuturas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {consultasFuturas.map(consulta => (
                            <AgendamentoItem
                                key={consulta.id}
                                agendamento={{
                                    id: consulta.id,
                                    // Correção: A propriedade 'userId' foi removida, pois não existe no tipo AgendamentoUnificado
                                    tipo: 'Consulta',
                                    data: new Date(consulta.data).toISOString(),
                                    nomeProfissional: profissional.nome || '',
                                    especialidade: profissional.especialidade || 'Clínico Geral',
                                    local: consulta.unidade?.nome || 'Não informado',
                                    tipoConsulta: consulta.tipo,
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Nenhuma consulta agendada com este profissional.</p>
                )}
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Histórico de Consultas</h2>
                {consultasPassadas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {consultasPassadas.map(consulta => (
                            <AgendamentoItem
                                key={consulta.id}
                                agendamento={{
                                    id: consulta.id,
                                     // Correção: A propriedade 'userId' foi removida
                                    tipo: 'Consulta',
                                    data: new Date(consulta.data).toISOString(),
                                    nomeProfissional: profissional.nome || '',
                                    especialidade: profissional.especialidade || 'Clínico Geral',
                                    local: consulta.unidade?.nome || 'Não informado',
                                    tipoConsulta: consulta.tipo,
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Nenhum histórico de consultas com este profissional.</p>
                )}
            </section>
        </div>
    );
};

export default ProfissionalDetailsPage;
