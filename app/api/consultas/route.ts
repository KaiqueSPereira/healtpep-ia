import { authOptions } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { encrypt, decrypt, encryptString, safeDecrypt } from "@/app/_lib/crypto";

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

    // Removido o bloco que criava a anotação separada para queixas

    return NextResponse.json(novaConsulta, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar consulta:", error);
    return NextResponse.json(
      { error: "Erro ao criar consulta" },
      { status: 500 },
    );
  }
}


// Exemplo de como buscar uma consulta específica e descriptografar (GET_BY_ID)
export async function GET_BY_ID(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const consultaId = searchParams.get("id");

        if (!consultaId) {
            return NextResponse.json({ error: "ID da consulta obrigatório" }, { status: 400 });
        }

        const consulta = await db.consultas.findUnique({
            where: { id: consultaId },
            include: {
                usuario: { select: { name: true, email: true } },
                profissional: { select: { id: true, nome: true, especialidade: true } },
                unidade: { select: { id: true, nome: true } },
                Anotacoes: true, 
                Tratamento: true,
            },
        });

        if (!consulta) {
            return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
        }

        const decryptedConsulta = {
            ...consulta,
            motivo: consulta.motivo ? decrypt(Buffer.from(consulta.motivo, 'hex')).toString() : null,
             // Acessando a relação usando 'Anotaçoes' (com 'ç') no objeto retornado
             Anotacoes: consulta.Anotacoes.map((anotacao: { anotacao: string, id: string, consultaId: string, createdAt: Date, updatedAt: Date }) => ({
                ...anotacao,
                anotacao: decrypt(Buffer.from(anotacao.anotacao, 'hex')).toString(),
            })),
            tipodeexame: consulta.tipodeexame ? decrypt(Buffer.from(consulta.tipodeexame, 'hex')).toString() : null,
        };

        return NextResponse.json(decryptedConsulta);
    } catch (error) {
        console.error("Erro ao buscar consulta por ID:", error);
        return NextResponse.json({ error: "Erro ao buscar consulta" }, { status: 500 });
    }
}


// Exemplo de como adicionar uma nova anotação a uma consulta existente (POST_ANOTACAO)
export async function POST_ANOTACAO(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: "Usuário não autenticado" },
            { status: 401 },
          );
        }

        const body = await req.json();
        const { consultaId, anotacao } = body;

        if (!consultaId || !anotacao) {
            return NextResponse.json({ error: "ID da consulta e anotação são obrigatórios" }, { status: 400 });
        }

        const encryptedAnotacao = encrypt(Buffer.from(anotacao)).toString("hex");

        // Usando 'db.anotaçoes' (camelCase) para acessar o modelo Anotaçoes
        const novaAnotacao = await db.anotacoes.create({
            data: {
                consultaId: consultaId,
                anotacao: encryptedAnotacao,
            },
        });

        return NextResponse.json(novaAnotacao, { status: 201 });
    } catch (error) {
        console.error("Erro ao adicionar anotação:", error);
        return NextResponse.json({ error: "Erro ao adicionar anotação" }, { status : 500 });
    }
}

// Exemplo de como adicionar um tratamento a uma consulta existente (POST_TRATAMENTO)
export async function POST_TRATAMENTO(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: "Usuário não autenticado" },
            { status: 401 },
          );
        }

        const body = await req.json();
        const { consultaId, tratamentoId } = body;

        if (!consultaId || !tratamentoId) {
            return NextResponse.json({ error: "ID da consulta e ID do tratamento são obrigatórios" }, { status: 400 });
        }

        await db.consultas.update({
            where: { id: consultaId },
            data: {
                Tratamento: {
                    connect: { id: tratamentoId },
                },
            },
        });

        return NextResponse.json({ message: "Tratamento associado com sucesso" });
    } catch (error) {
        console.error("Erro ao associar tratamento:", error);
        return NextResponse.json({ error: "Erro ao associar tratamento" }, { status: 500 });
    }
}

// ... (código para DELETE e PUT se existirem)
