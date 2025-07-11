import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { encryptString, safeDecrypt } from "@/app/_lib/crypto";

// 📌 GET - Buscar consultas ou tipos de consulta
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔍 Se a query string "tipo=true" estiver presente, retorna os tipos de consulta (ENUM.)
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
        usuario: { select: { name: true, email: true } },
        profissional: { select: { id: true, nome: true, especialidade: true } },
        unidade: { select: { id: true, nome: true } },
        Anotacoes: true,
        Tratamento: true,
      },
      orderBy: { data: "asc" },
      take: limit,
      skip: skip,
    });

    
    const decryptedConsultas = consultas.map(consulta => {
      const decryptedMotivo = consulta.motivo ? safeDecrypt(consulta.motivo) : null;

      const decryptedAnotacoes = consulta.Anotacoes.map((anotacao: { anotacao: string, id: string, consultaId: string, createdAt: Date, updatedAt: Date }) => ({
            ...anotacao,
            anotacao: safeDecrypt(anotacao.anotacao),
        }));

        const decryptedTipoExame = consulta.tipodeexame ? safeDecrypt(consulta.tipodeexame) : null;

      return {
        ...consulta,
        motivo: decryptedMotivo,
        Anotacoes: decryptedAnotacoes, // Note: Mantendo 'Anotacoes' (sem 'ç') para consistência
        tipodeexame: decryptedTipoExame,
      };
    });

    return NextResponse.json({ consultas: decryptedConsultas, page, limit });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const {
      data,
      tipo,
      profissionalId,
      unidadeId,
      tratamentoId,
      queixas,
      tipoexame,
    } = body;

    // Determinar o motivo para criptografar (queixas ou tipoexame)
    const motivoParaCriptografar = tipo === "Exame" ? tipoexame : queixas;

    if (!data || !tipo || !motivoParaCriptografar) {
      return NextResponse.json(
        { error: "Data, tipo e motivo (queixas ou tipo de exame) são obrigatórios" },
        { status: 400 },
      );
    }

    const encryptedMotivo = encryptString(motivoParaCriptografar);

    const encryptedTipoExame = tipo === "Exame" && tipoexame ? encryptString(tipoexame) : null;


    const novaConsulta = await db.consultas.create({
      data: {
        userId: session.user.id,
        data: new Date(data),
        tipo,
        profissionalId: profissionalId || null,
        unidadeId: unidadeId || null,
        motivo: encryptedMotivo, // Inclui queixas ou tipoexame criptografado aqui
        tipodeexame: encryptedTipoExame, // Inclui tipoexame criptografado (se for exame)
 Tratamento: tratamentoId ? { connect: { id: tratamentoId } } : undefined,
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
