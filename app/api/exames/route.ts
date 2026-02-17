
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt, encryptString, encrypt as encryptBuffer } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { Prisma } from "@prisma/client";
import { Buffer } from "buffer";


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!userId) {
        return NextResponse.json({ error: "O ID do usuário é obrigatório." }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    try {
        const [exames, total] = await prisma.$transaction([
            prisma.exame.findMany({
                where: { userId: userId },
                include: {
                    profissional: true,
                    unidades: true,
                    resultados: true,
                    _count: { select: { anexos: true } },
                },
                orderBy: { dataExame: 'desc' },
                skip: skip,
                take: limit,
            }),
            prisma.exame.count({ where: { userId: userId } })
        ]);

        const decryptedExames = exames.map(exame => {
            const decryptedProfissional = exame.profissional && exame.profissional.nome
                ? { ...exame.profissional, nome: safeDecrypt(exame.profissional.nome) }
                : exame.profissional;

            const decryptedUnidade = exame.unidades && exame.unidades.nome
                ? { ...exame.unidades, nome: safeDecrypt(exame.unidades.nome) }
                : exame.unidades;

            const decryptedResultados = exame.resultados.map(resultado => ({
                ...resultado,
                nome: safeDecrypt(resultado.nome),
                valor: safeDecrypt(resultado.valor),
                unidade: resultado.unidade ? safeDecrypt(resultado.unidade) : null,
                referencia: resultado.referencia ? safeDecrypt(resultado.referencia) : null,
            }));
            
            const decryptedTipo = exame.tipo ? safeDecrypt(exame.tipo) : null;
            const decryptedAnotacao = exame.anotacao ? safeDecrypt(exame.anotacao) : null;

            return {
                ...exame,
                tipo: decryptedTipo,
                anotacao: decryptedAnotacao, 
                profissional: decryptedProfissional,
                unidades: decryptedUnidade,
                resultados: decryptedResultados,
            };
        });

        return NextResponse.json({
            exames: decryptedExames,
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit)
        }, { status: 200 });

    } catch (error) {
        console.error("Erro ao buscar exames:", error);
        return NextResponse.json({ error: "Erro interno do servidor ao buscar exames." }, { status: 500 });
    }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const tipo = formData.get("tipo") as string | null;
    const anotacao = formData.get("anotacao") as string | null;
    const dataExameStr = formData.get("dataExame") as string | null;
    const unidadesId = formData.get("unidadesId") as string | null;
    const profissionalId = formData.get("profissionalId") as string | null;
    const condicaoSaudeId = formData.get("condicaoSaudeId") as string | null;
    const consultaId = formData.get("consultaId") as string | null;
    const files = formData.getAll("files") as File[];

    if (!userId || !tipo) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const createData: Prisma.ExameCreateInput = {
      usuario: { connect: { id: userId } },
      nome: encryptString(tipo),
      tipo: encryptString(tipo),
    };

    if (anotacao) createData.anotacao = encryptString(anotacao);
    if (dataExameStr) createData.dataExame = new Date(dataExameStr);
    if (unidadesId && unidadesId !== 'null') createData.unidades = { connect: { id: unidadesId } };
    if (profissionalId && profissionalId !== 'null') createData.profissional = { connect: { id: profissionalId } };
    if (condicaoSaudeId && condicaoSaudeId !== 'null') createData.condicaoSaude = { connect: { id: condicaoSaudeId } };
    if (consultaId && consultaId !== 'null') createData.consulta = { connect: { id: consultaId } };

    const novoExame = await prisma.exame.create({ data: createData });

    if (files && files.length > 0) {
      for (const file of files) {
        const nomeArquivo = file.name;
        const fileBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(fileBuffer);

        await prisma.anexoExame.create({
          data: {
            exameId: novoExame.id,
            nomeArquivo: encryptString(nomeArquivo),
            mimetype: file.type,
            arquivo: new Uint8Array(encryptBuffer(originalBuffer)),
          }
        });
      }
    }

    return NextResponse.json({ message: "Exame criado com sucesso", exame: novoExame }, { status: 201 });

  } catch (error: unknown) {
    console.error("Erro detalhado ao criar exame:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Falha no servidor: ${errorMessage}` }, { status: 500 });
  }
}

