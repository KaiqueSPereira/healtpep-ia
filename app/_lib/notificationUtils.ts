'use server';

import { prisma } from "./prisma";

interface NotificationData {
    title: string;
    message: string;
    url?: string;
    type?: string;
}

export async function notifyAdmins(data: NotificationData) {
    const { title, message, url } = data;

    try {
        const admins = await prisma.user.findMany({
            where: { role: { name: 'ADMIN' } },
            select: { id: true },
        });

        if (admins.length > 0) {
            const notifications = admins.map(admin => ({
                userId: admin.id,
                title,
                message,
                url,
                type: data.type || 'GERAL',
            }));

            await prisma.notification.createMany({
                data: notifications,
            });
        }
    } catch (error) {
        console.error("Error in notifyAdmins:", error);
    }
}