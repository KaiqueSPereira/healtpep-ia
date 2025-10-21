'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ChevronRight, Edit } from 'lucide-react';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import AgendamentoItem from '@/app/consulta/components/agendamentosItem';
import Link from 'next/link';
import CondicaoSaudeSelectorMultiple from '@/app/condicoes/_Components/TratamentoSelectorMultiple';
import type { Prisma } from '@prisma/client';

type ProfissionalCompleto = Prisma.ProfissionalGetPayload<{
  include: {
    consultas: { include: { unidade: true } };
    exames: { include: { unidades: true, usuario: true } };
    condicoesSaude: true;
    unidades: true;
  }
}>;
type ConsultaComUnidade = ProfissionalCompleto['consultas'][0];
type ExameComDetalhes = ProfissionalCompleto['exames'][0];

const ProfissionalDetalhesPage = () => {
  const { profissionalId } = useParams<{ profissionalId: string }>();
  const router = useRouter();
  const [profissional, setProfissional] = useState<ProfissionalCompleto | null>(null);
  const [consultas, setConsultas] = useState<ConsultaComUnidade[]>([]);
  const [exames, setExames] = useState<ExameComDetalhes[]>([]);
  const [condicoesSaude, setCondicoesSaude] = useState<Prisma.CondicaoSaudeGetPayload<{}>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profRes = await fetch(`/api/profissionais/${profissionalId}`);
        if (!profRes.ok) {
          const errorData = await profRes.json();
          throw new Error(errorData.error || 'Erro ao carregar dados do profissional');
        }
        const profData: ProfissionalCompleto = await profRes.json();
        setProfissional(profData);
        setConsultas(profData.consultas || []);
        setExames(profData.exames || []);
        setCondicoesSaude(profData.condicoesSaude || []);
      } catch (err: unknown) {
        console.error('Erro ao carregar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados desconhecido');
      } finally {
        setLoading(false);
      }
    };
    if (profissionalId) fetchData();
  }, [profissionalId]);

  const handleExameClick = (exameId: string) => { router.push(`/exames/${exameId}`); };
  
  if (loading) return (<div className="flex min-h-screen items-center justify-center py-10"> <Loader2 className="h-8 w-8 animate-spin" /> </div>);
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!profissional) return <div className="text-center py-10">Profissional não encontrado.</div>;

  return (
    <div className="flex flex-col">
      <Header />
      <div className="p-4 flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()} > <ChevronRight className="mr-2 h-4 w-4 transform rotate-180" /> Voltar </Button>
        <Button variant="outline" size="icon" asChild> 
            <Link href={`/profissionais/${profissional.id}/editar`}> <Edit className="h-4 w-4" /> </Link> 
        </Button>
      </div>

      <main className="container mx-auto flex-1 p-4">
        <h1 className="mb-6 text-2xl font-bold text-center">{profissional.nome}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card> <CardHeader><CardTitle>Especialidade</CardTitle></CardHeader> <CardContent><p>{profissional.especialidade || 'N/A'}</p></CardContent> </Card>
          <Card> <CardHeader><CardTitle>Número de Classe</CardTitle></CardHeader> <CardContent><p>{profissional.NumClasse || 'N/A'}</p></CardContent> </Card>

          {profissional.unidades && profissional.unidades.length > 0 && (
            <Card className="md:col-span-2"> <CardHeader><CardTitle>Unidades Vinculadas</CardTitle></CardHeader>
              <CardContent> <ul className="list-disc list-inside pl-4 space-y-1">
                  {profissional.unidades.map(unidade => ( <li key={unidade.id}>{unidade.nome} ({unidade.tipo})</li> ))}
              </ul> </CardContent>
            </Card>
          )}

          <Card> <CardHeader><CardTitle>Gerenciar Condições de Saúde</CardTitle></CardHeader>
            <CardContent> <CondicaoSaudeSelectorMultiple profissionalId={profissional.id} currentCondicoes={condicoesSaude} onCondicoesChange={setCondicoesSaude} /> </CardContent>
          </Card>

          <Card className="md:col-span-2"> <CardHeader><CardTitle>Últimos Agendamentos</CardTitle></CardHeader>
            <CardContent> <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                {consultas.length > 0 ? (
                  consultas.map((consulta) => (
                    <AgendamentoItem
                      key={consulta.id}
                      agendamento={{
                        id: consulta.id,
                        // CORREÇÃO: Adiciona a propriedade userId que era obrigatória.
                        userId: consulta.userId,
                        tipo: 'Consulta',
                        data: consulta.data,
                        nomeProfissional: profissional.nome || '',
                        especialidade: profissional.especialidade || 'Clínico Geral',
                        local: consulta.unidade?.nome || 'Não especificado',
                      }}
                    />
                  ))
                ) : (<p className="text-center text-gray-500">Nenhuma consulta encontrada.</p>)}
            </div> </CardContent>
          </Card>

          <Card className="md:col-span-2"> <CardHeader><CardTitle>Últimos Exames</CardTitle></CardHeader>
            <CardContent> <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                {exames.length > 0 ? (
                  exames.map((exame) => (
                    <div key={exame.id} className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-100" onClick={() => handleExameClick(exame.id)}>
                      <div>
                        <p className="font-medium">{exame.tipo}</p>
                        <p className="text-sm text-gray-500">
                          {/* CORREÇÃO: Substitui o 'dataExame' antigo pelo 'data' correto. */}
                          {new Date(exame.dataExame).toLocaleDateString()} -{' '}                          {exame.tipo}
                        </p>
                        {exame.usuario?.name && (<p className="text-sm text-gray-500"> Usuário: {exame.usuario.name} </p>)}
                        {exame.unidades?.nome && (<p className="text-sm text-gray-500"> Unidade: {exame.unidades.nome} </p>)}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))
                ) : (<p className="text-center text-gray-500">Nenhum exame encontrado.</p>)}
            </div> </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default ProfissionalDetalhesPage;
