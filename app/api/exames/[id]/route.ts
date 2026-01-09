import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { encryptString, safeDecrypt, encrypt as encryptBuffer } from "@/app/_lib/crypto";
import { Prisma, ResultadoExame } from "@prisma/client";
import { Buffer } from "buffer";

interface ResultadoExameInput {
  id?: string; // ID é opcional para novos resultados
  nome: string;
  valor: string;
  unidade?: string | null;
  referencia?: string | null;
}

// GET (Buscando um exame específico) - Permanece o mesmo
export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = context.params.id;

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const exame = await prisma.exame.findUnique({
      where: {
        id,
        userId,
      },
      include: {
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
      },
    });

    if (!exame) {
      return NextResponse.json(
        { error: "Exame não encontrado" },
        { status: 404 },
      );
    }

    const descriptografarResultados = (r: ResultadoExame) => ({
      ...r,
      nome: safeDecrypt(r.nome),
      valor: safeDecrypt(r.valor),
      unidade: r.unidade ? safeDecrypt(r.unidade) : null,
      referencia: r.referencia ? safeDecrypt(r.referencia) : null,
    });

    const exameDescriptografado = {
      ...exame,
      nome: safeDecrypt(exame.nome),
      nomeArquivo: exame.nomeArquivo ? safeDecrypt(exame.nomeArquivo) : null,
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
      profissional: exame.profissional || null,
      unidades: exame.unidades || null,
      resultados: exame.resultados?.map(descriptografarResultados),
      condicaoSaude: exame.condicaoSaude || null,
    };

    return NextResponse.json({ exame: exameDescriptografado }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao buscar exame:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao buscar exame";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


// PUT (Atualizando um exame) - CORRIGIDO PARA USAR FORMDATA
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = context.params.id;
  if (!id) {
    return NextResponse.json(
      { error: "ID do exame é obrigatório na URL" },
      { status: 400 },
    );
  }

  try {
    const formData = await req.formData();
    
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
      const updateData: Prisma.ExameUpdateInput = {};

      // Processa o upload de um novo arquivo, se houver
      if (file) {
        const nomeArquivo = file.name;
        updateData.nomeArquivo = encryptString(nomeArquivo);
        const fileBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(fileBuffer);
        updateData.arquivoExame = new Uint8Array(encryptBuffer(originalBuffer));
      }

      // Atualiza os campos de texto e data
      if (anotacao !== null) updateData.anotacao = encryptString(anotacao);
      if (dataExameStr) updateData.dataExame = new Date(dataExameStr);
      if (tipo) {
        updateData.tipo = encryptString(tipo);
        updateData.nome = encryptString(tipo); // Atualiza o nome principal do exame
      }

      // Atualiza as relações (foreign keys)
      if (profissionalId) updateData.profissional = { connect: { id: profissionalId } };
      if (unidadesId) updateData.unidades = { connect: { id: unidadesId } };

      // Lida com a conexão/desconexão de campos opcionais
      updateData.consulta = consultaId && consultaId !== 'null' ? { connect: { id: consultaId } } : { disconnect: true };
      updateData.condicaoSaude = condicaoSaudeId && condicaoSaudeId !== 'null' ? { connect: { id: condicaoSaudeId } } : { disconnect: true };

      // Primeiro, atualiza os campos principais do exame
      const exameAtualizado = await prisma.exame.update({
        where: { id: id, userId: session.user.id },
        data: updateData,
      });

      // Depois, processa os resultados do exame
      if (resultadosStr) {
        const resultados: ResultadoExameInput[] = JSON.parse(resultadosStr);
        const receivedResultIds = new Set<string>();

        // Itera sobre os resultados recebidos do frontend
        for (const resultado of resultados) {
          const encryptedData = {
            nome: encryptString(resultado.nome || ""),
            valor: encryptString(resultado.valor || ""),
            unidade: resultado.unidade ? encryptString(resultado.unidade) : null,
            referencia: resultado.referencia ? encryptString(resultado.referencia) : null,
          };
          
          if (resultado.id && resultado.id !== '') {
            // Se o resultado tem ID, atualiza
            const updatedResult = await prisma.resultadoExame.update({
              where: { id: resultado.id },
              data: encryptedData,
            });
            receivedResultIds.add(updatedResult.id);
          } else {
            // Se não tem ID, cria um novo
            const newResult = await prisma.resultadoExame.create({
              data: {
                ...encryptedData,
                exameId: id,
              },
            });
            receivedResultIds.add(newResult.id);
          }
        }

        // Deleta os resultados que não foram recebidos (ou seja, foram removidos no frontend)
        const existingResultados = await prisma.resultadoExame.findMany({
          where: { exameId: id },
          select: { id: true },
        });

        const idsToDelete = existingResultados
          .map(r => r.id)
          .filter(existingId => !receivedResultIds.has(existingId));
        
        if (idsToDelete.length > 0) {
          await prisma.resultadoExame.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }
      }
      return exameAtualizado;
    });

    return NextResponse.json({
      message: "Exame e resultados atualizados com sucesso",
      exame: transaction,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Erro detalhado ao atualizar exame:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao atualizar exame";
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Erro de sintaxe: JSON inválido nos resultados do exame." }, { status: 400 });
    }

    return NextResponse.json(
      { error: `Falha no servidor ao atualizar o exame: ${errorMessage}` },
      { status: 500 },
    );
  }
}

// DELETE (Deletando um exame) - Permanece o mesmo
export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = context.params.id;

  try {
    await prisma.exame.delete({ where: { id: id, userId: session.user.id } });
    return NextResponse.json({ message: "Exame deletado com sucesso" });
  } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao deletar exame";
    return NextResponse.json(
      { error: `Erro ao deletar o exame: ${errorMessage}` },
      { status: 500 },
    );
  }
}