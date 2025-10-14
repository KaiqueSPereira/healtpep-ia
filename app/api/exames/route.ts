
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { encrypt, encryptString, safeDecrypt } from "@/app/_lib/crypto";
import { Buffer } from 'buffer';
import { Prisma } from "@prisma/client";

interface ResultadoExame {
    id: string;
    nome: string;
    valor: string;
    unidade: string | null;
    referencia: string | null;
}

interface RawResultado {
    nome?: string;
    valor?: string;
    unidade?: string;
    referencia?: string;
    valorReferencia?: string;
}

const examWithDetails = Prisma.validator<Prisma.ExameDefaultArgs>()({
  select: { 
    id: true,
    nome: true,
    nomeArquivo: true,
    dataExame: true,
    anotacao: true,
    analiseIA: true,
    tipo: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    resultados: { select: { id: true, nome: true, valor: true, unidade: true, referencia: true } },
    profissional: { select: { id: true, nome: true, especialidade: true, NumClasse: true } },
    unidades: { select: { id: true, nome: true, tipo: true, telefone: true, endereco: { select: { nome: true } } } },
  },
});

type ExamPayload = Prisma.ExameGetPayload<typeof examWithDetails>;

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const exams = await prisma.exame.findMany({
      where: { userId: userId },
      select: examWithDetails.select,
      orderBy: { dataExame: 'desc' },
    });

    const decryptedExams = exams.map((exame: ExamPayload) => {
      const decryptedNome = exame.nome ? safeDecrypt(exame.nome) : null;
      const decryptedNomeArquivo = exame.nomeArquivo ? safeDecrypt(exame.nomeArquivo) : null;
      const decryptedAnotacao = exame.anotacao ? safeDecrypt(exame.anotacao) : null;
      const decryptedAnaliseIA = exame.analiseIA ? safeDecrypt(exame.analiseIA) : null;

      const decryptedResultados = exame.resultados ? exame.resultados.map((resultado: ResultadoExame) => ({
          ...resultado,
          nome: resultado.nome ? safeDecrypt(resultado.nome) : '',
          valor: resultado.valor ? safeDecrypt(resultado.valor) : '',
          unidade: resultado.unidade ? safeDecrypt(resultado.unidade) : null,
          referencia: resultado.referencia ? safeDecrypt(resultado.referencia) : null,
      })) : [];

      return {
        ...exame,
        nome: decryptedNome,
        nomeArquivo: decryptedNomeArquivo,
        anotacao: decryptedAnotacao,
        analiseIA: decryptedAnaliseIA,
        resultados: decryptedResultados,
      };
    });

    return NextResponse.json(decryptedExams);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Um erro desconhecido ocorreu";
    console.error("Erro ao buscar exames:", error);
    return NextResponse.json({ error: `Erro ao buscar exames: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const profissionalId = formData.get("profissionalId")?.toString();
    const unidadeId = formData.get("unidadeId")?.toString();
    const consultaId = formData.get("consultaId")?.toString() || null;
    const tratamentoId = formData.get("tratamentoId")?.toString() || null;
    const anotacao = formData.get("anotacao")?.toString() || "";
    const dataExame = formData.get("dataExame")?.toString();
    const file = formData.get("file") as File | null;
    const tipo = formData.get("tipo")?.toString();
    const examesRaw = formData.get("exames")?.toString();

    if (!userId || !profissionalId || !unidadeId || !dataExame || !tipo) {
        return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    let encryptedFileBuffer = null;
    let originalFileName = null;
    let uniqueFileName = null;

    if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        encryptedFileBuffer = encrypt(fileBuffer);
        originalFileName = file.name;
        uniqueFileName = `${randomUUID()}-${originalFileName}`;
    }

    const exame = await prisma.exame.create({
      data: {
        nome: encryptString(originalFileName || "Arquivo sem nome"),
        nomeArquivo: encryptString(uniqueFileName || ""),
        dataExame: dataExame,
        anotacao: encryptString(anotacao),
        userId, profissionalId, unidadesId: unidadeId,
        consultaId, tratamentoId, tipo,
        arquivoExame: encryptedFileBuffer,
        analiseIA: null,
      },
    });

    if (examesRaw) {
        const examesResultados = JSON.parse(examesRaw);
        if (Array.isArray(examesResultados) && examesResultados.length > 0) {
            await prisma.resultadoExame.createMany({
                data: examesResultados.map((e: RawResultado) => ({ 
                    exameId: exame.id,
                    nome: encryptString(e.nome || ""),
                    valor: encryptString(e.valor || ""),
                    unidade: encryptString(e.unidade || ""),
                    referencia: encryptString(e.referencia || e.valorReferencia || ""),
                })),
            });
        }
    }

    return NextResponse.json({ 
        message: "Exame cadastrado com sucesso!",
        examId: exame.id 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Um erro desconhecido ocorreu";
    console.error("Erro no handler POST de exames:", error);
    return NextResponse.json({ error: `Erro ao salvar o exame: ${errorMessage}` }, { status: 500 });
  }
}
