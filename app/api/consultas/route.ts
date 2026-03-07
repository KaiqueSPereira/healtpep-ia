import { NextResponse, NextRequest } from "next/server";
import { fetchConsultas, fetchProfissionais, fetchTipos } from "@/app/lib/data";
import { db } from "@/app/_lib/prisma";
import { authOptions } from "@/app/_lib/auth";
import { getServerSession } from "next-auth";
import { decryptString, safeDecrypt, encryptString } from "@/app/_lib/crypto";
import { Consultas, Anotacoes, Profissional, UnidadeDeSaude, Prisma } from '@prisma/client';
import { logAction } from "@/app/_lib/logger";


async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

type ConsultaParaDesencriptar = Consultas & {
    Anotacoes?: Anotacoes[];
    profissional?: Profissional | null;
    unidade?: UnidadeDeSaude | null;
};

const decryptConsulta = (consulta: ConsultaParaDesencriptar) => {
    const { Anotacoes: anotacoes, ...rest } = consulta;
    return {
        ...rest,
        motivo: rest.motivo ? safeDecrypt(rest.motivo) : null,
        tipodeexame: rest.tipodeexame ? safeDecrypt(rest.tipodeexame) : null,
        Anotacoes: anotacoes?.map(a => ({ ...a, anotacao: decryptString(a.anotacao) })) || [],
    };
};

export async function GET(request: NextRequest) {
    let userId: string | undefined;
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;
        const { searchParams } = new URL(request.url);
        const getData = searchParams.get("get");

        if (getData === "profissionais") {
            const profissionais = await fetchProfissionais();
            return NextResponse.json(profissionais);
        }

        if (getData === "tipos") {
            const tipos = await fetchTipos();
            return NextResponse.json(tipos);
        }

        if (getData === "dashboard") {
            const now = new Date();
            const [futuros, passados] = await db.$transaction([
                db.consultas.findMany({ where: { userId, data: { gte: now } }, orderBy: { data: 'asc' }, include: { profissional: true, unidade: true } }),
                db.consultas.findMany({ where: { userId, data: { lt: now } }, orderBy: { data: 'desc' }, take: 5, include: { profissional: true, unidade: true } }),
            ]);
            return NextResponse.json({
                futuros: futuros.map(c => decryptConsulta(c as ConsultaParaDesencriptar)),
                passados: passados.map(c => decryptConsulta(c as ConsultaParaDesencriptar)),
            });
        }

        const consultaData = await fetchConsultas({
            search: searchParams.get("search") || undefined,
            tipo: searchParams.get("tipo") || undefined,
            profissionalId: searchParams.get("profissionalId") || undefined,
            limit: parseInt(searchParams.get("limit") || "8"),
            cursor: searchParams.get("cursor") || undefined,
        });

        return NextResponse.json(consultaData);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId,
            action: "get_consultas_error",
            level: "error",
            message: "Erro na rota da API de consultas (GET)",
            details: { error: errorMessage },
            component: "consultas-api",
        });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
    }
}

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    userId = session.user.id;

    const body = await request.json();
    const { tipo, data, unidadeId, profissionalId, condicaoSaudeId, queixas, consultaOrigemId } = body;

    if (!tipo || !data) {
      return NextResponse.json({ error: "Tipo e data são obrigatórios." }, { status: 400 });
    }

    // CORREÇÃO: Utilizando os nomes de RELAÇÃO definidos no schema.prisma
    const dataToSave: Prisma.ConsultasCreateInput = {
        // CORREÇÃO 1: O nome da relação para User é 'usuario'
        usuario: { connect: { id: userId } },
        tipo,
        data: new Date(data),
        // CORREÇÃO 3: O campo 'motivo' é obrigatório (String), não pode ser nulo.
        motivo: queixas ? encryptString(queixas) : encryptString(""),
    };

    // Conexões para relações opcionais (1-para-muitos)
    if (unidadeId) dataToSave.unidade = { connect: { id: unidadeId } };
    if (profissionalId) dataToSave.profissional = { connect: { id: profissionalId } };
    if (consultaOrigemId) dataToSave.consultaOrigem = { connect: { id: consultaOrigemId } };

    // CORREÇÃO 2: O nome da relação para CondicaoSaude é 'condicoes' (muitos-para-muitos)
    if (condicaoSaudeId) {
        dataToSave.condicoes = { 
            connect: { id: condicaoSaudeId } 
        };
    }

    const novaConsulta = await db.consultas.create({ data: dataToSave });
    
    await logAction({ 
        userId, 
        action: 'create_consulta', 
        level: 'info',
        message: `Consulta do tipo '${novaConsulta.tipo}' criada com sucesso.`,
        details: { consultaId: novaConsulta.id },
        component: "consultas-api",
    });

    return NextResponse.json(novaConsulta, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar consulta:", error); // Log detalhado do erro no servidor
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
    await logAction({ 
        userId, 
        action: 'create_consulta_error', 
        level: 'error',
        message: "Erro ao criar consulta na API.",
        details: { error: errorMessage },
        component: "consultas-api",
    });
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `Erro no banco de dados. Código: ${error.code}` }, { status: 500 });
    } 
    
    return NextResponse.json({ error: "Erro interno do servidor ao criar consulta." }, { status: 500 });
  }
}
