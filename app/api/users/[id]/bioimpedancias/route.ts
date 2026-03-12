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

    const bioimpedanciaData = {
      userId,
      data: new Date(data),
      gorduraCorporal: formData.get('gorduraCorporal')?.toString().replace('.', ','),
      massaMuscular: formData.get('massaMuscular')?.toString().replace('.', ','),
      gorduraVisceral: formData.get('gorduraVisceral')?.toString().replace('.', ','),
      taxaMetabolica: formData.get('taxaMetabolica')?.toString().replace('.', ','),
      idadeCorporal: formData.get('idadeCorporal')?.toString(),
      massaOssea: formData.get('massaOssea')?.toString().replace('.', ','),
      aguaCorporal: formData.get('aguaCorporal')?.toString().replace('.', ','),
    };

    const novoRegistro = await prisma.bioimpedancia.create({ data: bioimpedanciaData });

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

// Função DELETE para apagar um registro
export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID do registro não fornecido.' }, { status: 400 });
        }

        await prisma.$transaction(async (prisma) => {
            await prisma.anexoBioimpedancia.deleteMany({
                where: { bioimpedanciaId: id },
            });
            await prisma.bioimpedancia.delete({
                where: { id: id },
            });
        });

        return NextResponse.json({ message: 'Registro apagado com sucesso.' }, { status: 200 });

    } catch (error) {
        console.error('Erro ao apagar registro de bioimpedância:', error);
        return NextResponse.json({ error: 'Erro interno do servidor ao apagar o registro.' }, { status: 500 });
    }
}

// Função PUT para atualizar um registro
export async function PUT(request: NextRequest) {
    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return NextResponse.json({ error: 'ID do registro é obrigatório para atualização.' }, { status: 400 });
        }

        const data = formData.get('data') as string;
        const anexo = formData.get('anexo') as File | null;

        const bioimpedanciaDataToUpdate = {
            data: new Date(data),
            gorduraCorporal: formData.get('gorduraCorporal')?.toString().replace('.', ','),
            massaMuscular: formData.get('massaMuscular')?.toString().replace('.', ','),
            gorduraVisceral: formData.get('gorduraVisceral')?.toString().replace('.', ','),
            taxaMetabolica: formData.get('taxaMetabolica')?.toString().replace('.', ','),
            idadeCorporal: formData.get('idadeCorporal')?.toString(),
            massaOssea: formData.get('massaOssea')?.toString().replace('.', ','),
            aguaCorporal: formData.get('aguaCorporal')?.toString().replace('.', ','),
        };

        const updatedRecord = await prisma.bioimpedancia.update({
            where: { id },
            data: bioimpedanciaDataToUpdate,
        });

        if (anexo) {
            await prisma.anexoBioimpedancia.deleteMany({
                where: { bioimpedanciaId: id },
            });

            const fileBuffer = Buffer.from(await anexo.arrayBuffer());
            await prisma.anexoBioimpedancia.create({
                data: {
                    nomeArquivo: anexo.name,
                    mimetype: anexo.type,
                    arquivo: fileBuffer,
                    bioimpedanciaId: id,
                },
            });
        }

        return NextResponse.json(updatedRecord, { status: 200 });

    } catch (error) {
        console.error('Erro ao atualizar registro de bioimpedância:', error);
        return NextResponse.json({ error: 'Erro interno do servidor ao atualizar registro.' }, { status: 500 });
    }
}
