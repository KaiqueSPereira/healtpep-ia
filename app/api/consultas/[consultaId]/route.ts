import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { Params } from "next/dist/shared/lib/router/utils/route-matcher";

// 📌 GET - Buscar uma consulta específica
export async function GET(_request: NextRequest, context: { params: Params }) {
  try {
    const consulta = await db.consultas.findUnique({
      where: { id: context.params.consultaId as string },
      include: {
        profissional: true,
        unidade: true,
        usuario: true,
      },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(consulta);
  } catch (error) {
    console.error("Erro ao buscar consulta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// 📌 PATCH - Atualizar uma consulta existente
export async function PATCH(request: NextRequest, context: { params: Params }) {
  try {
    const body = await request.json();

    const consultaAtualizada = await db.consultas.update({
      where: { id: context.params.consultaId as string },
      data: body,
      include: {
        profissional: true,
        unidade: true,
        usuario: true,
      },
    });

    return NextResponse.json(consultaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar consulta" },
      { status: 500 },
    );
  }
}

// 📌 DELETE - Deletar uma consulta
export async function DELETE(
  _request: NextRequest,
  context: { params: Params },
) {
  try {
    await db.consultas.delete({
      where: { id: context.params.consultaId as string },
    });

    return NextResponse.json(
      { message: "Consulta deletada com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao deletar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao deletar consulta" },
      { status: 500 },
    );
  }
}
