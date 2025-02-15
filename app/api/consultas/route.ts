import { db } from "@/app/_lib/prisma";
import { Consultatype } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod"; // Biblioteca para validação

// 📌 Definição do schema de validação
const consultaSchema = z.object({
  data: z.string().min(1, "A data é obrigatória."),
  queixas: z.string().min(1, "As queixas são obrigatórias."),
  tratamento: z.string().min(1, "O tratamento é obrigatório."),
  tipodeexame: z.string().min(1, "O tipo de exame é obrigatório."),
  tipo: z.enum(["Rotina", "Exame", "Emergencia"], {
    required_error: "O tipo da consulta é obrigatório.",
  }),
  userId: z.string().uuid("ID do usuário inválido."),
  profissionalId: z.string().uuid("ID do profissional inválido."),
  unidadeId: z.string().uuid("ID da unidade inválido.").optional(),
});

// 📌 GET - Buscar Consultas
export async function GET(req: Request) {
  const url = new URL(req.url);
  const consultaId = url.searchParams.get("id");

  try {
    if (consultaId) {
      const consulta = await db.consultas.findUnique({
        where: { id: consultaId },
        include: {
          usuario: true, // Relação com Usuário
          profissional: true, // Relação com Profissional
          unidade: true, // Relação com UnidadeDeSaude
        },
      });

      if (!consulta) {
        return NextResponse.json(
          { error: "Consulta não encontrada" },
          { status: 404 },
        );
      }

      return NextResponse.json(consulta);
    } else {
      const consultas = await db.consultas.findMany({
        include: {
          usuario: true,
          profissional: true,
          unidade: true,
        },
      });
      return NextResponse.json(consultas);
    }
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar consultas" },
      { status: 500 },
    );
  }
}

// 📌 POST - Criar uma nova consulta
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedData = consultaSchema.parse(body);

    const novaConsulta = await db.consultas.create({
      data: {
        data: new Date(parsedData.data), // Converter string para Date
        queixas: parsedData.queixas,
        tratamento: parsedData.tratamento,
        tipodeexame: parsedData.tipodeexame,
        tipo: parsedData.tipo as Consultatype, // Definir enum corretamente
        userId: parsedData.userId,
        profissionalId: parsedData.profissionalId,
        unidadeId: parsedData.unidadeId ?? null, // Caso seja opcional
      },
    });

    return NextResponse.json(novaConsulta);
  } catch (error: unknown) {
    console.error("Erro ao salvar a consulta:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Falha ao salvar a consulta" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Falha ao salvar a consulta" },
      { status: 400 },
    );
  }
}

// 📌 PATCH - Atualizar uma consulta existente
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      data,
      queixas,
      tratamento,
      tipodeexame,
      tipo,
      profissionalId,
      unidadeId,
    } = body;

    // Validar os dados de entrada
    const parsedData = consultaSchema.partial().parse({
      data,
      queixas,
      tratamento,
      tipodeexame,
      tipo,
      profissionalId,
      unidadeId,
    });

    const consultaAtualizada = await db.consultas.update({
      where: { id },
      data: {
        data: parsedData.data ? new Date(parsedData.data) : undefined,
        queixas: parsedData.queixas,
        tratamento: parsedData.tratamento,
        tipodeexame: parsedData.tipodeexame,
        tipo: parsedData.tipo as Consultatype,
        profissional: profissionalId
          ? { connect: { id: profissionalId } }
          : undefined,
        unidade: unidadeId ? { connect: { id: unidadeId } } : undefined,
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
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const consultaId = url.searchParams.get("id");

  if (!consultaId) {
    return NextResponse.json(
      { error: "ID da consulta é necessário" },
      { status: 400 },
    );
  }

  try {
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
