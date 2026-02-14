'use server';

import { db } from "@/app/_lib/prisma";
import { manageableResources } from '@/app/admin/_config/resources';
import type { Role, Permission, ResourceLimit } from "@prisma/client";

// Tipagem interna para o perfil completo com todas as relações
type RoleDetails = Role & {
  permissions: { permission: Permission }[];
  resourceLimits: ResourceLimit[];
};

/**
 * A classe UserPermissions é um objeto auxiliar que contém os detalhes do perfil
 * de um usuário e fornece métodos fáceis para verificar permissões e limites.
 */
export class UserPermissions {
  private role: RoleDetails | null;
  private userId: string;

  constructor(userId: string, role: RoleDetails | null) {
    this.userId = userId;
    this.role = role;
  }

  /**
   * Verifica se o usuário tem uma permissão de acesso específica (flag booleana).
   * @param permissionName - O nome da permissão (ex: 'manage_users').
   * @returns `true` se o usuário tiver a permissão, senão `false`.
   */
  can(permissionName: string): boolean {
    if (!this.role) return false;
    // Você pode adicionar uma regra especial para um super administrador aqui se quiser
    // if (this.role.name === 'SUPER_ADMIN') return true;
    return this.role.permissions.some(p => p.permission.name === permissionName);
  }

  /**
   * Retorna o limite numérico para um recurso específico.
   * @param resource - O nome do recurso (ex: 'exams').
   * @returns O limite numérico. Retorna `Infinity` para ilimitado e `0` se não definido.
   */
  limitFor(resource: keyof typeof manageableResources): number {
    if (!this.role) return 0;
    const limit = this.role.resourceLimits.find(l => l.resource === resource);
    if (!limit) return 0;
    return limit.limit === -1 ? Infinity : limit.limit;
  }

  /**
   * Verifica se o usuário já atingiu ou ultrapassou o limite para um recurso.
   * @param resource - O nome do recurso (ex: 'exams').
   * @returns `true` se o limite foi atingido, senão `false`.
   */
  async hasReachedLimit(resource: keyof typeof manageableResources): Promise<boolean> {
    const limit = this.limitFor(resource);
    if (limit === Infinity) {
      return false; // Nunca atinge o limite se for infinito.
    }

    // O Prisma não permite usar um nome de tabela dinâmico (ex: db[resource].count()).
    // Portanto, usamos um `switch` para mapear o recurso para a consulta correta.
    // Isso garante a segurança e a checagem de tipos.
    let currentCount = 0;
    switch (resource) {
      case 'exams':
        currentCount = await db.exame.count({ where: { userId: this.userId } });
        break;
      case 'consultas':
        currentCount = await db.consultas.count({ where: { userId: this.userId } });
        break;
      case 'profissionais':
        currentCount = await db.profissional.count({ where: { userId: this.userId } });
        break;
      case 'unidades':
        currentCount = await db.unidadeDeSaude.count({ where: { userId: this.userId } });
        break;
      case 'medicamentos':
        currentCount = await db.medicamento.count({ where: { userId: this.userId } });
        break;
      case 'tratamentos':
        currentCount = await db.condicaoSaude.count({ where: { userId: this.userId } });
        break;
      default:
        // Se um recurso for adicionado no futuro e não for mapeado aqui, ele não bloqueará o usuário.
        console.warn(`A verificação de limite de recurso não foi implementada para: ${resource}`);
        return false;
    }

    return currentCount >= limit;
  }
}

/**
 * Função principal que busca o perfil de um usuário no banco de dados
 * e retorna uma instância da classe UserPermissions.
 * @param userId - O ID do usuário a ser verificado.
 * @returns Uma Promise que resolve com o objeto UserPermissions.
 */
export async function getPermissionsForUser(userId: string): Promise<UserPermissions> {
  const userWithRole = await db.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
          resourceLimits: true,
        },
      },
    },
  });

  return new UserPermissions(userId, userWithRole?.role || null);
}
