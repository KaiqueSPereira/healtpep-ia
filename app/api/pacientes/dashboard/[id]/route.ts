
import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { decryptString, encryptString } from '@/app/_lib/crypto';
import type { PesoHistorico, CondicaoSaude, Profissional } from '@prisma/client';

// Tipo estendido para incluir o profissional associado à condição de saúde
type CondicaoSaudeComProfissional = CondicaoSaude & { profissional: Profissional | null };

// --- GET: Busca todos os dados do dashboard do paciente ---
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'ID do usuário é obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userDashboardData = await prisma.user.findUnique({
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

    if (!userDashboardData) {
      return new NextResponse(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Descriptografa os Dados de Saúde (se existirem)
    if (userDashboardData.dadosSaude) {
        userDashboardData.dadosSaude = {
            ...userDashboardData.dadosSaude,
            CNS: userDashboardData.dadosSaude.CNS ? decryptString(userDashboardData.dadosSaude.CNS) : null,
            dataNascimento: userDashboardData.dadosSaude.dataNascimento ? decryptString(userDashboardData.dadosSaude.dataNascimento) : null,
            sexo: userDashboardData.dadosSaude.sexo ? decryptString(userDashboardData.dadosSaude.sexo) : null,
            tipoSanguineo: userDashboardData.dadosSaude.tipoSanguineo ? decryptString(userDashboardData.dadosSaude.tipoSanguineo) : null,
            altura: userDashboardData.dadosSaude.altura ? decryptString(userDashboardData.dadosSaude.altura) : null,
        };
    }

    // Descriptografa o Histórico de Peso (se existir)
    if (userDashboardData.historicoPeso) {
      userDashboardData.historicoPeso = userDashboardData.historicoPeso.map((registro: PesoHistorico) => ({
        ...registro,
        peso: decryptString(registro.peso),
        data: decryptString(registro.data),
      }));
    }

    // Descriptografa as Condições de Saúde (se existirem)
    if (userDashboardData.condicoesSaude) {
        userDashboardData.condicoesSaude = userDashboardData.condicoesSaude.map((condicao: CondicaoSaudeComProfissional) => ({
            ...condicao,
            nome: decryptString(condicao.nome),
            objetivo: condicao.objetivo ? decryptString(condicao.objetivo) : null,
            observacoes: condicao.observacoes ? decryptString(condicao.observacoes) : null,
        }));
    }

    return NextResponse.json(userDashboardData);

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard do paciente:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// --- PATCH: Atualiza os dados de saúde do paciente ---
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'ID do usuário é obrigatório' }), { status: 400 });
  }

  try {
    const { dadosSaude } = await request.json();
    const encryptedPayload = {
        CNS: dadosSaude.CNS ? encryptString(dadosSaude.CNS) : null,
        tipoSanguineo: dadosSaude.tipoSanguineo ? encryptString(dadosSaude.tipoSanguineo) : null,
        sexo: dadosSaude.sexo ? encryptString(dadosSaude.sexo) : null,
        dataNascimento: dadosSaude.dataNascimento ? encryptString(dadosSaude.dataNascimento) : null,
        altura: dadosSaude.altura ? encryptString(dadosSaude.altura) : null,
        alergias: Array.isArray(dadosSaude.alergias) ? dadosSaude.alergias : [],
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dadosSaude: {
          upsert: { 
            create: encryptedPayload,
            update: { ...encryptedPayload, alergias: { set: encryptedPayload.alergias } },
          },
        },
      },
      include: { dadosSaude: true },
    });

    return NextResponse.json(updatedUser.dadosSaude);

  } catch (error) {
    console.error('Erro ao atualizar dados de saúde:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor' }), { status: 500 });
  }
}

// --- POST: Adiciona um novo registro de peso ---
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'ID do usuário é obrigatório' }), { status: 400 });
  }

  try {
    const body = await request.json();

    // Apenas para adicionar peso, a criação de condição de saúde foi removida.
    if (body.peso && body.data) {
      const { peso, data } = body;
      
      const novoPeso = await prisma.pesoHistorico.create({
        data: {
          userId: userId,
          peso: encryptString(peso),
          data: encryptString(data),
        },
      });

      return NextResponse.json(novoPeso, { status: 201 });
    }

    return new NextResponse(JSON.stringify({ error: 'Requisição inválida. Forneça peso e data.' }), { status: 400 });

  } catch (error) {
    console.error('Erro ao adicionar registro de peso:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao processar a requisição' }), { status: 500 });
  }
}
