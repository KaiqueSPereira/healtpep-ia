import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

export async function GET() {
  try {
    // Buscar os valores do ENUM no PostgreSQL
    const consultaTipos: { tipo: string }[] = await db.$queryRaw`
      SELECT e.enumlabel AS tipo
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'Consultatype';
    `;

    return NextResponse.json(consultaTipos.map((row) => row.tipo));
  } catch (error) {
    console.error("Erro ao buscar os tipos de consulta:", error);
    return NextResponse.json(
      { error: "Erro ao buscar os tipos de consulta" },
      { status: 500 },
    );
  }
}
