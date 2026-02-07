import { prisma, Prisma } from '@/app/_lib/prisma';
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

// GET: Versão original e funcional.
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
        nomeArquivo: exame.nomeArquivo ? safeDecrypt(exame.nomeArquivo) : null,
        resultados: decryptedResultados,
      };
    });

    return NextResponse.json(decryptedExames, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar exames:", error);
    return NextResponse.json({ error: 'Falha ao buscar exames' }, { status: 500 });
  }
}

// POST: Versão final, limpa e robusta.
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
      return NextResponse.json({ error: "Campos obrigatórios não foram fornecidos." }, { status: 400 });
    }

    const dataExame = new Date(dataExameStr);

    let encryptedNomeArquivo: string | null = null;
    let arquivoParaSalvar: Buffer | null = null;

    if (file) {
        const nomeArquivo = file.name;
        encryptedNomeArquivo = encryptString(nomeArquivo);
        const fileBuffer = await file.arrayBuffer();
        arquivoParaSalvar = encryptBuffer(Buffer.from(fileBuffer));
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
      },
    });

    const dataToUpdate: Prisma.ExameUpdateInput = {};
    
    if (profissionalId && profissionalId.trim() && profissionalId !== 'undefined') {
      dataToUpdate.profissional = { connect: { id: profissionalId.trim() } };
    }
    if (unidadesId && unidadesId.trim() && unidadesId !== 'undefined') {
      dataToUpdate.unidades = { connect: { id: unidadesId.trim() } };
    }
    if (consultaId && consultaId.trim() && consultaId !== 'undefined') {
      dataToUpdate.consulta = { connect: { id: consultaId.trim() } };
    }
    if (condicaoSaudeId && condicaoSaudeId.trim() && condicaoSaudeId !== 'undefined') {
      dataToUpdate.condicaoSaude = { connect: { id: condicaoSaudeId.trim() } };
    }

    if (Object.keys(dataToUpdate).length > 0) {
      try {
        await prisma.exame.update({
          where: { id: newExame.id },
          data: dataToUpdate,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
          // A associação falhou porque o ID não foi encontrado. 
          // O erro é ignorado intencionalmente para não impedir a criação do exame.
          // Opcional: logar para um sistema de monitoramento em produção.
        } else {
          throw e;
        }
      }
    }

    if (resultadosStr) {
      const resultados: ResultadoInput[] = JSON.parse(resultadosStr);
      const validResults = resultados.filter(res => res.nome && res.valor && res.valor.trim() !== '');
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
