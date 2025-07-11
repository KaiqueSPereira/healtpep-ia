// app/api/profissional/[profissionalId]/unidades/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema para validação do body no POST (apenas unidadeId)
const associateUnidadeSchema = z.object({
    unidadeId: z.string().uuid("ID da unidade invalido."),
});

// Endpoint para ASSOCIAR uma unidade a um profissional
export async function POST(
  req: Request,
  context: { params: { profissionalId: string } },
) {
  try {
    const { profissionalId } = context.params;
    const body = await req.json();

    const parsedData = associateUnidadeSchema.parse(body);
    const { unidadeId } = parsedData;

    // Verificar se a associação já existe (opcional, dependendo do seu schema/Prisma)
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

    if (existingAssociation) {
        return NextResponse.json({ error: "Esta unidade já está associada a este profissional." }, { status: 409 });
    }


    // Criar o link (associação) usando 'connect'
    const profissionalComUnidade = await db.profissional.update({
      where: { id: profissionalId },
      data: {
        unidades: {
          connect: { id: unidadeId }, // Conecta o profissional à unidade pelo ID
        },
      },
       include: { // Incluir as unidades atualizadas na resposta
         unidades: true, // Inclui o relacionamento 'unidades'
       }
    });

    // Retornar APENAS a lista atualizada de unidades do profissional
    return NextResponse.json(profissionalComUnidade.unidades, { status: 201 });

  } catch (error) {
    console.error("Erro ao associar unidade ao profissional:", error);
     if (error instanceof z.ZodError) {
         return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
     }
     // Lidar com erros específicos do Prisma (ex: profissional ou unidade não encontrados)
    if (error instanceof Error && error.message.includes("Record to update not found")) {
         return NextResponse.json({ error: "Profissional ou Unidade não encontrados" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Falha ao associar unidade ao profissional" },
      { status: 500 },
    );
  }
}

// Opcional: Método GET para listar unidades associadas (se necessário, mas o GET principal já retorna)
/*
export async function GET(
   _req: Request,
   context: { params: { profissionalId: string } },
) {
   // ... lógica para buscar unidades associadas ...
}
*/
