import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { Buffer } from 'buffer';
import {
  encryptString,
  safeDecrypt,
  encrypt as encryptBuffer
} from '@/app/_lib/crypto';

interface ResultadoInput {
  nome: string;
  valor: string;
  unidade?: string;
  referencia?: string;
}

// GET OTIMIZADO: Busca apenas os dados essenciais para a lista de exames.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    // Query otimizada: seleciona apenas os campos necessários para a lista.
    const exames = await prisma.exame.findMany({
      where: { userId: userId },
      select: {
        id: true,
        dataExame: true,
        nome: true, // O nome já está criptografado, será descriptografado no cliente se necessário
        tipo: true, // O tipo também está criptografado
        unidades: {
          select: {
            nome: true,
          },
        },
        profissional: {
          select: {
            nome: true,
            especialidade: true,
          },
        },
      },
      orderBy: { dataExame: 'desc' },
    });

    // Descriptografa os campos necessários no lado do servidor de forma eficiente
    const decryptedExames = exames.map(exame => ({
      ...exame,
      nome: safeDecrypt(exame.nome),
      tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
      // Mantemos os nomes da unidade e profissional como estão (não são criptografados)
      unidades: exame.unidades ? { nome: exame.unidades.nome } : null,
      profissional: exame.profissional ? { nome: exame.profissional.nome, especialidade: exame.profissional.especialidade } : null,
    }));

    return NextResponse.json(decryptedExames, { status: 200 });

  } catch (error) {
    console.error("Erro ao buscar exames (otimizado):", error);
    return NextResponse.json({ error: 'Falha ao buscar exames' }, { status: 500 });
  }
}

// POST: Cria um novo exame, criptografando todos os campos necessários.
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const userId = formData.get("userId") as string;
    const profissionalId = formData.get("profissionalId") as string | null;
    const unidadesId = formData.get("unidadesId") as string | null;
    const consultaId = formData.get("consultaId") as string | null;
    const condicaoSaudeId = formData.get("condicaoSaudeId") as string | null;
    const anotacao = formData.get("anotacao") as string | null;
    const dataExameStr = formData.get("dataExame") as string;
    const tipo = formData.get("tipo") as string;
    const resultadosStr = formData.get("resultados") as string | null;
    const file = formData.get("file") as File | null;

    if (!userId || !dataExameStr || !tipo) {
      return NextResponse.json({ error: "Campos obrigatórios (userId, dataExame, tipo) não foram fornecidos." }, { status: 400 });
    }

    const dataExame = new Date(dataExameStr);

    let encryptedNomeArquivo: string | null = null;
    let arquivoParaSalvar: Buffer | null = null;

    if (file) {
        const nomeArquivo = file.name;
        encryptedNomeArquivo = encryptString(nomeArquivo);
        const fileBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(fileBuffer);
        arquivoParaSalvar = encryptBuffer(originalBuffer);
    }

    const encryptedAnotacao = anotacao ? encryptString(anotacao) : null;
    const nomeExame = tipo || file?.name || 'Exame sem nome';

    const newExame = await prisma.exame.create({
      data: {
        userId,
        dataExame,
        nome: encryptString(nomeExame),
        nomeArquivo: encryptedNomeArquivo,
        arquivoExame: arquivoParaSalvar ? new Uint8Array(arquivoParaSalvar) : null,
        anotacao: encryptedAnotacao,
        tipo: encryptString(tipo),
        ...(profissionalId && { profissionalId }),
        ...(unidadesId && { unidadesId }),
        ...(consultaId && { consultaId }),
        ...(condicaoSaudeId && { condicaoSaudeId }),
      },
    });

    if (resultadosStr) {
      const resultados: ResultadoInput[] = JSON.parse(resultadosStr);

      const validResults = resultados.filter(
        (res) => res.nome && res.valor && res.valor.trim() !== ''
      );

      if (validResults.length > 0) {
        await prisma.resultadoExame.createMany({
          data: validResults.map((res) => ({
            exameId: newExame.id,
            nome: encryptString(res.nome),
            valor: encryptString(res.valor),
            unidade: res.unidade ? encryptString(res.unidade) : undefined,
            referencia: res.referencia ? encryptString(res.referencia) : undefined,
          })),
        });
      }
    }

    return NextResponse.json({ id: newExame.id, message: "Exame criado com sucesso" }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar exame:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Formato de JSON inválido nos resultados do exame.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    return NextResponse.json({ error: 'Falha ao criar exame', details: errorMessage }, { status: 500 });
  }
}
