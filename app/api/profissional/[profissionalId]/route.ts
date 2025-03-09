import { db } from "@/app/_lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { Params } from "next/dist/shared/lib/router/utils/route-matcher";

export async function GET(_request: NextRequest, context: { params: Params }) {
  try {
    const profissional = await db.profissional.findUnique({
      where: {
        id: context.params.profissionalId as string,
      },
      include: {
        unidades: true,
        tratamentos: true,
        consultas: {
          include: {
            usuario: true,
            unidade: true,
          },
        },
      },
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

export async function PATCH(request: NextRequest, context: { params: Params }) {
  try {
    const body = await request.json();

    const profissionalAtualizado = await db.profissional.update({
      where: {
        id: context.params.profissionalId as string,
      },
      data: {
        nome: body.nome,
        especialidade: body.especialidade,
        NumClasse: body.NumClasse,
      },
      include: {
        unidades: true,
        consultas: {
          include: {
            usuario: true,
            unidade: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: profissionalAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar profissional" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Params },
) {
  try {
    await db.profissional.delete({
      where: {
        id: context.params.profissionalId as string,
      },
    });

    return NextResponse.json(
      { message: "Profissional deletado com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao deletar profissional:", error);
    return NextResponse.json(
      { error: "Erro ao deletar profissional" },
      { status: 500 },
    );
  }
}
