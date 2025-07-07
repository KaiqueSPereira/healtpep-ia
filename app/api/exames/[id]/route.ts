import { NextRequest, NextResponse } from "next/server";
import { prisma, db } from "@/app/_lib/prisma"; // Adicionado 'db' caso seja usado no PUT/DELETE original
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { safeDecrypt, encryptString } from "@/app/_lib/crypto"; // Adicionado encryptString para o PUT


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
        consulta: true,
        resultados: true, // necessário para descriptografar os resultados também
      },
    });

    if (!exame) {
      return NextResponse.json(
        { error: "Exame não encontrado" },
        { status: 404 },
      );
    }

    const exameDescriptografado = {
      ...exame,
      nome: exame.nome ? safeDecrypt(exame.nome) : null,
      nomeArquivo: exame.nomeArquivo ? safeDecrypt(exame.nomeArquivo) : null,
      anotacao: exame.anotacao ? safeDecrypt(exame.anotacao) : null,
      tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
      resultados: exame.resultados?.map((r) => ({
        ...r,
        nome: safeDecrypt(r.nome) ?? '',
        valor: safeDecrypt(r.valor) ?? '',
        unidade: safeDecrypt(r.unidade ?? "") ?? '',
        referencia: safeDecrypt(r.referencia ?? "") ?? '',
      })),
    };

    return NextResponse.json({ exame: exameDescriptografado }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar exame:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } },
) {
  console.log("--- Início do PUT em /api/exames/[id] ---");
  console.log("Content-Type da requisição:", req.headers.get("content-type"));

  const id = context.params.id; // Define id here

  try {
    const data = await req.json();
    const { anotacao, dataExame, tratamentoId, tipo, resultados } = data;

    console.log("Dados recebidos no PUT:", { id, anotacao, dataExame, tratamentoId, tipo, resultados });

    if (!id) {
      console.log("ID do exame ausente na rota PUT.");
      console.log("--- Fim do PUT em /api/exames/[id] ---");
      return NextResponse.json(
        { error: "ID do exame é obrigatório na URL" },
        { status: 400 },
      );
    }

    const transaction = await prisma.$transaction(async (prisma) => {
      // Now 'id' is accessible here

      // 1. Atualizar os campos do exame principal
      const updateData: any = {};
      if (anotacao !== undefined) {
          updateData.anotacao = encryptString(anotacao || "");
      }
      if (dataExame !== undefined) {
          updateData.dataExame = dataExame ? new Date(dataExame) : null;
      }
       if (tratamentoId !== undefined) {
          updateData.tratamentoId = tratamentoId;
       }
       if (tipo !== undefined) {
          updateData.tipo = tipo;
       }

      const exameAtualizado = await prisma.exame.update({
        where: { id }, // Use the defined id
        data: updateData,
      });

      console.log("Exame principal atualizado:", exameAtualizado.id);

      // 2. Processar os resultados de exame (criar, atualizar, ou deletar)
      const receivedResultIds = new Set();

      if (Array.isArray(resultados)) {
        const existingResultados = await prisma.resultadoExame.findMany({
            where: { exameId: id }, // Use the defined id
        });
        const existingResultIds = new Set(existingResultados.map(r => r.id));

        for (const resultado of resultados) {
          try {
              if (existingResultIds.has(resultado.id)) {
                  console.log("Attempting to update resultadoExame with ID:", resultado.id);
                  console.log("Update data:", resultado);
                  await prisma.resultadoExame.update({
                      where: { id: resultado.id },
                      data: {
                          nome: encryptString(resultado.nome || ""),
                          valor: encryptString(resultado.valor || ""),
                          unidade: encryptString(resultado.unidade || ""),
                          referencia: encryptString(resultado.referencia || ""),
                      },
                   });
                   console.log(`Resultado de exame existente atualizado: ${resultado.id}`);
                   receivedResultIds.add(resultado.id);
              } else {
                   console.log("Attempting to create new resultadoExame with ID:", resultado.id);
                   console.log("Create data:", resultado);
                  const novoResultado = await prisma.resultadoExame.create({
                      data: {
                          exameId: id, // Use the defined id
                          nome: encryptString(resultado.nome || ""),
                          valor: encryptString(resultado.valor || ""),
                          unidade: encryptString(resultado.unidade || ""),
                          referencia: encryptString(resultado.referencia || ""),
                      },
                  });
                   console.log(`Novo resultado de exame criado: ${novoResultado.id}`);
                   receivedResultIds.add(novoResultado.id);
              }
          } catch (error: any) {
               console.error(`Erro ao processar resultado de exame ${resultado.id}:`, error);
               throw new Error(`Erro ao processar resultado de exame ${resultado.id}: ${error.message}`);
          }
        }
      }

      // 3. Deletar resultados que foram removidos no frontend
      const currentDbResults = await prisma.resultadoExame.findMany({
          where: { exameId: id }, // Use the defined id
          select: { id: true },
      });

      const idsToDelete = currentDbResults
          .map(result => result.id)
          .filter(dbId => !receivedResultIds.has(dbId));

      if (idsToDelete.length > 0) {
          console.log("Attempting to delete results:", idsToDelete);
          try {
              await prisma.resultadoExame.deleteMany({
                  where: {
                      id: {
                          in: idsToDelete,
                      },
                  },
              });
              console.log(`Deletados ${idsToDelete.length} resultados de exame: ${idsToDelete.join(', ')}`);
          } catch (deleteError: any) {
               console.error("Erro ao deletar resultados de exame:", deleteError);
               throw new Error(`Erro ao deletar resultados de exame: ${deleteError.message}`);
          }
      } else {
          console.log("Nenhum resultado de exame para deletar.");
      }

      return exameAtualizado;

    });


    console.log("Exame e resultados processados com sucesso na transação.");
    console.log("--- Fim do PUT em /api/exames/[id] ---");
    return NextResponse.json({
      message: "Exame e resultados atualizados com sucesso",
      exame: transaction,
    });

  } catch (error: any) {
    console.error("Erro no handler PUT de exames:", error);
    console.log("--- Fim do PUT em /api/exames/[id] com erro ---");

    return NextResponse.json(
      { error: `Erro ao atualizar o exame e resultados: ${error.message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } },
) {
  const id = context.params.id; // Pegando o ID da rota dinâmica

  if (!id) { // Esta verificação é redundante, mas mantida por segurança
    return NextResponse.json({ error: "ID do exame não informado na URL" }, { status: 400 });
  }

  try {
    // Dependendo da sua configuração do Prisma e relacionamentos,
    // o deleteMany de resultados pode não ser necessário se você tiver `onDelete: Cascade`
    // configurado na relação entre Exame e ResultadoExame.
    await prisma.resultadoExame.deleteMany({ where: { exameId: id } });
    await prisma.exame.delete({ where: { id } });
    return NextResponse.json({ message: "Exame deletado com sucesso" });
  } catch (error) {
    console.error("Erro no handler DELETE de exames:", error);
    return NextResponse.json(
      { error: "Erro ao deletar o exame." },
      { status: 500 },
    );
  }
}
