'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/app/_components/ui/button';
import Header from '@/app/_components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { CheckCircle, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/app/_hooks/use-toast';
import Image from 'next/image'; // Importando o componente Image

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Mostrar toast de sucesso se o usuário for redirecionado de volta
    if (searchParams.get('calendar') === 'success') {
      toast({
        title: "Sucesso!",
        description: "Sua conta do Google Agenda foi conectada.",
        variant: "default",
      });
    }

    // Verificar o status da conexão com o Google Calendar
    const checkConnectionStatus = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const response = await fetch('/api/google-calendar/status');
        if (response.ok) {
          const data = await response.json();
          setIsCalendarConnected(data.isConnected);
        } else {
          setIsCalendarConnected(false);
        }
      } catch (error) {
        setIsCalendarConnected(false);
        console.error("Erro ao verificar status do Google Calendar:", error);
      } finally {
        setLoading(false);
      }
    };

    checkConnectionStatus();
  }, [session, searchParams]);

  const handleConnect = () => {
    // Redireciona para o nosso endpoint de API, que por sua vez redirecionará para o Google
    window.location.href = '/api/google-calendar';
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Configurações</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Conecte seus aplicativos de terceiros para aprimorar sua experiência.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                    {/* Substituindo <img> por <Image> */}
                    <Image src="/google-calendar.png" alt="Google Calendar" width={40} height={40} />
                    <div>
                        <h3 className="font-semibold">Google Agenda</h3>
                        <p className="text-sm text-muted-foreground">
                            Sincronize suas consultas e exames com sua agenda pessoal.
                        </p>
                    </div>
                </div>
                
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : isCalendarConnected ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Conectado</span>
                    </div>
                ) : (
                    <Button onClick={handleConnect} variant="outline">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Conectar
                    </Button>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
