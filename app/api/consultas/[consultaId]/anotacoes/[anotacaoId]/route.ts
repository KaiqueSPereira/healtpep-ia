
import { NextResponse } from "next/server";
import { decryptString, encryptString } from "@/app/_lib/crypto";
import { db } from "@/app/_lib/prisma";

// 📌 PATCH - Atualizar uma anotação específica
export async function PATCH(
  request: Request,
  { params }: { params: { consultaId: string; anotacaoId: string } },
) {
  try {
    const body = await request.json();
    const { anotacao } = body;

    if (!anotacao) {
      return NextResponse.json(
        { error: "O conteúdo da anotação é obrigatório para atualização." },
        { status: 400 },
      );
    }

    const encryptedAnotacao = encryptString(anotacao);

    const updatedAnotacao = await db.anotacoes.update({ // Usando db.anotacao
      where: { id: params.anotacaoId },
      data: { anotacao: encryptedAnotacao },
    });

    const decryptedAnotacao = {
        ...updatedAnotacao,
        anotacao: decryptString(updatedAnotacao.anotacao),
    };

    return NextResponse.json(decryptedAnotacao, { status: 200 });

  } catch (error) {
    console.error("Erro ao atualizar anotação:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar anotação." },
      { status: 500 },
    );
  }
}

// 📌 DELETE - Deletar uma anotação específica
export async function DELETE(
  request: Request,
  { params }: { params: { consultaId: string; anotacaoId: string } },
) {
  try {
    await db.anotacoes.delete({ where: { id: params.anotacaoId } }); // Usando db.anotacao

    return NextResponse.json({ message: "Anotação deletada com sucesso." }, { status: 200 });

  } catch (error) {
    console.error("Erro ao deletar anotação:", error);
    return NextResponse.json({ error: "Erro ao deletar anotação." }, { status: 500 });
  }
}
