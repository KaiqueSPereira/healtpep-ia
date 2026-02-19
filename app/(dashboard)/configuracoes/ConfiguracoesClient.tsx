'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';

export default function ConfiguracoesClient() {

  return (
    <div className="flex flex-col h-screen bg-background">
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
              <div className="flex items-center justify-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Nenhuma integração disponível no momento.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
