import { db } from "@/app/_lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { encryptString, decryptString } from "@/app/_lib/crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { logAction } from "@/app/_lib/logger";

const anotaocaoCreateSchema = z.object({
  anotacao: z.string().min(1, "O texto da anotação não pode estar vazio."),
});

async function getSessionInfo() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new Error("Não autorizado");
  }
  return { userId: session.user.id };
}

const safeDecrypt = (value: string | null | undefined, fieldName: string, id: string) => {
  if (typeof value !== 'string' || !value) {
    return value;
  }
  try {
    return decryptString(value);
  } catch (e) {
    logAction({
        userId: undefined, 
        action: "decryption_fallback",
        level: "warn",
        message: `Falha ao descriptografar campo '${fieldName}' para o ID: ${id}. Usando valor original.`,
        component: "anotacoes-api-get"
    });
    return value; 
  }
};

export async function POST(request: NextRequest, context: { params: Promise<{ consultaId: string }> }) {
    let userId: string | undefined;
    const { consultaId } = await context.params;

    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        const consulta = await db.consultas.findFirst({
            where: {
                id: consultaId,
                userId: userId,
            },
        });

        if (!consulta) {
            return NextResponse.json({ error: "Consulta não encontrada ou não pertence ao usuário." }, { status: 404 });
        }

        const body = await request.json();
        const parsedData = anotaocaoCreateSchema.parse(body);

        const novaAnotacao = await db.anotacoes.create({
            data: {
                consultaId: consultaId,
                anotacao: encryptString(parsedData.anotacao),
            },
        });

        await logAction({
            userId,
            action: "create_anotacao",
            level: "info",
            message: `Anotação criada para a consulta '${consultaId}'`,
            details: { anotacaoId: novaAnotacao.id },
            component: "anotacoes-api",
        });

        return NextResponse.json({
            ...novaAnotacao,
            anotacao: parsedData.anotacao
        }, { status: 201 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId,
            action: "create_anotacao_error",
            level: "error",
            message: `Erro ao criar anotação para a consulta '${consultaId}'`,
            details: { error: errorMessage },
            component: "anotacoes-api",
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
        }
        
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Falha ao criar a anotação: ${errorMessage}` }, { status });
    }
}

export async function GET(request: NextRequest, context: { params: Promise<{ consultaId: string }> }) {
    let userId: string | undefined;
    const { consultaId } = await context.params;

    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        const anotacoes = await db.anotacoes.findMany({
            where: {
                consultaId: consultaId,
                consulta: {
                    userId: userId, 
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (anotacoes.length === 0) {
            const consultaExists = await db.consultas.count({
                where: { id: consultaId, userId: userId }
            });
            if (consultaExists === 0) {
                return NextResponse.json({ error: "Consulta não encontrada ou não pertence ao usuário." }, { status: 404 });
            }
        }

        const decryptedAnotacoes = anotacoes.map(a => ({
            ...a,
            anotacao: safeDecrypt(a.anotacao, 'anotacao', a.id),
        }));

        return NextResponse.json(decryptedAnotacoes);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId,
            action: "get_anotacoes_error",
            level: "error",
            message: `Erro ao buscar anotações para a consulta '${consultaId}'`,
            details: { error: errorMessage },
            component: "anotacoes-api",
        });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao buscar anotações: ${errorMessage}` }, { status });
    }
}
