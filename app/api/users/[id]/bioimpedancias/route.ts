'use server';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função GET para buscar os registros
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[3];

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido na URL.' }, { status: 400 });
    }

    const bioimpedancias = await prisma.bioimpedancia.findMany({
      where: { userId: userId },
      include: { anexos: { select: { id: true, nomeArquivo: true, mimetype: true } } },
      orderBy: { data: 'desc' },
    });

    const parsedBioimpedancias = bioimpedancias.map(bio => ({
      ...bio,
      gorduraCorporal: bio.gorduraCorporal ? parseFloat(bio.gorduraCorporal.replace(',', '.')) : null,
      massaMuscular: bio.massaMuscular ? parseFloat(bio.massaMuscular.replace(',', '.')) : null,
      gorduraVisceral: bio.gorduraVisceral ? parseFloat(bio.gorduraVisceral.replace(',', '.')) : null,
      taxaMetabolica: bio.taxaMetabolica ? parseFloat(bio.taxaMetabolica.replace(',', '.')) : null,
      idadeCorporal: bio.idadeCorporal ? parseInt(bio.idadeCorporal, 10) : null,
      massaOssea: bio.massaOssea ? parseFloat(bio.massaOssea.replace(',', '.')) : null,
      aguaCorporal: bio.aguaCorporal ? parseFloat(bio.aguaCorporal.replace(',', '.')) : null,
    }));

    return NextResponse.json(parsedBioimpedancias);

  } catch (error) {
    console.error('Erro ao buscar dados de bioimpedância:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar bioimpedâncias.' }, { status: 500 });
  }
}

// Função POST para criar um novo registro
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[3];

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido na URL.' }, { status: 400 });
    }

    const formData = await request.formData();
    const data = formData.get('data') as string;
    const anexo = formData.get('anexo') as File | null;

    if (!data) {
      return NextResponse.json({ error: 'A data é obrigatória.' }, { status: 400 });
    }

    // Prepara os dados para o Prisma, convertendo para string
    const bioimpedanciaData = {
      userId,
      data: new Date(data),
      gorduraCorporal: formData.get('gorduraCorporal')?.toString(),
      massaMuscular: formData.get('massaMuscular')?.toString(),
      gorduraVisceral: formData.get('gorduraVisceral')?.toString(),
      taxaMetabolica: formData.get('taxaMetabolica')?.toString(),
      idadeCorporal: formData.get('idadeCorporal')?.toString(),
      massaOssea: formData.get('massaOssea')?.toString(),
      aguaCorporal: formData.get('aguaCorporal')?.toString(),
    };

    const novoRegistro = await prisma.bioimpedancia.create({ data: bioimpedanciaData });

    // Se houver um anexo, salva-o no banco de dados
    if (anexo) {
      const fileBuffer = Buffer.from(await anexo.arrayBuffer());
      await prisma.anexoBioimpedancia.create({
        data: {
          nomeArquivo: anexo.name,
          mimetype: anexo.type,
          arquivo: fileBuffer,
          bioimpedanciaId: novoRegistro.id,
        }
      });
    }

    return NextResponse.json(novoRegistro, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar registro de bioimpedância:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao criar registro.' }, { status: 500 });
  }
}
