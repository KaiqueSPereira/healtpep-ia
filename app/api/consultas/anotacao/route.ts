import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { encryptString } from "@/app/_lib/crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { consultaId, anotacao } = body;

    if (!consultaId || !anotacao) {
      return NextResponse.json(
        { error: "Missing consultaId or anotacao in request body" },
        { status: 400 }
      );
    }

    const encryptedAnotacao = encryptString(anotacao);

    const createdAnotacao = await db.anotacoes.create({
      data: {
        anotacao: encryptedAnotacao,
        consulta: {
          connect: {
            id: consultaId,
          },
        },
      },
    });

    return NextResponse.json(createdAnotacao, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar anotação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao criar anotação" },
      { status: 500 }
    );
  }
}