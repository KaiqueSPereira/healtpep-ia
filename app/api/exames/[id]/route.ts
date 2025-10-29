import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { encryptString, safeDecrypt } from "@/app/_lib/crypto"; 
import { Prisma, ResultadoExame } from "@prisma/client"; 

interface ResultadoExameInput {
  id: string;
  nome: string;
  valor: string;
  unidade?: string | null;
  referencia?: string | null;
}

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
        unidades: true,
        // CORREÇÃO: Inclui os dados aninhados da consulta para profissional e unidade
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
      nomeArquivo: exame.nomeArquivo, 
      anotacao: exame.anotacao ? safeDecrypt(exame.anotacao) : null,
      analiseIA: exame.analiseIA ? safeDecrypt(exame.analiseIA) : null,
      tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
      // CORREÇÃO: Descriptografa os campos da consulta antes de enviá-los
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

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } },
) {

  const id = context.params.id;

   if (!id) {
      return NextResponse.json(
        { error: "ID do exame é obrigatório na URL" },
        { status: 400 },
      );
    }

  try {
    const data = await req.json();
    const { anotacao, dataExame, tipo, resultados, condicaoSaudeId } = data;

    const transaction = await prisma.$transaction(async (prisma) => {

      const updateData: Prisma.ExameUpdateInput = {};

      if (anotacao !== undefined) {
        updateData.anotacao = encryptString(anotacao || "");
      }
      
      if (dataExame) {
        updateData.dataExame = dataExame;
      }
      
      if (tipo !== undefined) {
        updateData.tipo = encryptString(tipo || "");
      }

      if (condicaoSaudeId !== undefined) {
        if (condicaoSaudeId === null) {
          updateData.condicaoSaude = { disconnect: true };
        } else {
          updateData.condicaoSaude = { connect: { id: condicaoSaudeId } };
        }
      }

      const exameAtualizado = await prisma.exame.update({
        where: { id },
        data: updateData,
      });

      const receivedResultIds = new Set();

      if (Array.isArray(resultados)) {
        const resultadosTyped: ResultadoExameInput[] = resultados;
        const existingResultados = await prisma.resultadoExame.findMany({
            where: { exameId: id },
        });
        const existingResultIds = new Set(existingResultados.map(r => r.id));

        for (const resultado of resultadosTyped) {
          try {
              if (existingResultIds.has(resultado.id)) {
                  await prisma.resultadoExame.update({
                      where: { id: resultado.id },
                      data: {
                          nome: encryptString(resultado.nome || ""),
                          valor: encryptString(resultado.valor || ""),
                          unidade: encryptString(resultado.unidade || ""),
                          referencia: encryptString(resultado.referencia || ""),
                      },
                   });
                   receivedResultIds.add(resultado.id);
              } else {
                  const novoResultado = await prisma.resultadoExame.create({
                      data: {
                          exameId: id,
                          nome: encryptString(resultado.nome || ""),
                          valor: encryptString(resultado.valor || ""),
                          unidade: encryptString(resultado.unidade || ""),
                          referencia: encryptString(resultado.referencia || ""),
                      },
                  });
                   receivedResultIds.add(novoResultado.id);
              }
          } catch (error: unknown) {
               const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar resultado";
               throw new Error(`Erro ao processar resultado de exame: ${errorMessage}`);
          }
        }
      }

      const currentDbResults = await prisma.resultadoExame.findMany({
          where: { exameId: id },
          select: { id: true },
      });

      const idsToDelete = currentDbResults
          .map(result => result.id)
          .filter(dbId => !receivedResultIds.has(dbId));

      if (idsToDelete.length > 0) {
          try {
              await prisma.resultadoExame.deleteMany({
                  where: {
                      id: {
                          in: idsToDelete,
                      },
                  },
              });
          } catch (deleteError: unknown) {
               console.error("Erro ao deletar resultados de exame:", deleteError);
                const errorMessage = deleteError instanceof Error ? deleteError.message : "Erro desconhecido ao deletar resultados";
               throw new Error(`Erro ao deletar resultados de exame: ${errorMessage}`);
          }
      } else {
          console.log("Nenhum resultado de exame para deletar.");
      }

      return exameAtualizado;

    });

    return NextResponse.json({
      message: "Exame e resultados atualizados com sucesso",
      exame: transaction,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao atualizar exame e resultados";

    return NextResponse.json(
      { error: `Erro ao atualizar o exame e resultados: ${errorMessage}` },
      { status: 500 },
    );
  }
}

export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } },
) {
  const id = context.params.id;

  try {
    await prisma.exame.delete({ where: { id } });
    return NextResponse.json({ message: "Exame deletado com sucesso" });
  } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao deletar exame";
    return NextResponse.json(
      { error: `Erro ao deletar o exame: ${errorMessage}` },
      { status: 500 },
    );
  }
}
