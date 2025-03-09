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
  try {
    const profissionalId = params.profissionalId;
    const body = await req.json();
    const { unidadeId } = body;

    if (!unidadeId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ID da unidade é obrigatório",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const profissionalAtualizado = await db.profissional.update({
      where: {
        id: profissionalId,
      },
      data: {
        unidades: {
          set: [],
          connect: [{ id: unidadeId }],
        },
      },
      include: {
        unidades: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Unidade atualizada com sucesso",
        data: profissionalAtualizado,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("❌ Erro ao atualizar profissional:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Erro ao atualizar unidade do profissional",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
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
