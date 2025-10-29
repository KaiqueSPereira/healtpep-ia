import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { Buffer } from 'buffer';

import { 
  encryptString, 
  safeDecrypt, 
  encrypt as encryptBuffer 
} from '@/app/_lib/crypto';

// GET handler (sem alterações)
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

    const decryptedExames = exames.map(exame => ({
      ...exame,
      nome: safeDecrypt(exame.nome),
      tipo: exame.tipo ? safeDecrypt(exame.tipo) : exame.tipo,
      anotacao: exame.anotacao ? safeDecrypt(exame.anotacao) : null,
    }));

    return NextResponse.json(decryptedExames, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar exames:", error);
    return NextResponse.json({ error: 'Falha ao buscar exames' }, { status: 500 });
  }
}

// POST handler com a correção final de tipo
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
    let arquivoExame: Buffer | undefined;

    if (file) {
        nomeArquivo = file.name;
        const fileBuffer = await file.arrayBuffer();
        arquivoExame = encryptBuffer(Buffer.from(fileBuffer));
    }

    const encryptedAnotacao = anotacao ? encryptString(anotacao) : null;
    const nomeExame = tipo || file?.name || 'Exame sem nome';

    const newExame = await prisma.exame.create({
      data: {
        userId,
        dataExame,
        nome: encryptString(nomeExame),
        nomeArquivo: nomeArquivo,
        arquivoExame: arquivoExame ? new Uint8Array(arquivoExame) : null,
        anotacao: encryptedAnotacao,
        tipo: encryptString(tipo),
        ...(profissionalId && { profissionalId }),
        ...(unidadesId && { unidadesId }),
        ...(consultaId && { consultaId }),
        ...(condicaoSaudeId && { condicaoSaudeId }),
      },
    });

    if (resultadosStr) {
      const resultados = JSON.parse(resultadosStr);
      
      const validResults = resultados.filter(
        (res: { nome?: string; valor?: string }) => 
          res.nome && res.valor && res.valor.trim() !== '' && res.valor.trim() !== '-'
      );

      if (validResults.length > 0) {
        await prisma.resultadoExame.createMany({
          data: validResults.map((res: any) => ({
            exameId: newExame.id,
            nome: res.nome,
            valor: res.valor,
            unidade: res.unidade,
            referencia: res.referencia,
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
    return NextResponse.json({ error: 'Falha ao criar exame', details: (error as Error).message }, { status: 500 });
  }
}
