import { prisma } from '@/app/_lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const errorData = await request.json();

    await prisma.errorLog.create({
      data: {
        message: errorData.message,
        stack: errorData.stack,
        url: errorData.url,
      },
    });

    return NextResponse.json({ message: "Erro registrado com sucesso" }, { status: 200 });
  } catch (e) {
    console.error("Erro ao registrar o erro do lado do cliente:", e);
    return NextResponse.json({ message: "Falha ao registrar o erro" }, { status: 500 });
  }
}
