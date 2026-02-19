'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/app/_lib/prisma';

// Schema atualizado para incluir os limites de recursos
const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "O nome do perfil é obrigatório." }),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
  // resourceLimits será um objeto como: { exams: "10", consultas: "-1" }
  // Usamos z.record para tipar um objeto com chaves dinâmicas (string) e valores (string).
  // A conversão para número será feita no backend.
  resourceLimits: z.record(z.string()).optional(),
});

export async function createOrUpdateRole(formData: z.infer<typeof roleSchema>) {
  const validation = roleSchema.safeParse(formData);

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { id, name, description, permissionIds = [], resourceLimits = {} } = validation.data;

  try {
    if (id) {
      // Transação para ATUALIZAR um perfil existente
      await prisma.$transaction(async (tx) => {
        // 1. Atualiza dados básicos do perfil
        await tx.role.update({
          where: { id },
          data: { name, description },
        });

        // 2. Atualiza as permissões de acesso (flags)
        await tx.permissionOnRole.deleteMany({ where: { roleId: id } });
        if (permissionIds.length > 0) {
          await tx.permissionOnRole.createMany({
            data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
          });
        }

        // 3. Atualiza os limites de recursos
        await tx.resourceLimit.deleteMany({ where: { roleId: id } });
        const limitsToCreate = Object.entries(resourceLimits)
          .map(([resource, limitStr]) => ({
            roleId: id,
            resource,
            // Converte para número. Se for string vazia ou inválida, vira 0.
            // Usamos -1 para representar "ilimitado".
            limit: limitStr === '-1' ? -1 : (parseInt(limitStr, 10) || 0),
          }))
          // Filtra qualquer entrada que não seja um número válido (resultou em NaN -> 0)
          .filter(item => item.limit !== 0 || resourceLimits[item.resource] === '0');

        if (limitsToCreate.length > 0) {
          await tx.resourceLimit.createMany({ data: limitsToCreate });
        }
      });
    } else {
      // Lógica para CRIAR um novo perfil
      await prisma.role.create({
        data: {
          name,
          description,
          // Cria as permissões de acesso
          permissions: {
            create: permissionIds.map((permissionId) => ({
              permission: { connect: { id: permissionId } },
            })),
          },
          // Cria os limites de recursos associados
          resourceLimits: {
            create: Object.entries(resourceLimits).map(([resource, limitStr]) => ({
              resource,
              limit: limitStr === '-1' ? -1 : (parseInt(limitStr, 10) || 0),
            })),
          },
        },
      });
    }

    revalidatePath('/admin/roles');
    return { success: true, message: `Perfil "${name}" salvo com sucesso!` };

  } catch (error) {
    console.error("Falha ao salvar o perfil:", error);
    // Adiciona um log mais detalhado do erro
    if (error instanceof Error) {
      console.error(error.message);
    }
    return { success: false, message: "Ocorreu um erro no servidor ao salvar o perfil." };
  }
}

export async function deleteRole(roleId: string) {
  try {
    const usersCount = await prisma.user.count({ where: { roleId } });
    if (usersCount > 0) {
      return {
        success: false,
        message: `Não é possível excluir este perfil, pois está associado a ${usersCount} usuário(s).`,
      };
    }

    // A exclusão em cascata configurada no schema irá remover os limites e permissões associados
    await prisma.role.delete({ where: { id: roleId } });

    revalidatePath('/admin/roles');
    return { success: true, message: "Perfil excluído com sucesso!" };

  } catch (error) {
    console.error("Falha ao excluir o perfil:", error);
    return { success: false, message: "Ocorreu um erro no servidor ao excluir o perfil." };
  }
}
