import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

// 📌 GET - Buscar uma consulta específica
export async function GET(
  request: Request,
  { params }: { params: { consultaId: string } },
) {
  try {
    const consultaId = params.consultaId;

    const consulta = await db.consultas.findUnique({
      where: {
        id: consultaId,
      },
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
export async function PATCH(
  request: Request,
  { params }: { params: { consultaId: string } },
) {
  try {
    const consultaId = params.consultaId;
    const body = await request.json();

    const consultaAtualizada = await db.consultas.update({
      where: {
        id: consultaId,
      },
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
  request: Request,
  { params }: { params: { consultaId: string } },
) {
  try {
    const consultaId = params.consultaId;

    await db.consultas.delete({
      where: {
        id: consultaId,
      },
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
