import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";


// 📌 GET - Buscar uma consulta específica
export async function GET(
  req: Request,
  { params }: { params: { consultaId: string } },
) {
  try {
    const { consultaId } = params;

    const consulta = await db.consultas.findUnique({
      where: { id: consultaId },
      include: {
        usuario: true,
        profissional: true,
        unidade: true,
      },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(consulta);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar a consulta" },
      { status: 500 },
    );
  }
}

// 📌 PATCH - Atualizar uma consulta existente
export async function PATCH(
  req: Request,
  { params }: { params: { consultaId: string } },
) {
  try {
    const body = await req.json();
    const { consultaId } = params;

    const consulta = await db.consultas.findUnique({
      where: { id: consultaId },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    const consultaAtualizada = await db.consultas.update({
      where: { id: consultaId },
      data: {
        data: body.data ? new Date(body.data) : undefined,
        queixas: body.queixas,
        tratamento: body.tratamento,
        tipodeexame: body.tipodeexame,
        tipo: body.tipo,
        profissionalId: body.profissionalId,
        unidadeId: body.unidadeId ?? undefined,
      },
    });

    return NextResponse.json(consultaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar a consulta:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar a consulta" },
      { status: 500 },
    );
  }
}

// 📌 DELETE - Deletar uma consulta
export async function DELETE(
  req: Request,
  { params }: { params: { consultaId: string } },
) {
  try {
    const { consultaId } = params;

    const consulta = await db.consultas.findUnique({
      where: { id: consultaId },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "Consulta não encontrada" },
        { status: 404 },
      );
    }

    await db.consultas.delete({
      where: { id: consultaId },
    });

    return NextResponse.json({ message: "Consulta deletada com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar a consulta:", error);
    return NextResponse.json(
      { error: "Falha ao deletar a consulta" },
      { status: 500 },
    );
  }
}
