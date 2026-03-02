
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/app/_lib/prisma';

const getUserIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};

export async function GET(req: NextRequest) {
  const userId = getUserIdFromUrl(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não encontrado na URL.' }, { status: 400 });
  }

  try {
    const acompanhamentos = await prisma.acompanhamentoCorporal.findMany({
      where: { userId },
      orderBy: { data: 'desc' },
    });

    const bioimpedancias = await prisma.bioimpedancia.findMany({
      where: { userId },
      orderBy: { data: 'desc' },
    });

    return NextResponse.json({ acompanhamentos, bioimpedancias });
  } catch (error) {
    console.error('Error fetching medidas:', error);
    return NextResponse.json({ error: 'Erro ao buscar medidas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  const userId = getUserIdFromUrl(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não encontrado na URL.' }, { status: 400 });
  }

  if (!token || token.sub !== userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data, ...medidas } = body;

    // Separate data for each model
    const acompanhamentoData: any = { userId, data: new Date() };
    const bioimpedanciaData: any = { userId, data: new Date() };

    Object.keys(medidas).forEach(key => {
      if (medidas[key] === '' || medidas[key] === null) return;
      
      if (['peso', 'pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD'].includes(key)) {
        acompanhamentoData[key] = medidas[key];
      } else if (['gorduraCorporal', 'massaMuscular', 'gorduraVisceral', 'taxaMetabolica', 'idadeCorporal', 'massaOssea', 'aguaCorporal'].includes(key)) {
        bioimpedanciaData[key] = medidas[key];
      }
    });

    // Only create records if there is data for them
    if (Object.keys(acompanhamentoData).length > 2) {
      await prisma.acompanhamentoCorporal.create({ data: acompanhamentoData });
    }

    if (Object.keys(bioimpedanciaData).length > 2) {
      await prisma.bioimpedancia.create({ data: bioimpedanciaData });
    }

    return NextResponse.json({ message: 'Medidas adicionadas com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Error creating medidas:', error);
    return NextResponse.json({ error: 'Erro ao criar medidas.' }, { status: 500 });
  }
}
