// app/api/profissional/[profissionalId]/unidades/[unidadeId]/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

// Endpoint para DESASSOCIAR uma unidade de um profissional
export async function DELETE(
  req: Request,
  context: { params: { profissionalId: string; unidadeId: string } },
) {
  try {
    const { profissionalId, unidadeId } = context.params;

    if (!profissionalId || !unidadeId) {
      return NextResponse.json({ error: "IDs do profissional e da unidade são obrigatórios" }, { status: 400 });
    }

    // Verificar se a associação existe antes de tentar remover (opcional, mas pode dar um erro 404 mais claro)
    const existingAssociation = await db.profissional.findFirst({
        where: {
            id: profissionalId,
            unidades: {
                some: {
                    id: unidadeId,
                },
            },
        },
    });

    if (!existingAssociation) {
        return NextResponse.json({ error: "Associação profissional-unidade não encontrada." }, { status: 404 });
    }


    // Remover o link (associação) usando 'disconnect'
    const profissionalSemUnidade = await db.profissional.update({
      where: { id: profissionalId },
      data: {
        unidades: {
          disconnect: { id: unidadeId }, // Desconecta o profissional da unidade pelo ID
        },
      },
       include: { // Incluir as unidades atualizadas na resposta
         unidades: true, // Inclui o relacionamento 'unidades'
       }
    });

    // Retornar APENAS a lista atualizada de unidades do profissional
    return NextResponse.json(profissionalSemUnidade.unidades, { status: 200 });

  } catch (error) {
    console.error("Erro ao desassociar unidade do profissional:", error);
     // Lidar com erros específicos do Prisma (ex: profissional não encontrado)
     if (error instanceof Error && error.message.includes("Record to update not found")) {
         return NextResponse.json({ error: "Profissional não encontrado para desassociação" }, { status: 404 });
     }
    return NextResponse.json(
      { error: "Falha ao desassociar unidade do profissional" },
      { status: 500 },
    );
  }
}
