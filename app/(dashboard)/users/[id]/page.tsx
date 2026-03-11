'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams} from 'next/navigation';
import useAuthStore from '@/app/_stores/authStore';
import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Loader2, Edit, Droplet, User as UserIcon, Calendar, Weight, HeartPulse, PlusCircle, Stethoscope, Activity } from 'lucide-react';
import EditCondicaoSaudeDialog from '../_components/EditCondicaoSaudeDialog';
import { Profissional } from '@prisma/client';
import PesoHistoryChart from '../_components/PesoHistoryChart';
import BioimpedanciaTab from '../_components/BioimpedanciaTab';
import IMCChart from '../_components/IMCChart';
import BodyMeasurementChart from '../_components/BodyMeasurementChart';
import RegistrosDetalhadosTable from '../_components/RegistrosDetalhadosTable';

interface CondicaoSaude {
  id: string;
  nome: string;
  dataInicio: string;
  objetivo?: string | null;
  observacoes?: string | null;
  profissional?: Profissional | null;
}

interface PesoRegistro {
  id: string;
  data: string;
  peso: string;
  pescoco?: string | null;
  torax?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  bracoE?: string | null;
  bracoD?: string | null;
  pernaE?: string | null;
  pernaD?: string | null;
  pantE?: string | null;
  pantD?: string | null;
  gorduraCorporal?: string | null;
  massaMuscular?: string | null;
  gorduraVisceral?: string | null;
  taxaMetabolica?: string | null;
  idadeCorporal?: string | null;
  massaOssea?: string | null;
  aguaCorporal?: string | null;
}

interface UserData {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    dadosSaude?: { dataNascimento?: string | null; sexo?: string | null; tipoSanguineo?: string | null; altura?: string | null; } | null;
    historicoPeso: PesoRegistro[];
    condicoesSaude: CondicaoSaude[];
}

const UserProfilePage = () => {
  const { id } = useParams();
  const { session } = useAuthStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndMedidas = useCallback(async () => {
    if (typeof id !== 'string') return;
    setLoading(true);
    try {
      const userResponse = await fetch(`/api/users/${id}`);
      if (!userResponse.ok) throw new Error('Usuário não encontrado');
      const userData: Omit<UserData, 'historicoPeso'> = await userResponse.json();

      const medidasResponse = await fetch(`/api/users/${id}/medidas`);
       let mergedHistorico: PesoRegistro[] = [];
      if (medidasResponse.ok) {
          const medidasData = await medidasResponse.json();
          mergedHistorico = medidasData.acompanhamentos.map((acomp: any) => {
            const bio = medidasData.bioimpedancias.find(
              (b: any) => new Date(b.data).toDateString() === new Date(acomp.data).toDateString()
            );
            return { ...acomp, ...bio };
          });
      }

      setUser({ ...userData, historicoPeso: mergedHistorico });

    } catch (error) {
      console.error(error);
       if (user) {
        setUser({ ...user, historicoPeso: [] });
      }
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (id) {
        fetchUserAndMedidas();
    }
  }, [id]);

  const userHeightForIMC = user?.dadosSaude?.altura ? parseFloat(user.dadosSaude.altura) : null;
  const canEdit = session?.user?.id === id;

  if (loading && !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Usuário não encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Perfil do Usuário</h1>
        {canEdit && (
          <Button asChild variant="outline"><Link href={`/users/${id}/editar`}><Edit className="mr-2 h-4 w-4" /> Editar Perfil</Link></Button>
        )}
      </div>

      <Tabs defaultValue="health-analysis" className="w-full flex flex-col">
        <TabsList className="grid w-full h-auto grid-cols-1 sm:h-10 sm:grid-cols-3">
          <TabsTrigger value="personal-info"><UserIcon className="mr-2 h-4 w-4" /> Informações Pessoais</TabsTrigger>
          <TabsTrigger value="health-conditions"><HeartPulse className="mr-2 h-4 w-4" /> Condições de Saúde</TabsTrigger>
          <TabsTrigger value="health-analysis"><Activity className="mr-2 h-4 w-4" /> Análise de Saúde</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal-info" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={UserIcon} label="Nome" value={user.name} />
              <InfoItem icon={Calendar} label="Data de Nascimento" value={user.dadosSaude?.dataNascimento ? new Date(user.dadosSaude.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null} />
              <InfoItem icon={UserIcon} label="Gênero" value={user.dadosSaude?.sexo} />
              <InfoItem icon={Droplet} label="Tipo Sanguíneo" value={user.dadosSaude?.tipoSanguineo} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health-conditions" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center"><HeartPulse className="mr-2" /> Condições de Saúde</CardTitle>
                  {canEdit && <Button asChild variant="outline" size="sm"><Link href={`/condicoes/novo?userId=${id}`}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Link></Button>}
                </div>
              </CardHeader>
              <CardContent>
                {user.condicoesSaude?.length > 0 ? (
                  <ul className="space-y-4">
                    {user.condicoesSaude.map(cond => (
                      <li key={cond.id} className="flex justify-between items-start p-3 rounded-md border">
                        <div className="flex-1">
                          <p className="font-semibold">{cond.nome}</p>
                          {cond.profissional && <p className="text-sm text-muted-foreground flex items-center mt-1"><Stethoscope className="h-4 w-4 mr-2" />{cond.profissional.nome} - {cond.profissional.especialidade}</p>}
                        </div>
                        {canEdit && <EditCondicaoSaudeDialog condicao={cond} onCondicaoUpdated={fetchUserAndMedidas} />}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted-foreground">Nenhuma condição de saúde registrada.</p>}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="health-analysis" className="mt-6 space-y-6">
            <Card>
                 <CardHeader><CardTitle className="flex items-center"><Weight className="mr-2" /> Análise Corporal</CardTitle></CardHeader>
                 <CardContent className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
                    <div className="lg:col-span-4">
                        <IMCChart userId={user.id} userHeight={userHeightForIMC} historicoPeso={user.historicoPeso} loadingHistorico={loading} errorHistorico={null} />
                    </div>
                    <div className="lg:col-span-6">
                        <PesoHistoryChart userId={user.id} historicoPeso={user.historicoPeso} altura={userHeightForIMC} onDataChange={fetchUserAndMedidas} />
                    </div>
                    <div className="lg:col-span-5">
                        <BodyMeasurementChart historicoPeso={user.historicoPeso} />
                    </div>
                    <div className="lg:col-span-5">
                        <RegistrosDetalhadosTable userId={user.id} registros={user.historicoPeso} altura={userHeightForIMC} onDataChange={fetchUserAndMedidas} />
                    </div>
                 </CardContent>
            </Card>
            <BioimpedanciaTab historico={user.historicoPeso} />
          </TabsContent>
      </Tabs>
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
