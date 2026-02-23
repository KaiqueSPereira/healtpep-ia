import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/_components/ui/card";
import { getUsersAndRoles } from "./actions";
import { UserTable } from "./components/user-table";

export default async function ManageUsersPage() {

  try {
    const { users, roles } = await getUsersAndRoles();
  
    return (
      <>
        <div className="container mx-auto p-4 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Atribua perfis aos usuários para controlar suas permissões no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable initialUsers={users} initialRoles={roles} />
            </CardContent>
          </Card>
        </div>
      </>
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    console.error("[ManageUsersPage] Erro ao buscar dados:", errorMessage);

    return (
      <>
        <div className="container mx-auto p-4 md:p-8">
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
        </div>
      </>
    )
  }
}
