'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/app/_components/header';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Textarea } from '@/app/_components/ui/textarea';
import { Label } from '@/app/_components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const NovaCondicaoPage = () => {
  const router = useRouter();
  const { id: userId } = useParams();
  const { data: session } = useSession();

  const [nome, setNome] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [cidCodigo, setCidCodigo] = useState('');
  const [cidDescricao, setCidDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!nome || !dataInicio) {
        setError('O nome da condição e a data de início são obrigatórios.');
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(`/api/pacientes/dashboard/${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            objetivo,
            dataInicio,
            observacoes,
            cidCodigo,
            cidDescricao,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao adicionar condição de saúde');
      }

      // Redireciona para a página de perfil após o sucesso
      router.push(`/users/${userId}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Proteção: Apenas o próprio usuário pode adicionar uma condição
  if (session && session.user?.id !== userId) {
      return (
          <div className="flex h-screen items-center justify-center">
              Acesso negado. Você só pode adicionar condições ao seu próprio perfil.
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
            <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href={`/users/${userId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Perfil
                </Link>
            </Button>
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Condição de Saúde</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="nome">Nome da Condição *</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="objetivo">Objetivo do Tratamento</Label>
                  <Textarea id="objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ex: Controlar a pressão arterial, aliviar a dor..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="cidCodigo">Código CID</Label>
                        <Input id="cidCodigo" value={cidCodigo} onChange={(e) => setCidCodigo(e.target.value)} placeholder="Ex: I10" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="cidDescricao">Descrição CID</Label>
                        <Input id="cidDescricao" value={cidDescricao} onChange={(e) => setCidDescricao(e.target.value)} placeholder="Ex: Hipertensão essencial" />
                    </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Qualquer nota relevante..." />
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Condição'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NovaCondicaoPage;
