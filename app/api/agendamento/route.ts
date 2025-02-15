import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const agendamentos = await db.consultas.findMany({
      where: { userId: session.user.id },
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
