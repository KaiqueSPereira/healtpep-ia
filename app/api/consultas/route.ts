import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// 📌 Validação de dados com Zod
const consultaSchema = z.object({
  data: z.string().min(1, "A data é obrigatória."),
  queixas: z.string().min(1, "As queixas são obrigatórias."),
  tratamento: z.string().min(1, "O tratamento é obrigatório."),
  tipodeexame: z.string().min(1, "O tipo de exame é obrigatório."),
  tipo: z.enum(["Rotina", "Exame", "Emergencia"]),
  userId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  unidadeId: z.string().uuid().optional(),
});

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
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedData = consultaSchema.parse(body);

    const novaConsulta = await db.consultas.create({
      data: {
        data: new Date(parsedData.data),
        queixas: parsedData.queixas,
        tratamento: parsedData.tratamento,
        tipodeexame: parsedData.tipodeexame,
        tipo: parsedData.tipo,
        userId: parsedData.userId,
        profissionalId: parsedData.profissionalId,
        unidadeId: parsedData.unidadeId ?? null,
      },
    });

    return NextResponse.json(novaConsulta);
  } catch (error) {
    console.error("Erro ao salvar a consulta:", error);
    return NextResponse.json(
      { error: "Falha ao salvar a consulta" },
      { status: 400 },
    );
  }
}
