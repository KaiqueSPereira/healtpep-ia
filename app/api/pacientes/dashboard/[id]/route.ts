
import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { safeDecrypt, encryptString } from '@/app/_lib/crypto';
import type { PesoHistorico, CondicaoSaude, Profissional } from '@prisma/client';

// Define um tipo mais específico para a Condição de Saúde que inclui o profissional
type CondicaoSaudeComProfissional = CondicaoSaude & { profissional: Profissional | null };

// GET para buscar todos os dados do dashboard
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
        historicoPeso: { orderBy: { data: 'asc' } }, // Este é o nome da relação, está correto
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

    // Descriptografa os dados de saúde, se existirem
    if (userDashboardData.dadosSaude) {
        const decryptedDadosSaude = {
            ...userDashboardData.dadosSaude,
            CNS: userDashboardData.dadosSaude.CNS ? safeDecrypt(userDashboardData.dadosSaude.CNS) : '',
            dataNascimento: userDashboardData.dadosSaude.dataNascimento ? safeDecrypt(userDashboardData.dadosSaude.dataNascimento) : '',
            sexo: userDashboardData.dadosSaude.sexo ? safeDecrypt(userDashboardData.dadosSaude.sexo) : '',
            tipoSanguineo: userDashboardData.dadosSaude.tipoSanguineo ? safeDecrypt(userDashboardData.dadosSaude.tipoSanguineo) : '',
            altura: userDashboardData.dadosSaude.altura ? safeDecrypt(userDashboardData.dadosSaude.altura) : '',
        };
        userDashboardData.dadosSaude = decryptedDadosSaude;
    }

    // Descriptografa os dados do histórico de peso, se existirem
    if (userDashboardData.historicoPeso) {
      userDashboardData.historicoPeso = userDashboardData.historicoPeso.map((registro: PesoHistorico) => ({
        ...registro,
        peso: safeDecrypt(registro.peso) || '',
        data: safeDecrypt(registro.data) || '',
      }));
    }

    // Descriptografa os dados das condições de saúde, se existirem
    if (userDashboardData.condicoesSaude) {
        userDashboardData.condicoesSaude = userDashboardData.condicoesSaude.map((condicao: CondicaoSaudeComProfissional) => ({
            ...condicao,
            nome: safeDecrypt(condicao.nome) || condicao.nome,
            objetivo: condicao.objetivo ? safeDecrypt(condicao.objetivo) : null,
            observacoes: condicao.observacoes ? safeDecrypt(condicao.observacoes) : null,
        }));
    }

    return NextResponse.json(userDashboardData);

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard do paciente:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno do servidor ao buscar dados do dashboard' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PATCH para atualizar os dados de saúde do paciente
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
    const basePayload = {
        CNS: dadosSaude.CNS ? encryptString(dadosSaude.CNS) : null,
        tipoSanguineo: dadosSaude.tipoSanguineo ? encryptString(dadosSaude.tipoSanguineo) : null,
        sexo: dadosSaude.sexo ? encryptString(dadosSaude.sexo) : null,
        dataNascimento: dadosSaude.dataNascimento ? encryptString(dadosSaude.dataNascimento) : null,
        altura: dadosSaude.altura ? encryptString(dadosSaude.altura) : null,
    };
    const alergiasArray = Array.isArray(dadosSaude.alergias) ? dadosSaude.alergias : [];
    const createPayload = { ...basePayload, alergias: alergiasArray };
    const updatePayload = { ...basePayload, alergias: { set: alergiasArray } };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dadosSaude: {
          upsert: { create: createPayload, update: updatePayload },
        },
      },
      include: { dadosSaude: true },
    });

    return NextResponse.json(updatedUser.dadosSaude);

  } catch (error) {
    console.error('Erro ao atualizar dados de saúde do paciente:', error);
    return new NextResponse(JSON.stringify({ 
        error: 'Erro interno do servidor ao atualizar dados',
        prismaError: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
}

// POST para adicionar um novo registro (peso OU condição de saúde)
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

    if (body.peso && body.data) {
      const { peso, data: dataPeso } = body;
      
      const encryptedPeso = encryptString(peso);
      const encryptedDataPeso = encryptString(dataPeso);

      const novoPeso = await prisma.pesoHistorico.create({
        data: {
          userId: userId,
          peso: encryptedPeso,
          data: encryptedDataPeso,
        },
      });

      return NextResponse.json(novoPeso, { status: 201 });
    }

    if (body.nome && body.dataInicio) {
        const { nome, objetivo, dataInicio, profissionalId, observacoes, cidCodigo, cidDescricao } = body;
        
        const novaCondicao = await prisma.condicaoSaude.create({
            data: {
                userId,
                nome,
                objetivo,
                dataInicio: new Date(dataInicio),
                profissionalId: profissionalId || null,
                observacoes,
                cidCodigo,
                cidDescricao,
            },
        });

        return NextResponse.json(novaCondicao, { status: 201 });
    }

    return new NextResponse(JSON.stringify({ error: 'Corpo da requisição inválido. Forneça os dados para peso ou para condição de saúde.' }), { status: 400 });

  } catch (error) {
    console.error('Erro no POST para o dashboard:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao processar a requisição' }), { status: 500 });
  }
}
