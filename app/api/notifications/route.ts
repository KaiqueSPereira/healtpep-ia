
import { NextResponse } from 'next/server';
import { db } from '@/app/_lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const notifications = await db.notification.findMany({
            where: {
                userId: session.user.id,
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
                userId: session.user.id,
                isRead: false,
            },
        });

        return NextResponse.json({ notifications, unreadCount });

    } catch (error) {
        console.error('[NOTIFICATIONS_GET_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Marcar todas como lidas
        await db.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[NOTIFICATIONS_POST_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
