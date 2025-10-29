import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { Buffer } from 'buffer';
import {
  encryptString,
  safeDecrypt,
  encrypt as encryptBuffer
} from '@/app/_lib/crypto';

// Interface para garantir a tipagem dos dados de resultado recebidos.
interface ResultadoInput {
  nome: string;
  valor: string;
  unidade?: string;
  referencia?: string;
}

// GET: Busca e descriptografa exames e seus resultados.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    const exames = await prisma.exame.findMany({
      where: { userId: userId },
      include: { unidades: true, profissional: true, resultados: true },
      orderBy: { dataExame: 'desc' },
    });

    // Descriptografa tanto os campos do exame quanto os resultados aninhados.
    const decryptedExames = exames.map(exame => {
      const decryptedResultados = exame.resultados.map(res => ({
        ...res,
        nome: safeDecrypt(res.nome),
        valor: safeDecrypt(res.valor),
        unidade: res.unidade ? safeDecrypt(res.unidade) : null,
        referencia: res.referencia ? safeDecrypt(res.referencia) : null,
      }));

      return {
        ...exame,
        nome: safeDecrypt(exame.nome),
        tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
        anotacao: exame.anotacao ? safeDecrypt(exame.anotacao) : null,
        resultados: decryptedResultados,
      };
    });

    return NextResponse.json(decryptedExames, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar exames:", error);
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

    let nomeArquivo: string | undefined;
    let arquivoParaSalvar: Buffer | null = null;

    if (file) {
        nomeArquivo = file.name;
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
        nomeArquivo: nomeArquivo,
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
