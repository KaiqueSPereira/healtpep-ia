import Header from "@/app/_components/header";
import { prisma } from "@/app/_lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { RolesTable, type RoleWithDetails } from "@/app/admin/_components/roles-table";
import type { Permission } from "@prisma/client";

async function getRolesAndPermissions(): Promise<{ roles: RoleWithDetails[], permissions: Permission[] }> {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
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

  return { roles, permissions };
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