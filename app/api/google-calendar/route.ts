
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { google, calendar_v3 } from 'googleapis';
import { Prisma } from '@prisma/client';

interface GoogleCalendarTokens {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type: 'Bearer';
    expiry_date: number;
}

interface EventRequestBody {
    summary: string;
    description: string;
    start: { dateTime: string, timeZone: string };
    end: { dateTime: string, timeZone: string };
    attendees?: { email: string }[];
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Não autorizado', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.events'],
            prompt: 'consent',
        });
        return NextResponse.redirect(authUrl);
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        await db.account.updateMany({
            where: {
                userId: session.user.id,
                provider: 'google',
            },
            data: {
                googleCalendar: tokens as Prisma.JsonObject,
            },
        });

        return NextResponse.redirect(new URL('/configuracoes?calendar=success', req.url));

    } catch (error) {
        console.error('Erro ao obter tokens do Google Calendar:', error);
        return new NextResponse('Falha na autenticação com Google Calendar', { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Não autorizado', { status: 401 });
    }

    const body: EventRequestBody = await req.json();
    const { summary, start, end, attendees } = body;

    if (!summary || !start || !end) {
        return new NextResponse('Dados do evento inválidos', { status: 400 });
    }

    try {
        const account = await db.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'google',
            },
        });

        if (!account || !account.googleCalendar) {
            return new NextResponse('Credenciais do Google Calendar não encontradas. Por favor, autorize o acesso primeiro.', { status: 403 });
        }

        const tokens = account.googleCalendar as unknown as GoogleCalendarTokens;
        oauth2Client.setCredentials(tokens);

        if (tokens.expiry_date && new Date() > new Date(tokens.expiry_date)) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await db.account.updateMany({
                where: { userId: session.user.id, provider: 'google' },
                data: { googleCalendar: credentials as Prisma.JsonObject },
            });
            oauth2Client.setCredentials(credentials);
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const event: calendar_v3.Schema$Event = {
            summary,
            description: body.description,
            start: { dateTime: start.dateTime, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: end.dateTime, timeZone: 'America/Sao_Paulo' },
            attendees: attendees || [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 },
                ],
            },
        };

        const createdEvent = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
        });

        return NextResponse.json(createdEvent.data);

    } catch (error) {
        console.error('Erro ao criar evento no Google Calendar:', error);
        return new NextResponse('Falha ao criar evento', { status: 500 });
    }
}
