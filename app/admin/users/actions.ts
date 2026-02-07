
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/app/_lib/prisma';
import { authOptions } from '@/app/_lib/auth';
import { getServerSession } from 'next-auth';

// Ação para buscar todos os usuários e todos os perfis
export async function getUsersAndRoles() {
    const session = await getServerSession(authOptions);

    // Medida de segurança: Apenas administradores com a permissão correta podem buscar os dados
    if (!session?.user.permissions?.includes('manage_users')) {
        throw new Error('Acesso negado. Você não tem permissão para gerenciar usuários.');
    }

    const users = await db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
    });

    const roles = await db.role.findMany({
        orderBy: {
            name: 'asc',
        },
    });

    return { users, roles };
}

// Ação para atualizar o perfil de um usuário
export async function updateUserRole(userId: string, roleId: string) {
    const session = await getServerSession(authOptions);

    // Medida de segurança: Apenas administradores com permissão podem alterar perfis
    if (!session?.user.permissions?.includes('assign_roles')) {
        throw new Error('Acesso negado. Você não tem permissão para atribuir perfis.');
    }

    if (!userId || !roleId) {
        throw new Error('ID do usuário e ID do perfil são obrigatórios.');
    }

    await db.user.update({
        where: { id: userId },
        data: { roleId: roleId },
    });

    // Invalida o cache da página de usuários para que a lista seja recarregada com os novos dados
    revalidatePath('/admin/users');
}
