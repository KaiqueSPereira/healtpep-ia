
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { encryptString, safeDecrypt, encrypt as encryptBuffer } from "@/app/_lib/crypto";
import { Prisma, ResultadoExame } from "@prisma/client";

interface ResultadoExameInput {
  id?: string;
  nome: string;
  valor: string;
  unidade?: string | null;
  referencia?: string | null;
}

// GET: Busca um exame específico com lógica condicional para anexos
export async function GET(
  request: NextRequest, // Usando NextRequest para acessar a URL
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = params.id;
  const { searchParams } = new URL(request.url);
  const includeAnexos = searchParams.get('includeAnexos') === 'true';

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    // Define dinamicamente o que será incluído na consulta
    const includeOptions: Prisma.ExameInclude = {
      profissional: true,
      unidades: {
        include: {
          endereco: true,
        },
      },
      consulta: {
        include: {
          profissional: true,
          unidade: true,
        },
      },
      resultados: true,
      condicaoSaude: true,
    };

    if (includeAnexos) {
      // Inclui a lista completa de anexos quando solicitado
      includeOptions.anexos = {
        orderBy: {
          createdAt: 'desc',
        }
      };
    } else {
      // Caso contrário, inclui apenas a contagem
      includeOptions._count = { select: { anexos: true } };
    }

    const exame = await prisma.exame.findUnique({
      where: { id, userId },
      include: includeOptions,
    });

    if (!exame) {
      return NextResponse.json(
        { error: "Exame não encontrado" },
        { status: 404 },
      );
    }

    // Função para descriptografar resultados continua a mesma
    const descriptografarResultados = (r: ResultadoExame) => ({
      ...r,
      nome: safeDecrypt(r.nome),
      valor: safeDecrypt(r.valor),
      unidade: r.unidade ? safeDecrypt(r.unidade) : null,
      referencia: r.referencia ? safeDecrypt(r.referencia) : null,
    });

    // Descriptografa os dados do exame principal e aninhados
    const exameDescriptografado = {
      ...exame,
      nome: safeDecrypt(exame.nome),
      anotacao: exame.anotacao ? safeDecrypt(exame.anotacao) : null,
      analiseIA: exame.analiseIA ? safeDecrypt(exame.analiseIA) : null,
      tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
      consulta: exame.consulta
        ? {
            ...exame.consulta,
            tipo: exame.consulta.tipo ? safeDecrypt(exame.consulta.tipo) : null,
            motivo: exame.consulta.motivo ? safeDecrypt(exame.consulta.motivo) : null,
          }
        : null,
      resultados: exame.resultados?.map(descriptografarResultados),
      // Se os anexos foram incluídos, descriptografa seus nomes
      ...((exame as any).anexos && { // Type assertion to access anexos
        anexos: (exame as any).anexos.map((anexo: any) => ({
          ...anexo,
          nomeArquivo: safeDecrypt(anexo.nomeArquivo),
        })),
      }),
    };

    return NextResponse.json({ exame: exameDescriptografado }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao buscar exame:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Atualiza um exame, agora salvando anexos na tabela correta
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "ID do exame é obrigatório" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    
    // Extrai os campos do FormData
    const anotacao = formData.get("anotacao") as string | null;
    const dataExameStr = formData.get("dataExame") as string | null;
    const tipo = formData.get("tipo") as string | null;
    const resultadosStr = formData.get("resultados") as string | null;
    const condicaoSaudeId = formData.get("condicaoSaudeId") as string | null;
    const profissionalId = formData.get("profissionalId") as string | null;
    const unidadesId = formData.get("unidadesId") as string | null;
    const consultaId = formData.get("consultaId") as string | null;
    const file = formData.get("file") as File | null;

    const transaction = await prisma.$transaction(async (prisma) => {
      // 1. Cria o novo anexo, se um arquivo for enviado
      if (file) {
        const nomeArquivo = file.name;
        const fileBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(fileBuffer);

        await prisma.anexoExame.create({
          data: {
            exameId: id,
            nomeArquivo: encryptString(nomeArquivo),
            arquivo: new Uint8Array(encryptBuffer(originalBuffer)),
          }
        });
      }

      // 2. Prepara os dados para atualização do exame
      const updateData: Prisma.ExameUpdateInput = {};
      if (anotacao !== null) updateData.anotacao = encryptString(anotacao);
      if (dataExameStr) {
        const dataExame = new Date(dataExameStr);
        if (!isNaN(dataExame.getTime())) {
            updateData.dataExame = dataExame;
        }
      }
      if (tipo) {
        updateData.tipo = encryptString(tipo);
        updateData.nome = encryptString(tipo);
      }
      if (profissionalId) updateData.profissional = { connect: { id: profissionalId } };
      if (unidadesId) updateData.unidades = { connect: { id: unidadesId } };
      updateData.consulta = consultaId && consultaId !== 'null' ? { connect: { id: consultaId } } : { disconnect: true };
      updateData.condicaoSaude = condicaoSaudeId && condicaoSaudeId !== 'null' ? { connect: { id: condicaoSaudeId } } : { disconnect: true };

      // 3. Atualiza o exame
      const exameAtualizado = await prisma.exame.update({
        where: { id: id, userId: session.user.id },
        data: updateData,
      });

      // 4. Processa os resultados (upsert/delete)
      if (resultadosStr) {
        const resultados: ResultadoExameInput[] = JSON.parse(resultadosStr);
        const receivedResultIds = new Set<string>();

        for (const resultado of resultados) {
          const encryptedData = {
            nome: encryptString(resultado.nome || ""),
            valor: encryptString(resultado.valor || ""),
            unidade: resultado.unidade ? encryptString(resultado.unidade) : null,
            referencia: resultado.referencia ? encryptString(resultado.referencia) : null,
          };
          
          if (resultado.id && resultado.id !== '') {
            const updatedResult = await prisma.resultadoExame.update({
              where: { id: resultado.id }, data: encryptedData });
            receivedResultIds.add(updatedResult.id);
          } else {
            const newResult = await prisma.resultadoExame.create({ data: { ...encryptedData, exameId: id } });
            receivedResultIds.add(newResult.id);
          }
        }

        const existingResultados = await prisma.resultadoExame.findMany({ where: { exameId: id }, select: { id: true } });
        const idsToDelete = existingResultados.map(r => r.id).filter(existingId => !receivedResultIds.has(existingId));
        
        if (idsToDelete.length > 0) {
          await prisma.resultadoExame.deleteMany({ where: { id: { in: idsToDelete } } });
        }
      }
      return exameAtualizado;
    });

    return NextResponse.json({ message: "Exame atualizado com sucesso", exame: transaction }, { status: 200 });

  } catch (error: unknown) {
    console.error("Erro detalhado ao atualizar exame:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Falha no servidor: ${errorMessage}` }, { status: 500 });
  }
}

// DELETE: Permanece o mesmo
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = params.id;

  try {
    await prisma.exame.delete({ where: { id: id, userId: session.user.id } });
    return NextResponse.json({ message: "Exame deletado com sucesso" });
  } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: `Erro ao deletar o exame: ${errorMessage}` },
      { status: 500 },
    );
  }
}
