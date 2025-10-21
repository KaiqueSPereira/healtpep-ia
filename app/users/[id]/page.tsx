'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Loader2, Edit, Droplet, User as UserIcon, Calendar, Weight } from 'lucide-react';
import PesoHistoryChart from '../_components/PesoHistoryChart';
import { format } from 'date-fns';

interface UserData {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    dataNascimento?: string | null;
    genero?: string | null;
    tipo_sanguineo?: string | null;
    historicoPeso: { id: string; peso: number; data: string }[];
}

const UserProfilePage = () => {
  const { id } = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') return;

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          throw new Error('Usuário não encontrado');
        }
        const data: UserData = await response.json();
        setUser(data);
      } catch (error) {
        console.error(error);
        // Handle error (e.g., redirect to a not-found page)
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const canEdit = session?.user?.id === id;

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Usuário não encontrado.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Perfil do Usuário</h1>
            {canEdit && (
              <Button asChild variant="outline">
                <Link href={`/users/${id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                </Link>
              </Button>
            )}
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={UserIcon} label="Nome" value={user.name} />
                <InfoItem icon={Calendar} label="Data de Nascimento" value={user.dataNascimento ? format(new Date(user.dataNascimento), 'dd/MM/yyyy') : null} />
                <InfoItem icon={UserIcon} label="Gênero" value={user.genero} />
                <InfoItem icon={Droplet} label="Tipo Sanguíneo" value={user.tipo_sanguineo} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Weight className="mr-2" /> Histórico de Peso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* CORRECTED: Type assertion for peso history data */}
              <PesoHistoryChart data={user.historicoPeso as { data: string | Date; peso: number }[]} />
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
    <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-gray-400" />
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="font-semibold">{value || 'Não informado'}</p>
        </div>
    </div>
);

export default UserProfilePage;
