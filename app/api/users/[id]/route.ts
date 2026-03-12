import { prisma } from '@/app/_lib/prisma';
import { NextResponse } from 'next/server';
import { encryptString, decryptString } from '@/app/_lib/crypto';
import type { User, DadosSaude, CondicaoSaude, Profissional } from '@prisma/client';

// Função auxiliar para obter o ID da URL
const getUserIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

// Tipos estendidos para relações
type CondicaoSaudeComProfissional = CondicaoSaude & { profissional: Profissional | null };
type UserWithRelations = User & {
  dadosSaude: DadosSaude | null;
  condicoesSaude: CondicaoSaudeComProfissional[];
};

// Tipos descriptografados
type DecryptedDadosSaude = Omit<DadosSaude, 'alergias'> & { alergias: string[] };

type DecryptedCondicaoSaude = Omit<CondicaoSaudeComProfissional, 'nome' | 'objetivo' | 'observacoes'> & {
  nome: string;
  objetivo: string | null;
  observacoes: string | null;
};
type DecryptedUser = Omit<UserWithRelations, 'dadosSaude' | 'condicoesSaude'> & {
  dadosSaude: DecryptedDadosSaude | null;
  condicoesSaude: DecryptedCondicaoSaude[];
};

// Função auxiliar de descriptografia
const decryptUserData = (user: UserWithRelations | null): DecryptedUser | null => {
  if (!user) return null;

  const decryptedUser: DecryptedUser = JSON.parse(JSON.stringify(user));

  // Descriptografar dadosSaude
  if (decryptedUser.dadosSaude) {
    const { CNS, dataNascimento, sexo, tipoSanguineo, altura, alergias } = decryptedUser.dadosSaude;
    decryptedUser.dadosSaude.CNS = CNS ? decryptString(CNS) : null;
    decryptedUser.dadosSaude.dataNascimento = dataNascimento ? decryptString(dataNascimento) : null;
    decryptedUser.dadosSaude.sexo = sexo ? decryptString(sexo) : null;
    decryptedUser.dadosSaude.tipoSanguineo = tipoSanguineo ? decryptString(tipoSanguineo) : null;
    decryptedUser.dadosSaude.altura = altura ? decryptString(altura) : null;
    // @ts-ignore
    decryptedUser.dadosSaude.alergias = alergias && alergias.length > 0 ? alergias.map((alergia: string) => decryptString(alergia)) : [];
  }

  // Descriptografar condicoesSaude
  if (decryptedUser.condicoesSaude) {
    decryptedUser.condicoesSaude = decryptedUser.condicoesSaude.map((condicao) => ({
      ...condicao,
      nome: decryptString(condicao.nome),
      objetivo: condicao.objetivo ? decryptString(condicao.objetivo) : null,
      observacoes: condicao.observacoes ? decryptString(condicao.observacoes) : null,
    }));
  }

  return decryptedUser;
};

// --- GET: Busca os dados de um usuário ---
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromUrl(request.url);
    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dadosSaude: true,
        condicoesSaude: {
          include: { profissional: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const decryptedUser = decryptUserData(user as UserWithRelations);

    return NextResponse.json(decryptedUser, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro ao buscar dados do usuário:", errorMessage);
    return NextResponse.json({ error: 'Falha ao buscar dados do usuário' }, { status: 500 });
  }
}

// --- PATCH: Atualiza os dados de saúde do usuário ---
export async function PATCH(request: Request) {
    try {
        const userId = getUserIdFromUrl(request.url);
        if (!userId) {
            return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, cns, dataNascimento, genero, tipo_sanguineo, altura, alergias } = body;

        // Criptografar dados de saúde
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
                name,
                email,
                dadosSaude: {
                    upsert: {
                        create: encryptedData,
                        update: encryptedData,
                    },
                },
            },
            include: {
                dadosSaude: true,
                condicoesSaude: {
                  include: { profissional: true },
                  orderBy: { createdAt: 'desc' },
                },
            },
        });

        const decryptedUser = decryptUserData(updatedUser as UserWithRelations);

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