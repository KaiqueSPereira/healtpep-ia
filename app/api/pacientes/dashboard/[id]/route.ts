
import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { safeDecrypt, encryptString } from '@/app/_lib/crypto';

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
        historicoPeso: { orderBy: { data: 'asc' } },
        condicoesSaude: { // UPDATED from tratamentos
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

    // Descriptografa os dados do histórico de peso antes de retornar
    if (userDashboardData.historicoPeso) {
      userDashboardData.historicoPeso = userDashboardData.historicoPeso.map(registro => ({
        ...registro,
        peso: safeDecrypt(registro.peso) || '',
        data: safeDecrypt(registro.data) || '',
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
        CNS: dadosSaude.CNS || null,
        tipoSanguineo: dadosSaude.tipoSanguineo || null,
        sexo: dadosSaude.sexo || null,
        dataNascimento: dadosSaude.dataNascimento || null,
        altura: dadosSaude.altura || null,
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

    // Se o corpo da requisição tiver 'peso' e 'data', cria um registro de peso.
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

    // Se o corpo tiver 'nome' e 'dataInicio', cria uma condição de saúde.
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

    // Se o corpo não corresponder a nenhum dos casos acima.
    return new NextResponse(JSON.stringify({ error: 'Corpo da requisição inválido. Forneça os dados para peso ou para condição de saúde.' }), { status: 400 });

  } catch (error) {
    console.error('Erro no POST para o dashboard:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno ao processar a requisição' }), { status: 500 });
  }
}
