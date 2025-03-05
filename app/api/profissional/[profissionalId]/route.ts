import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { profissionalId: string } },
) {
  const { profissionalId } = params;

  try {
    const profissional = await db.profissional.findUnique({
      where: { id: profissionalId },
      include: { unidades: true, tratamentos: true, consultas: true },
    });

    if (!profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(profissional);
  } catch (error) {
    console.error("Erro ao buscar profissional:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { profissionalId: string } },
) {
  const { profissionalId } = params;

  try {
    const body = await req.json();
    console.log(
      "📦 Dados recebidos no PATCH:",
      body,
      "Profissional ID:",
      profissionalId,
    );

    const { unidadeId } = body;

    if (!unidadeId) {
      console.error("⚠️ unidadeId está ausente");
      return NextResponse.json(
        { error: "O campo unidadeId é obrigatório" },
        { status: 400 },
      );
    }

    const profissionalAtualizado = await db.profissional.update({
      where: { id: profissionalId },
      data: {
        unidades: {
          connect: [{ id: unidadeId }],
        },
      },
    });

    return NextResponse.json(profissionalAtualizado);
  } catch (error) {
    console.error("❌ Erro ao atualizar profissional:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: { profissionalId: string } },
) {
  if (!params || !params.profissionalId) {
    return new Response("ID do profissional não fornecido", { status: 400 });
  }

  const { profissionalId } = params;

  try {
    await db.profissional.delete({
      where: { id: profissionalId },
    });

    return new Response("Profissional deletado com sucesso", { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar profissional:", error);
    return new Response("Erro interno ao deletar profissional", {
      status: 500,
    });
  }
}
