import { prisma } from '@/app/_lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

interface LogPayload {
  message: string;
  level?: 'error' | 'info' | 'warn' | 'debug';
  component?: string;
  stack?: any;
  url?: string;
  action?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const logData: LogPayload = await request.json();

    if (!logData.message) {
      return NextResponse.json({ message: "O campo 'message' é obrigatório." }, { status: 400 });
    }

    let stackInfo: string | undefined = undefined;
    if (logData.stack) {
      stackInfo = typeof logData.stack === 'string' ? logData.stack : JSON.stringify(logData.stack, null, 2);
    }
    if (logData.url) {
      stackInfo = stackInfo ? `${stackInfo}\n\nURL: ${logData.url}` : `URL: ${logData.url}`;
    }

    await prisma.actionLog.create({
      data: {
        action: logData.action || 'client_log',
        message: logData.message,
        level: logData.level || 'info',
        component: logData.component,
        stack: stackInfo,
        userId: logData.userId,
      },
    });

    return NextResponse.json({ message: "Log registrado com sucesso" }, { status: 200 });

  } catch (e: unknown) {
    let errorMessage = "Erro desconhecido ao registrar o log.";
    if (e instanceof Error) {
        errorMessage = e.message;
    }
    console.error("Falha crítica na API de logs:", e);
    
    return NextResponse.json({ message: "Falha ao registrar o log.", error: errorMessage }, { status: 500 });
  }
}
