import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { encryptString, decryptString } from '@/app/_lib/crypto';

interface Params {
  id: string;
}

// Define types based on Prisma schema inference
interface DadosSaude {
  id: string;
  userId: string;
  CNS: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  tipoSanguineo: string | null;
  altura: string | null;
  alergias: string[]; // Array of encrypted strings
}

interface UserWithDadosSaude {
  id: string;
  name: string | null;
  email: string | null;
  dadosSaude: DadosSaude | null;
}

// Define the shape of the decrypted data
type DecryptedDadosSaude = Omit<DadosSaude, 'alergias'> & {
  alergias: string[]; // Array of decrypted strings
}

type DecryptedUser = Omit<UserWithDadosSaude, 'dadosSaude'> & {
  dadosSaude: DecryptedDadosSaude | null;
}

// Função para descriptografar os dados de saúde do usuário
const decryptUserData = (user: UserWithDadosSaude | null): DecryptedUser | null => {
  if (!user) return null;

  const decryptedUser: DecryptedUser = JSON.parse(JSON.stringify(user));

  // Descriptografa os dados de saúde
  if (decryptedUser.dadosSaude) {
    const { CNS, dataNascimento, sexo, tipoSanguineo, altura, alergias } = decryptedUser.dadosSaude;
    decryptedUser.dadosSaude.CNS = CNS ? decryptString(CNS) : null;
    decryptedUser.dadosSaude.dataNascimento = dataNascimento ? decryptString(dataNascimento) : null;
    decryptedUser.dadosSaude.sexo = sexo ? decryptString(sexo) : null;
    decryptedUser.dadosSaude.tipoSanguineo = tipoSanguineo ? decryptString(tipoSanguineo) : null;
    decryptedUser.dadosSaude.altura = altura ? decryptString(altura) : null;
    decryptedUser.dadosSaude.alergias = alergias && alergias.length > 0 ? alergias.map((alergia: string) => decryptString(alergia)) : [];
  }

  return decryptedUser;
};

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

    const decryptedUser = decryptUserData(user as UserWithDadosSaude);

    return NextResponse.json(decryptedUser, { status: 200 });

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

    const { name, email, cns, dataNascimento, genero, tipo_sanguineo, altura, alergias } = body;

    // Criptografa os dados de saúde
    const encryptedData = {
      CNS: cns ? encryptString(cns) : undefined,
      dataNascimento: dataNascimento ? encryptString(dataNascimento) : undefined,
      sexo: genero ? encryptString(genero) : undefined,
      tipoSanguineo: tipo_sanguineo ? encryptString(tipo_sanguineo) : undefined,
      altura: altura ? encryptString(altura) : undefined,
      alergias: alergias && alergias.length > 0 ? alergias.map((alergia: string) => encryptString(alergia)) : undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name, // O campo name não será criptografado para manter a compatibilidade com o NextAuth
        email, // Email não é criptografado para não quebrar a autenticação
        dadosSaude: {
          upsert: {
            create: encryptedData,
            update: encryptedData,
          },
        },
      },
      include: { dadosSaude: true },
    });

    const decryptedUser = decryptUserData(updatedUser as UserWithDadosSaude);

    return NextResponse.json(decryptedUser, { status: 200 });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    if (error instanceof Error && error.name === 'PrismaClientValidationError') {
      return NextResponse.json({ error: 'Erro de validação nos dados enviados.', details: error.message }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar dados';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
