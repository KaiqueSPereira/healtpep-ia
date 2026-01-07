
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Não autorizado', { status: 401 });
    }

    try {
        const account = await db.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'google', // Assumindo que o usuário se autentica via Google
            },
        });

        // Considera conectado se o campo googleCalendar tiver dados
        const isConnected = !!account && !!account.googleCalendar;
        
        return NextResponse.json({ isConnected });

    } catch (error) {
        console.error('Erro ao verificar status da conexão com Google Calendar:', error);
        return new NextResponse('Erro interno ao verificar status', { status: 500 });
    }
}
