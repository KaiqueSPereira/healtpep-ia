import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { ApiRouteHandler } from "../../types";

type ProfissionalParams = {
  profissionalId: string;
};

export const GET: ApiRouteHandler<ProfissionalParams> = async (
  _request,
  { params },
) => {
  try {
    const profissional = await db.profissional.findUnique({
      where: { id: params.profissionalId },
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
};

export const PATCH: ApiRouteHandler<ProfissionalParams> = async (
  request,
  { params },
) => {
  try {
    const body = await request.json();

    const profissionalAtualizado = await db.profissional.update({
      where: { id: params.profissionalId },
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
};

export const DELETE: ApiRouteHandler<ProfissionalParams> = async (
  _request,
  { params },
) => {
  try {
    await db.profissional.delete({
      where: { id: params.profissionalId },
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
};
