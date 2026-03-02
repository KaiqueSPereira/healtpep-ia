
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { logAction } from "@/app/_lib/logger";

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const notifications = await db.notification.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                medicamento: {
                    select: {
                        id: true,
                    }
                }
            }
        });

        const unreadCount = await db.notification.count({
            where: {
                userId: userId,
                isRead: false,
            },
        });

        return NextResponse.json({ notifications, unreadCount });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId: userId,
            action: "get_notifications_error",
            level: "error",
            message: "Erro ao buscar notificações",
            details: errorMessage,
            component: "notifications-api"
        });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Marcar todas como lidas
        await db.notification.updateMany({
            where: {
                userId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        await logAction({
            userId: userId,
            action: "mark_notifications_as_read",
            level: "info",
            message: "Notificações marcadas como lidas",
            component: "notifications-api"
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId: userId,
            action: "mark_notifications_as_read_error",
            level: "error",
            message: "Erro ao marcar notificações como lidas",
            details: errorMessage,
            component: "notifications-api"
        });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
