
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/_components/ui/card";
import { getUsersAndRoles } from "./actions";
import { UserTable } from "./components/user-table";

// A página é um Server Component assíncrono que busca dados e os passa para um Client Component.
export default async function ManageUsersPage() {

  try {
    // Os dados são buscados no lado do servidor, antes da página ser enviada ao cliente.
    const { users, roles } = await getUsersAndRoles();
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Atribua perfis aos usuários para controlar suas permissões no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* O Client Component 'UserTable' recebe os dados iniciais como props */}
          <UserTable initialUsers={users} initialRoles={roles} />
        </CardContent>
      </Card>
    );

  } catch (error) {
    // Se ocorrer um erro (ex: usuário não tem permissão), exibimos uma mensagem amigável.
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    console.error("[ManageUsersPage] Erro ao buscar dados:", errorMessage);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Atribua perfis aos usuários para controlar suas permissões no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold text-destructive">Falha ao Carregar Usuários</h3>
                <p className="mt-2 text-sm text-center text-muted-foreground">
                    {errorMessage}
                </p>
                <p className="mt-1 text-xs text-center text-muted-foreground">
                    Tente atualizar a página. Se o erro persistir, contate um administrador.
                </p>
            </div>
        </CardContent>
      </Card>
    )
  }
}
