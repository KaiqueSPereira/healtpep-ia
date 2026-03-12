import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const getParamsFromUrl = (url: string) => {
  const parts = url.split('/');
  const recordId = parts[parts.length - 2];
  const userId = parts[parts.length - 4];
  return { userId, recordId };
};

// Obter todas as fotos de um registro de acompanhamento
export async function GET(req: NextRequest) {
  const { userId, recordId } = getParamsFromUrl(req.url);
  const token = await getToken({ req });

  if (!token || token.sub !== userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const acompanhamento = await prisma.acompanhamentoCorporal.findFirst({
      where: {
        id: recordId,
        userId: userId,
      },
    });

    if (!acompanhamento) {
      return NextResponse.json({ error: 'Registro de acompanhamento não encontrado ou não pertence ao usuário.' }, { status: 404 });
    }

    const fotos = await prisma.fotosAcompanhamento.findMany({
      where: { acompanhamentoId: recordId },
      select: {
        id: true,
        nomeArquivo: true,
        mimetype: true,
        createdAt: true,
        updatedAt: true,
        acompanhamentoId: true,
      }
    });

    return NextResponse.json(fotos);
  } catch (error) {
    console.error('Erro ao buscar fotos do acompanhamento:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar fotos.' }, { status: 500 });
  }
}

// Adicionar uma nova foto a um registro de acompanhamento
export async function POST(req: NextRequest) {
  const { userId, recordId } = getParamsFromUrl(req.url);
  const token = await getToken({ req });

  if (!token || token.sub !== userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const acompanhamento = await prisma.acompanhamentoCorporal.findFirst({
      where: {
        id: recordId,
        userId: userId,
      },
    });

    if (!acompanhamento) {
      return NextResponse.json({ error: 'Registro de acompanhamento não encontrado ou não pertence ao usuário.' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const novaFoto = await prisma.fotosAcompanhamento.create({
      data: {
        acompanhamentoId: recordId,
        nomeArquivo: file.name,
        mimetype: file.type,
        arquivo: buffer,
      },
    });
    
    const { arquivo, ...fotoResult } = novaFoto;

    return NextResponse.json(fotoResult, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar foto ao acompanhamento:', error);
    return NextResponse.json({ error: 'Erro interno ao adicionar a foto.' }, { status: 500 });
  }
}
