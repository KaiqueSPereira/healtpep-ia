import Header from "@/app/_components/header";
import { prisma } from "@/app/_lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { RolesTable } from "@/app/admin/_components/roles-table";

async function getRolesAndPermissions() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      // Inclui os novos limites de recursos no carregamento dos dados
      resourceLimits: true, 
      _count: {
        select: { users: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const permissions = await prisma.permission.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  // A tipagem 'any' é uma solução temporária para passar os dados complexos
  // do Server Component para o Client Component sem problemas de serialização.
  return { roles: roles as any, permissions };
}

export default async function AdminRolesPage() {
  const { roles, permissions } = await getRolesAndPermissions();

  return (
    <div>
      <Header />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Perfis e Planos</CardTitle>
            <CardDescription>
              Crie e edite os perfis de acesso e os planos de assinatura. Defina limites de recursos
              e permissões específicas para cada um.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RolesTable roles={roles} permissions={permissions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}