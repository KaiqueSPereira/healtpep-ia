import { prisma } from '@/app/_lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Interface para definir a estrutura esperada do corpo da requisição
interface LogPayload {
  message: string;
  level?: 'error' | 'info' | 'warn';
  component?: string;
  stack?: string;
  url?: string; // Opcional, pode ser adicionado pelo frontend no futuro
}

export async function POST(request: NextRequest) {
  try {
    // Tipagem forte do corpo da requisição para maior segurança
    const logData: LogPayload = await request.json();

    // Validação mínima para garantir que a mensagem existe
    if (!logData.message) {
      return NextResponse.json({ message: "O campo 'message' é obrigatório." }, { status: 400 });
    }

    await prisma.errorLog.create({
      data: {
        message: logData.message, // Campo obrigatório
        level: logData.level,       // Novo campo, opcional
        component: logData.component, // Novo campo, opcional
        stack: logData.stack,       // Opcional
        url: logData.url,           // Opcional
      },
    });

    return NextResponse.json({ message: "Log registrado com sucesso" }, { status: 200 });

  } catch (e: unknown) {
    let errorMessage = "Erro desconhecido ao registrar o log.";
    if (e instanceof Error) {
        errorMessage = e.message;
    }
    console.error("Falha crítica na API de logs:", e);
    
    // Retorna uma resposta de erro, mas evita que a própria API de log cause um loop de erros
    return NextResponse.json({ message: "Falha ao registrar o log.", error: errorMessage }, { status: 500 });
  }
}
