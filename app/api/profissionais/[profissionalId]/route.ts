// app/api/profissional/[profissionalId]/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { safeDecrypt } from "@/app/_lib/crypto";

const profissionalPatchSchema = z.object({
  nome: z.string().min(1, "O nome e obrigatorio.").optional(),
  especialidade: z.string().min(1, "A especialidade e obrigatoria.").optional(),
  NumClasse: z.string().min(1, "O numero de classe e obrigatorio.").optional(),
}).strict().partial();

export async function GET(
  request: Request,
  { params }: { params: { profissionalId: string } },
) {
  try {
    const profissional = await db.profissional.findUnique({
      where: { id: params.profissionalId },
      include: {
        unidades: true,
        condicoesSaude: true,
        consultas: {
          include: {
            usuario: true,
            unidade: true,
          },
        },
        exames: {
          include: {
            usuario: true,
            unidades: true,
          },
          orderBy: {
            dataExame: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 },
      );
    }

    // Descriptografar todos os dados sensíveis aqui no servidor
    const decryptedData = {
      ...profissional,
      nome: safeDecrypt(profissional.nome),
      especialidade: profissional.especialidade ? safeDecrypt(profissional.especialidade) : profissional.especialidade,
      exames: profissional.exames.map(exame => ({
        ...exame,
        tipo: exame.tipo ? safeDecrypt(exame.tipo) : exame.tipo,
        usuario: (exame.usuario && exame.usuario.name)
          ? { ...exame.usuario, name: safeDecrypt(exame.usuario.name) }
          : exame.usuario,
      })),
    };

    return NextResponse.json(decryptedData);

  } catch (error) {
    console.error("Erro ao buscar profissional:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { profissionalId: string } },
) {
  try {
    const { profissionalId } = params;
    const body = await request.json();

    const parsedData = profissionalPatchSchema.parse(body);

    const updateData: Prisma.ProfissionalUpdateInput = {};
    if (parsedData.nome !== undefined) updateData.nome = parsedData.nome;
    if (parsedData.especialidade !== undefined) updateData.especialidade = parsedData.especialidade;
    if (parsedData.NumClasse !== undefined) updateData.NumClasse = parsedData.NumClasse;
   
    const profissionalAtualizado = await db.profissional.update({
      where: { id: profissionalId },
      data: updateData,
      include: { 
        unidades: true,
      },
    });

    return NextResponse.json(profissionalAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    if (error instanceof z.ZodError) {
         return NextResponse.json({ error: "Dados inválidos para atualização", details: error.errors }, { status: 400 });
    }
     if (error instanceof Error && error.message.includes("Record to update not found")) {
         return NextResponse.json({ error: "Profissional não encontrado para atualização" }, { status: 404 });
     }
    return NextResponse.json(
      { error: "Falha ao atualizar o cadastro do profissional" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { profissionalId: string } },
) {
  try {
    const { profissionalId } = params;

    await db.profissional.delete({
      where: { id: profissionalId },
    });

    return NextResponse.json(
      { message: "Profissional deletado com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao deletar profissional:", error);
     if (error instanceof Error && error.message.includes("Record to delete not found")) {
         return NextResponse.json({ error: "Profissional não encontrado para exclusão" }, { status: 404 });
     }
     if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
          return NextResponse.json({ error: "Não é possível excluir o profissional devido a dados vinculados (consultas, exames, etc.). Remova os dados vinculados primeiro." }, { status: 409 });
     }
    return NextResponse.json(
      { error: "Erro interno ao deletar profissional" },
      { status: 500 },
    );
  }
}
