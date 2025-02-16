import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export async function GET() {
  try {
    const agendamentos = await db.consultas.findMany({
      include: {
        profissional: { select: { nome: true } },
        unidade: { select: { nome: true } },
      },
      orderBy: { data: "asc" },
    });

    return NextResponse.json(agendamentos);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamentos" },
      { status: 500 },
    );
  }
}
