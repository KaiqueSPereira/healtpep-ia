import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { encryptString, safeDecrypt } from '@/app/_lib/crypto';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, context: { params: Params }) {
  try {
    const userId = context.params.id;
    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dadosSaude: true }, 
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const responseData = {
      ...user,
      ...(user.dadosSaude && {
        cns: user.dadosSaude.CNS ? safeDecrypt(user.dadosSaude.CNS) : null,
        dataNascimento: user.dadosSaude.dataNascimento ? safeDecrypt(user.dadosSaude.dataNascimento) : null,
        genero: user.dadosSaude.sexo ? safeDecrypt(user.dadosSaude.sexo) : null,
        tipo_sanguineo: user.dadosSaude.tipoSanguineo ? safeDecrypt(user.dadosSaude.tipoSanguineo) : null,
        altura: user.dadosSaude.altura ? safeDecrypt(user.dadosSaude.altura) : null,
      }),
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro ao buscar dados do usuário:", errorMessage);
    return NextResponse.json({ error: 'Falha ao buscar dados do usuário' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Params }) {
  try {
    const userId = context.params.id;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    const { name, email, cns, dataNascimento, genero, tipo_sanguineo, altura } = body;

    const encryptedData = {
      CNS: cns ? encryptString(cns) : undefined,
      dataNascimento: dataNascimento ? encryptString(dataNascimento) : undefined,
      sexo: genero ? encryptString(genero) : undefined,
      tipoSanguineo: tipo_sanguineo ? encryptString(tipo_sanguineo) : undefined,
      altura: altura ? encryptString(altura) : undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        dadosSaude: {
          upsert: {
            create: encryptedData,
            update: encryptedData,
          },
        },
      },
      include: { dadosSaude: true },
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    // ATUALIZAÇÃO: Adiciona verificação de tipo para o erro
    console.error("Erro ao atualizar usuário:", error);
    if (error instanceof Error && error.name === 'PrismaClientValidationError') {
      return NextResponse.json({ error: 'Erro de validação nos dados enviados.', details: error.message }, { status: 400 });
    }
    // Garante que uma mensagem de erro genérica é enviada
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar dados';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
