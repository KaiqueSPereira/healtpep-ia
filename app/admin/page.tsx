import { BarChart, Users, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../_components/ui/card";
import Header from "../_components/header"; // Importando o Header

export default function AdminDashboard() {
  return (
    // Adicionando um fragmento para agrupar o Header e o conteúdo
    <>
      <Header />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Bem-vindo à área de controle. Use os links abaixo para gerenciar a plataforma.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users" passHref>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Gerenciar Usuários</CardTitle>
                <Users className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize, edite perfis e gerencie os usuários do sistema.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/roles" passHref>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Gerenciar Perfis</CardTitle>
                <Settings className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crie e configure os perfis de acesso e suas permissões.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/logs" passHref>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Logs do Sistema</CardTitle>
                <FileText className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize os logs de erro e eventos importantes da aplicação.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          {/* Card de Analytics (Exemplo) */}
          <Card className="opacity-50 cursor-not-allowed">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Analytics</CardTitle>
              <BarChart className="h-6 w-6 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                (Em breve) Métricas e dados de uso da plataforma.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
