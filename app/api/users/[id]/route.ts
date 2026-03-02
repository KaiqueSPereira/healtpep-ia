import { prisma } from '@/app/_lib/prisma';
import { NextResponse } from 'next/server';
import { encryptString, decryptString } from '@/app/_lib/crypto';
import type { User, DadosSaude, PesoHistorico, CondicaoSaude, Profissional } from '@prisma/client';

// Função auxiliar para obter o ID da URL
const getUserIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

// Tipos estendidos para relações
type CondicaoSaudeComProfissional = CondicaoSaude & { profissional: Profissional | null };
type UserWithRelations = User & {
  dadosSaude: DadosSaude | null;
  historicoPeso: PesoHistorico[];
  condicoesSaude: CondicaoSaudeComProfissional[];
};

// Tipos descriptografados
type DecryptedDadosSaude = Omit<DadosSaude, 'alergias'> & { alergias: string[] };
type DecryptedPesoHistorico = Omit<PesoHistorico, 'peso' | 'data'> & { peso: string; data: string };

type DecryptedCondicaoSaude = Omit<CondicaoSaudeComProfissional, 'nome' | 'objetivo' | 'observacoes'> & {
  nome: string;
  objetivo: string | null;
  observacoes: string | null;
};
type DecryptedUser = Omit<UserWithRelations, 'dadosSaude' | 'historicoPeso' | 'condicoesSaude'> & {
  dadosSaude: DecryptedDadosSaude | null;
  historicoPeso: DecryptedPesoHistorico[];
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

  // Descriptografar historicoPeso
  if (decryptedUser.historicoPeso) {
    decryptedUser.historicoPeso = decryptedUser.historicoPeso.map((registro) => ({
      ...registro,
      peso: decryptString(registro.peso),
      data: decryptString(registro.data),
    }));
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

// --- GET: Busca todos os dados de um usuário ---
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
        historicoPeso: { orderBy: { data: 'asc' } },
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
                historicoPeso: { orderBy: { data: 'asc' } },
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

// --- POST: Adiciona novo registro de peso ---
export async function POST( request: Request) {
    const userId = getUserIdFromUrl(request.url);
    if (!userId) {
        return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    try {
        const body = await request.json();

        if (body.peso && body.data) {
            const { peso, data } = body;

            const novoPeso = await prisma.pesoHistorico.create({
                data: {
                    userId: userId,
                    peso: encryptString(peso),
                    data: encryptString(data),
                },
            });

            const decryptedPeso = {
                ...novoPeso,
                peso: decryptString(novoPeso.peso),
                data: decryptString(novoPeso.data),
            }

            return NextResponse.json(decryptedPeso, { status: 201 });
        }

        return NextResponse.json({ error: 'Requisição inválida. Forneça peso e data.' }, { status: 400 });

    } catch (error) {
        console.error('Erro ao adicionar registro de peso:', error);
        return NextResponse.json({ error: 'Erro interno ao processar a requisição' }, { status: 500 });
    }
}

// --- DELETE: Deleta um registro de peso ---
export async function DELETE(request: Request) {
    const userId = getUserIdFromUrl(request.url);
    if (!userId) {
        return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { id: registroId } = body;

        if (!registroId) {
            return NextResponse.json({ error: 'ID do registro é obrigatório' }, { status: 400 });
        }

        // Garante que o usuário só pode deletar seus próprios registros
        const result = await prisma.pesoHistorico.deleteMany({
            where: {
                id: registroId,
                userId: userId,
            },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: 'Registro não encontrado ou não pertence ao usuário' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Registro de peso deletado com sucesso' }, { status: 200 });

    } catch (error) {
        console.error('Erro ao deletar registro de peso:', error);
        return NextResponse.json({ error: 'Erro interno ao processar a requisição' }, { status: 500 });
    }
}
