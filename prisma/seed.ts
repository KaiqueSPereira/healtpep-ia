
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista de permissões fundamentais do sistema
const permissions = [
  // --- Administração Geral ---
  { name: 'view_admin_dashboard', description: 'Acessar o painel de administração' },
  { name: 'view_error_logs', description: 'Visualizar logs de erro do sistema' },

  // --- Gerenciamento de Usuários ---
  { name: 'manage_users', description: 'Criar, editar e remover usuários' },
  { name: 'assign_roles', description: 'Atribuir perfis aos usuários' },

  // --- Gerenciamento de Perfis e Permissões ---
  { name: 'manage_roles', description: 'Criar, editar e remover perfis (roles)' },
  { name: 'manage_permissions', description: 'Atribuir permissões aos perfis' },
  
  // --- Faturamento e Assinaturas (Exemplos para o Futuro) ---
  // { name: 'manage_billing', description: 'Acessar e gerenciar faturamento' },
  // { name: 'view_analytics', description: 'Visualizar analytics da plataforma' },
];

async function main() {
  console.log('Iniciando o processo de seeding para Perfis e Permissões (RBAC)...');

  // 1. Criar todas as permissões
  // O `skipDuplicates` garante que não teremos erro se o seed rodar novamente.
  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });
  console.log('Permissões criadas/verificadas com sucesso.');

  const allPermissions = await prisma.permission.findMany();

  // 2. Criar o perfil de Administrador e dar todas as permissões a ele
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador com acesso total ao sistema.',
    },
  });

  // Limpa permissões antigas para garantir um estado limpo
  await prisma.permissionOnRole.deleteMany({ where: { roleId: adminRole.id } });
  // Associa todas as permissões ao perfil ADMIN
  await prisma.permissionOnRole.createMany({
    data: allPermissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    })),
  });
  console.log(`Perfil 'ADMIN' criado e associado a ${allPermissions.length} permissões.`);

  // 3. Criar o perfil de Usuário padrão (sem permissões especiais iniciais)
  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Usuário padrão com permissões básicas de uso da plataforma.',
    },
  });
  console.log("Perfil 'USER' criado com sucesso.");

  console.log('Seeding de RBAC finalizado com sucesso!');
}

main()
  .catch(e => {
    console.error('Ocorreu um erro durante o seeding de RBAC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
