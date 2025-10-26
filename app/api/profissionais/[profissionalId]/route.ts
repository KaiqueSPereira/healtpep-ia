// app/api/profissional/[profissionalId]/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { ApiRouteHandler } from "../../types"; // Certifique-se que esta importação está correta
import { z } from "zod"; // Importar Zod para validação no PATCH
import { Prisma } from "@prisma/client";
import { decryptString } from "@/app/_lib/crypto";

type ProfissionalParams = {
  profissionalId: string;
};

// Schema para validação parcial dos dados no PATCH
const profissionalPatchSchema = z.object({
  nome: z.string().min(1, "O nome e obrigatorio.").optional(), // Tornar campos opcionais para atualização parcial
  especialidade: z.string().min(1, "A especialidade e obrigatoria.").optional(),
  NumClasse: z.string().min(1, "O numero de classe e obrigatorio.").optional(),
  // A atualização de unidades será feita pelos novos endpoints aninhados
  // unidadeId: z.string().uuid("ID da unidade invalido.").optional(), // Remover unidadeId daqui
}).strict().partial(); // Permitir apenas campos definidos e torná-los todos opcionais

// Método GET (Buscar um profissional específico por ID)
export const GET: ApiRouteHandler<ProfissionalParams> = async (
  _request,
  { params },
) => {
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
    const profissionalComExamesDescriptografados = {
      ...profissional,
      exames: profissional.exames?.map(exame => ({
          ...exame,
          anotacao: exame.anotacao ? decryptString(exame.anotacao) : null,
          nome: exame.nome ? decryptString(exame.nome) : null,
      }))
  };

  return NextResponse.json(profissionalComExamesDescriptografados);
} catch (error) {
  console.error("Erro ao buscar profissional:", error);
  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 },
  );
}
};

// Método PATCH (Atualizar os dados principais de um profissional por ID)
export const PATCH: ApiRouteHandler<ProfissionalParams> = async (
  request,
  { params },
) => {
  try {
    const { profissionalId } = params;
    const body = await request.json();

    // Validação parcial dos dados com Zod
    const parsedData = profissionalPatchSchema.parse(body);

    // Construir o objeto de atualização apenas com os campos presentes no body
    const updateData: Prisma.ProfissionalUpdateInput = {}; // Use o tipo gerado pelo Prisma
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

    // Retornar apenas os dados atualizados do profissional (e unidades se incluídas)
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
};

// Método DELETE (Excluir um profissional específico por ID)
export const DELETE: ApiRouteHandler<ProfissionalParams> = async (
  _request,
  { params },
) => {
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
     // Lidar com erros de chave estrangeira se houver (ex: não pode deletar profissional se tiver consultas/exames vinculados e não tiver CASCADE)
     if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
          return NextResponse.json({ error: "Não é possível excluir o profissional devido a dados vinculados (consultas, exames, etc.). Remova os dados vinculados primeiro." }, { status: 409 });
     }
    return NextResponse.json(
      { error: "Erro interno ao deletar profissional" },
      { status: 500 },
    );
  }
};
