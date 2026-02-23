/// <reference types="node" />

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt, safeEncrypt, encryptString, encrypt as encryptBuffer } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { Prisma } from "@prisma/client";
import { logErrorToDb } from "@/app/_lib/logger";
import { standardizeBiomarkerName } from "@/app/_lib/biomarkerUtils";

interface ResultadoInput {
    nome: string;
    valor: string;
    unidade?: string | null;
    referencia?: string | null;
    valorReferencia?: string | null; 
}

interface ProcessedAnexo {
    nomeArquivo: string;
    mimetype: string;
    arquivo: Buffer;
}

// GET /api/exames
export async function GET(request: NextRequest) {
    const componentName = "API GET /api/exames";
    const searchParams = request.nextUrl.searchParams;

    if (searchParams.get('forMenu') === 'true') {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Você precisa estar autenticado." }, { status: 401 });
        }
        try {
            const exames = await prisma.exame.findMany({
                where: { userId: session.user.id },
                include: {
                    profissional: true,
                    profissionalExecutante: true,
                    unidades: true,
                    condicaoSaude: true, 
                },
                orderBy: { dataExame: 'desc' },
            });

            const decryptedExames = exames.map(exame => ({
                ...exame,
                tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
                profissional: exame.profissional && exame.profissional.nome
                    ? { ...exame.profissional, nome: safeDecrypt(exame.profissional.nome) }
                    : exame.profissional,
                 profissionalExecutante: exame.profissionalExecutante && exame.profissionalExecutante.nome
                    ? { ...exame.profissionalExecutante, nome: safeDecrypt(exame.profissionalExecutante.nome) }
                    : exame.profissionalExecutante,
                unidades: exame.unidades && exame.unidades.nome
                    ? { ...exame.unidades, nome: safeDecrypt(exame.unidades.nome) }
                    : exame.unidades,
            }));

            return NextResponse.json(decryptedExames, { status: 200 });

        } catch (error) {
             await logErrorToDb(
                "Erro ao buscar lista de exames para o menu.",
                error instanceof Error ? error.stack || error.message : String(error),
                componentName
            );
            return NextResponse.json({ error: "Não foi possível carregar os exames para o menu." }, { status: 500 });
        }
    }

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
                    profissionalExecutante: true,
                    unidades: true,
                    resultados: true,
                    condicaoSaude: true,
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

             const decryptedProfissionalExecutante = exame.profissionalExecutante && exame.profissionalExecutante.nome
                ? { ...exame.profissionalExecutante, nome: safeDecrypt(exame.profissionalExecutante.nome) }
                : exame.profissionalExecutante;

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
            
            const decryptedNome = exame.nome ? safeDecrypt(exame.nome) : "Exame";
            const decryptedTipo = exame.tipo ? safeDecrypt(exame.tipo) : null;
            const decryptedAnotacao = exame.anotacao ? safeDecrypt(exame.anotacao) : null;
            const decryptedAnaliseIA = exame.analiseIA ? safeDecrypt(exame.analiseIA) : null;


            return {
                ...exame,
                nome: decryptedNome,
                tipo: decryptedTipo,
                anotacao: decryptedAnotacao, 
                analiseIA: decryptedAnaliseIA,
                profissional: decryptedProfissional,
                profissionalExecutante: decryptedProfissionalExecutante,
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
        await logErrorToDb(
            "Erro ao buscar a lista de exames.", 
            error instanceof Error ? error.stack || error.message : String(error), 
            componentName
        );
        return NextResponse.json({ error: "Não foi possível carregar os exames. Tente novamente mais tarde." }, { status: 500 });
    }
}

// POST /api/exames - Cria um novo exame com resultados e anexos
export async function POST(request: Request) {
  const componentName = "API POST /api/exames";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Você precisa estar autenticado para realizar esta ação." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    const userId = formData.get("userId") as string;
    const tipo = formData.get("tipo") as string | null;
    const nome = formData.get("nome") as string | null;
    const anotacao = formData.get("anotacao") as string | null;
    const dataExameStr = formData.get("dataExame") as string | null;
    const unidadesId = formData.get("unidadesId") as string | null;
    const profissionalId = formData.get("profissionalId") as string | null;
    const profissionalExecutanteId = formData.get("profissionalExecutanteId") as string | null;
    const condicaoSaudeId = formData.get("condicaoSaudeId") as string | null;
    const consultaId = formData.get("consultaId") as string | null;
    const resultadosStr = formData.get("resultados") as string | null;
    const files = formData.getAll("files") as File[];

    if (!userId || !tipo || !nome) {
      return NextResponse.json({ error: "Por favor, preencha todos os campos obrigatórios (tipo e nome do exame)." }, { status: 400 });
    }

    const processedAnexos: ProcessedAnexo[] = [];
    if (files && files.length > 0) {
        for (const file of files) {
            if (file.size === 0) continue;
            const fileBuffer = await file.arrayBuffer();
            const originalBuffer = Buffer.from(fileBuffer);
            const encryptedPayload = encryptBuffer(originalBuffer);

            processedAnexos.push({
                nomeArquivo: encryptString(file.name),
                mimetype: file.type,
                arquivo: encryptedPayload,
            });
        }
    }

    const resultados: ResultadoInput[] = resultadosStr ? JSON.parse(resultadosStr) : [];

    const standardizedResultados = resultados.map(r => ({ ...r, nome: standardizeBiomarkerName(r.nome) }));

    const novoExameCompleto = await prisma.$transaction(async (tx) => {

      const createData: Prisma.ExameCreateInput = {
        usuario: { connect: { id: userId } },
        nome: safeEncrypt(nome),
        tipo: safeEncrypt(tipo),
      };

      if (anotacao) createData.anotacao = safeEncrypt(anotacao);
      if (dataExameStr) createData.dataExame = new Date(dataExameStr);
      if (unidadesId && unidadesId !== 'null') createData.unidades = { connect: { id: unidadesId } };
      if (profissionalId && profissionalId !== 'null') createData.profissional = { connect: { id: profissionalId } };
      if (profissionalExecutanteId && profissionalExecutanteId !== 'null') createData.profissionalExecutante = { connect: { id: profissionalExecutanteId } };
      if (condicaoSaudeId && condicaoSaudeId !== 'null') createData.condicaoSaude = { connect: { id: condicaoSaudeId } };
      if (consultaId && consultaId !== 'null') createData.consulta = { connect: { id: consultaId } };

      const novoExame = await tx.exame.create({ data: createData });

      if (standardizedResultados.length > 0) {
        await tx.resultadoExame.createMany({
          data: standardizedResultados.map((r: ResultadoInput) => ({
            exameId: novoExame.id,
            nome: safeEncrypt(r.nome),
            valor: safeEncrypt(r.valor),
            unidade: r.unidade ? safeEncrypt(r.unidade) : null,
            referencia: r.referencia || r.valorReferencia ? safeEncrypt(r.referencia || r.valorReferencia || "") : null,
          })),
        });
      }

      if (processedAnexos.length > 0) {
        await tx.anexoExame.createMany({
          data: processedAnexos.map(anexo => ({
              ...anexo,
              exameId: novoExame.id,
          })) as Prisma.AnexoExameCreateManyInput[],
        });
      }
      
      const exameComRelacoes = await tx.exame.findUnique({
        where: { id: novoExame.id },
        include: {
            resultados: true,
            _count: { select: { anexos: true } }
        }
      });

      return exameComRelacoes;
    }, { timeout: 20000 });

    return NextResponse.json({ message: "Exame criado com sucesso!", exame: novoExameCompleto }, { status: 201 });

  } catch (error: unknown) {
    await logErrorToDb(
        "Erro ao criar o exame.",
        error instanceof Error ? error.stack || error.message : String(error),
        componentName
    );
    return NextResponse.json({ error: "Não foi possível salvar o exame. Verifique os dados e tente novamente." }, { status: 500 });
  }
}
