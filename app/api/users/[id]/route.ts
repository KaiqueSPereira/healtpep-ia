import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { encryptString, decryptString } from '@/app/_lib/crypto';

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

    // Decrypt sensitive data before sending
    if (user.dadosSaude) {
      user.dadosSaude.CNS = user.dadosSaude.CNS ? decryptString(user.dadosSaude.CNS) : null;
      user.dadosSaude.dataNascimento = user.dadosSaude.dataNascimento ? decryptString(user.dadosSaude.dataNascimento) : null;
      user.dadosSaude.sexo = user.dadosSaude.sexo ? decryptString(user.dadosSaude.sexo) : null;
      user.dadosSaude.tipoSanguineo = user.dadosSaude.tipoSanguineo ? decryptString(user.dadosSaude.tipoSanguineo) : null;
      user.dadosSaude.altura = user.dadosSaude.altura ? decryptString(user.dadosSaude.altura) : null;
    }

    return NextResponse.json(user, { status: 200 });

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

    // Decrypt sensitive data before sending
    if (updatedUser.dadosSaude) {
      updatedUser.dadosSaude.CNS = updatedUser.dadosSaude.CNS ? decryptString(updatedUser.dadosSaude.CNS) : null;
      updatedUser.dadosSaude.dataNascimento = updatedUser.dadosSaude.dataNascimento ? decryptString(updatedUser.dadosSaude.dataNascimento) : null;
      updatedUser.dadosSaude.sexo = updatedUser.dadosSaude.sexo ? decryptString(updatedUser.dadosSaude.sexo) : null;
      updatedUser.dadosSaude.tipoSanguineo = updatedUser.dadosSaude.tipoSanguineo ? decryptString(updatedUser.dadosSaude.tipoSanguineo) : null;
      updatedUser.dadosSaude.altura = updatedUser.dadosSaude.altura ? decryptString(updatedUser.dadosSaude.altura) : null;
    }

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    if (error instanceof Error && error.name === 'PrismaClientValidationError') {
      return NextResponse.json({ error: 'Erro de validação nos dados enviados.', details: error.message }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar dados';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
