'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams} from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2, Edit, Droplet, User as UserIcon, Calendar, Weight, HeartPulse, PlusCircle, Stethoscope } from 'lucide-react';
import EditCondicaoSaudeDialog from './_components/EditCondicaoSaudeDialog';
import { Profissional } from '@prisma/client';
import IMCChart from '../_components/IMCChart';
import PesoHistoryChart from '../_components/PesoHistoryChart';

interface CondicaoSaude {
  id: string;
  nome: string;
  dataInicio: string;
  objetivo?: string | null;
  observacoes?: string | null;
  profissional?: Profissional | null;
}

interface UserData {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    dadosSaude?: { dataNascimento?: string | null; sexo?: string | null; tipoSanguineo?: string | null; altura?: string | null; } | null;
    historicoPeso: { id: string; peso: string; data: string }[];
    condicoesSaude: CondicaoSaude[];
}

const UserProfilePage = () => {
  const { id } = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (typeof id !== 'string') return;
    // A lógica de `!loading` foi removida para permitir o recarregamento
    setLoading(true);
    try {
      const response = await fetch(`/api/pacientes/dashboard/${id}`);
      if (!response.ok) throw new Error('Usuário não encontrado');
      const data: UserData = await response.json();
      setUser(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) { // Garante que o ID exista antes de buscar
        fetchUser();
    }
  }, [id, fetchUser]);


  const userHeightForIMC = user?.dadosSaude?.altura ? parseFloat(user.dadosSaude.altura) : null;
  const canEdit = session?.user?.id === id;

  if (loading && !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Usuário não encontrado.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Perfil do Usuário</h1>
            {canEdit && (
              <Button asChild variant="outline"><Link href={`/users/${id}/editar`}><Edit className="mr-2 h-4 w-4" /> Editar Perfil</Link></Button>
            )}
          </div>

          <Card className="mb-6">
            <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={UserIcon} label="Nome" value={user.name} />
              <InfoItem icon={Calendar} label="Data de Nascimento" value={user.dadosSaude?.dataNascimento ? new Date(user.dadosSaude.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null} />
              <InfoItem icon={UserIcon} label="Gênero" value={user.dadosSaude?.sexo} />
              <InfoItem icon={Droplet} label="Tipo Sanguíneo" value={user.dadosSaude?.tipoSanguineo} />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center"><HeartPulse className="mr-2" /> Condições de Saúde</CardTitle>
                {canEdit && (
                  <Button asChild variant="outline" size="sm"><Link href={`/condicoes/novo?userId=${id}`}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Link></Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {user.condicoesSaude?.length > 0 ? (
                <ul className="space-y-4">
                  {user.condicoesSaude.map(cond => (
                    <li key={cond.id} className="flex justify-between items-start p-3 rounded-md border">
                        <div className="flex-1">
                            <p className="font-semibold">{cond.nome}</p>
                            {cond.profissional && (
                                <div className="text-sm text-muted-foreground flex items-center mt-1">
                                    <Stethoscope className="h-4 w-4 mr-2" />
                                    <span>{cond.profissional.nome} - {cond.profissional.especialidade}</span>
                                </div>
                            )}
                        </div>
                        {canEdit && <EditCondicaoSaudeDialog condicao={cond} onCondicaoUpdated={fetchUser} />}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">Nenhuma condição de saúde registrada.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><Weight className="mr-2" /> Análise de Peso</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
               <div className="col-span-1">
                <IMCChart 
                  userId={user.id}
                  userHeight={userHeightForIMC}
                  historicoPeso={user.historicoPeso}
                  loadingHistorico={loading}
                  errorHistorico={null}
                />
              </div>
              <div className="col-span-1">
                 <PesoHistoryChart 
                    userId={user.id}
                    historicoPeso={user.historicoPeso}
                    loading={loading}
                    error={null}
                    onDataChange={fetchUser}
                 />
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
    <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="font-semibold">{value || 'Não informado'}</p>
        </div>
    </div>
);

export default UserProfilePage;
