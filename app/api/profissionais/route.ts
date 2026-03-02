
import { db } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/app/_lib/auth";
import { Prisma } from "@prisma/client";
import { getPermissionsForUser } from "@/app/_lib/auth/permission-checker";
import { encryptString, decryptString } from "@/app/_lib/crypto";
import { logAction } from "@/app/_lib/logger";

async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

const profissionalCreateSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório."),
  especialidade: z.string().min(1, "A especialidade é obrigatória."),
  NumClasse: z.string().min(1, "O número de classe é obrigatório."),
  unidadeIds: z.array(z.string().uuid("ID da unidade inválido.")).optional(),
});

export async function GET(request: Request) {
    let userId: string | undefined;
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;
        const { searchParams } = new URL(request.url);
        const unidadeId = searchParams.get('unidadeId');

        const whereCondition: Prisma.ProfissionalWhereInput = { userId };
        if (unidadeId) {
            whereCondition.unidades = { some: { id: unidadeId } };
        }

        const profissionais = await db.profissional.findMany({
            where: whereCondition,
            include: { unidades: true },
            orderBy: { nome: 'asc' },
        });

        const decryptedProfissionais = profissionais.map(p => ({
            ...p,
            nome: decryptString(p.nome),
            especialidade: decryptString(p.especialidade),
            NumClasse: decryptString(p.NumClasse),
        }));

        return NextResponse.json(decryptedProfissionais);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        if (errorMessage !== "Não autorizado") {
            await logAction({ userId, action: "get_profissionais_error", level: "error", message: "Erro ao buscar profissionais", details: errorMessage, component: "profissionais-api" });
        }
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao buscar profissionais: ${errorMessage}` }, { status });
    }
}

export async function POST(request: Request) {
    let userId: string | undefined;
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        const permissions = await getPermissionsForUser(userId);
        if (await permissions.hasReachedLimit('profissionais')) {
            return NextResponse.json({ error: "Você atingiu o limite de profissionais para o seu plano." }, { status: 403 });
        }

        const body = await request.json();
        const parsedData = profissionalCreateSchema.parse(body);

        const encryptedNumClasse = encryptString(parsedData.NumClasse);
        const existingProfissional = await db.profissional.findFirst({
            where: { NumClasse: encryptedNumClasse, userId: userId },
        });

        if (existingProfissional) {
            return NextResponse.json({ error: "Você já cadastrou um profissional com este número de classe." }, { status: 409 });
        }

        const novoProfissional = await db.profissional.create({
            data: {
                userId: userId,
                nome: encryptString(parsedData.nome),
                especialidade: encryptString(parsedData.especialidade),
                NumClasse: encryptedNumClasse,
                unidades: { connect: parsedData.unidadeIds?.map(id => ({ id })) || [] },
            },
            include: { unidades: true },
        });

        await logAction({ userId, action: "create_profissional", level: "info", message: `Profissional '${novoProfissional.id}' criado`, component: "profissionais-api" });
        return NextResponse.json(novoProfissional, { status: 201 });

    } catch (error: unknown) {
        let errorMessage = "Ocorreu um erro desconhecido";
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
        }
        if (error instanceof Error) errorMessage = error.message;
        
        await logAction({ userId, action: "create_profissional_error", level: "error", message: "Erro ao criar profissional", details: errorMessage, component: "profissionais-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Falha ao cadastrar o profissional: ${errorMessage}` }, { status });
    }
}
