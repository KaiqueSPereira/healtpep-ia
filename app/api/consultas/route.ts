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

// 📌 GET - Buscar todas as consultas
export async function GET() {
  try {
    const consultas = await db.consultas.findMany({
      include: {
        usuario: true,
        profissional: true,
        unidade: true,
      },
    });
    return NextResponse.json(consultas);
  } catch {
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
        data: new Date(parsedData.data),
        queixas: parsedData.queixas,
        tratamento: parsedData.tratamento,
        tipodeexame: parsedData.tipodeexame,
        tipo: parsedData.tipo, // ⚡ Correção do enum
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
