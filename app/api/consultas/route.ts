import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { Consultatype } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// 📌 GET - Buscar consultas ou tipos de consulta
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔍 Se a query string "tipo=true" estiver presente, retorna os tipos de consulta (ENUM)
    if (searchParams.get("tipo") === "true") {
      const consultaTipos: { tipo: string }[] = await db.$queryRaw`
        SELECT e.enumlabel AS tipo
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'Consultatype';
      `;
      return NextResponse.json(consultaTipos.map((row) => row.tipo));
    }

    // 📌 Paginação das consultas
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const consultas = await db.consultas.findMany({
      include: {
        usuario: { select: { name: true, email: true } }, // Ajustado para o nome correto no Prisma
        profissional: { select: { nome: true, especialidade: true } },
        unidade: { select: { nome: true } },
      },
      orderBy: { data: "asc" },
      take: limit,
      skip,
    });

    return NextResponse.json({ consultas, page, limit });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar os dados" },
      { status: 500 },
    );
  }
}

// 📌 POST - Criar uma nova consulta
export async function POST(req: { json: () => Promise<{ data: string; tipo: Consultatype; profissionalId?: string; unidadeId?: string; tratamentoId?: string; queixas?: string; tipoexame?: string; }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { data, tipo, profissionalId, unidadeId, tratamentoId, queixas, tipoexame } = body;

    if (!data || !tipo) {
      return NextResponse.json(
        { error: "Data e tipo são obrigatórios" },
        { status: 400 },
      );
    }

    // 📌 Validação específica para cada tipo de consulta
    if (tipo === "Emergencia" && (!queixas || !unidadeId)) {
      return NextResponse.json(
        { error: "Emergência requer queixas e unidade." },
        { status: 400 },
      );
    }

    if (
      ["Rotina", "Tratamento", "Retorno"].includes(tipo) &&
      (!tratamentoId || !profissionalId || !unidadeId || !queixas)
    ) {
      return NextResponse.json(
        { error: "Consultas requerem tratamento, profissional e unidade." },
        { status: 400 },
      );
    }

    if (tipo === "Exame" && (!profissionalId || !unidadeId || !tipoexame)) {
      return NextResponse.json(
        { error: "Exames requerem tipo de exame, profissional e unidade." },
        { status: 400 },
      );
    }

    const novaConsulta = await db.consultas.create({
      data: {
        userId: session.user.id,
        data: new Date(data),
        tipo,
        profissionalId: profissionalId || null,
        unidadeId: unidadeId || null,
        tratamento: tratamentoId || null,
        queixas: queixas || null,
        tipodeexame: tipoexame || null
      },
    });

    return NextResponse.json(novaConsulta, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao criar consulta" },
      { status: 500 },
    );
  }
}