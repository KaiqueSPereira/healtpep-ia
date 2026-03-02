
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { safeDecrypt, safeEncrypt, encryptString, encrypt as encryptBuffer } from "@/app/_lib/crypto";
import { Prisma } from "@prisma/client";
import { Buffer } from "buffer";
import { logAction } from "@/app/_lib/logger";
import { getBiomarkerRule } from "@/app/_lib/biomarkerUtils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";

const getIdFromUrl = (url: string) => {
    const parts = url.split('/');
    const lastSegment = parts[parts.length - 1];
    return lastSegment.split('?')[0];
};

async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

const exameWithDetailsArgs = { include: { resultados: true, unidades: { include: { endereco: true } }, profissional: true, profissionalExecutante: true, consulta: { include: { profissional: true, unidade: true } }, anexos: true, _count: { select: { anexos: true } } } };

type ExameWithDetails = Prisma.ExameGetPayload<typeof exameWithDetailsArgs>;

export async function GET(req: NextRequest) {
    let userId: string | undefined;
    const id = getIdFromUrl(req.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;
        const { searchParams } = req.nextUrl;
        const includeAnexos = searchParams.get('includeAnexos') === 'true';

        if (!id) return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });

        const exameFromDb = await db.exame.findUnique({
            where: { id, userId },
            include: { resultados: true, unidades: { include: { endereco: true } }, profissional: true, profissionalExecutante: true, consulta: { include: { profissional: true, unidade: true } }, condicaoSaude: true, anexos: includeAnexos ? { select: { id: true, nomeArquivo: true, createdAt: true, mimetype: true } } : undefined, _count: includeAnexos ? undefined : { select: { anexos: true } } },
        });

        if (!exameFromDb) return NextResponse.json({ error: "Exame não encontrado." }, { status: 404 });

        const exame = exameFromDb as ExameWithDetails;
        const decryptedConsulta = exame.consulta ? { ...exame.consulta, motivo: safeDecrypt(exame.consulta.motivo), profissional: exame.consulta.profissional && exame.consulta.profissional.nome ? { ...exame.consulta.profissional, nome: safeDecrypt(exame.consulta.profissional.nome) } : exame.consulta.profissional, unidade: exame.consulta.unidade && exame.consulta.unidade.nome ? { ...exame.consulta.unidade, nome: safeDecrypt(exame.consulta.unidade.nome) } : exame.consulta.unidade } : null;

        const finalExameObject = {
            ...exame,
            nome: safeDecrypt(exame.nome),
            tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
            anotacao: exame.anotacao ? safeDecrypt(exame.anotacao) : null,
            analiseIA: exame.analiseIA ? safeDecrypt(exame.analiseIA) : null,
            profissional: exame.profissional && exame.profissional.nome ? { ...exame.profissional, nome: safeDecrypt(exame.profissional.nome) } : exame.profissional,
            profissionalExecutante: exame.profissionalExecutante && exame.profissionalExecutante.nome ? { ...exame.profissionalExecutante, nome: safeDecrypt(exame.profissionalExecutante.nome) } : exame.profissionalExecutante,
            unidades: exame.unidades && exame.unidades.nome ? { ...exame.unidades, nome: safeDecrypt(exame.unidades.nome) } : exame.unidades,
            resultados: exame.resultados.map(r => ({
                ...r,
                nome: safeDecrypt(r.nome),
                valor: safeDecrypt(r.valor),
                unidade: r.unidade ? safeDecrypt(r.unidade) : null,
                referencia: r.referencia ? safeDecrypt(r.referencia) : null
            })),
            consulta: decryptedConsulta,
            anexos: includeAnexos && exame.anexos ? exame.anexos.map(anexo => ({ ...anexo, nomeArquivo: safeDecrypt(anexo.nomeArquivo) })) : []
        };

        return NextResponse.json({ exame: finalExameObject });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        if (errorMessage !== "Não autorizado") {
            await logAction({ userId, action: "get_exame_error", level: "error", message: `Erro ao buscar exame '${id}'`, details: errorMessage, component: "exames-api/[id]" });
        }
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status });
    }
}

export async function PUT(request: NextRequest) {
    let userId: string | undefined;
    const id = getIdFromUrl(request.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;
        if (!id) return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });

        const formData = await request.formData();
        const nome = formData.get("nome") as string;
        if (!nome) return NextResponse.json({ error: "O campo 'nome' é obrigatório." }, { status: 400 });
        
        const updatedExame = await db.$transaction(async (tx) => {
            const existingExame = await tx.exame.findFirst({ where: { id, userId } });
            if (!existingExame) throw new Error("Exame não encontrado ou acesso não permitido.");

            const tipo = formData.get("tipo") as string | null;
            const anotacao = formData.get("anotacao") as string | null;

            const updateData: Prisma.ExameUpdateInput = {
                nome: safeEncrypt(nome),
                tipo: tipo ? safeEncrypt(tipo) : null,
                laudoFinalizado: (formData.get("laudoFinalizado") as string) === 'true',
                anotacao: anotacao ? safeEncrypt(anotacao) : null,
                dataExame: formData.get("dataExame") ? new Date(formData.get("dataExame") as string) : undefined,
            };
            
            const resultados: {nome: string, valor: string, unidade?: string, referencia?: string}[] = JSON.parse(formData.get("resultados") as string || '[]' );
            await tx.resultadoExame.deleteMany({ where: { exameId: id } });
            if (resultados.length > 0) {
                const standardizedResultados = await Promise.all(resultados.map(async r => ({ ...r, nome: (await getBiomarkerRule(r.nome)).standardizedName })));
                await tx.resultadoExame.createMany({
                    data: standardizedResultados.map(r => ({
                        exameId: id,
                        nome: safeEncrypt(r.nome),
                        valor: safeEncrypt(r.valor),
                        unidade: r.unidade ? safeEncrypt(r.unidade) : null,
                        referencia: r.referencia ? safeEncrypt(r.referencia) : null
                    }))
                });
            }
            
            const newFiles = formData.getAll("files") as File[];
            for (const file of newFiles) {
                if (file.size > 0) {
                    const fileBuffer = await file.arrayBuffer();
                    await tx.anexoExame.create({ data: { exameId: id, nomeArquivo: encryptString(file.name), mimetype: file.type, arquivo: new Uint8Array(encryptBuffer(Buffer.from(fileBuffer))) } });
                }
            }

            await tx.exame.update({ where: { id }, data: updateData });
            return tx.exame.findUnique({ where: { id } });
        }, { timeout: 20000 });

        await logAction({ userId, action: "update_exame", level: "info", message: `Exame '${id}' atualizado com sucesso`, component: "exames-api/[id]" });
        return NextResponse.json({ message: "Exame atualizado com sucesso!", exame: updatedExame });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "update_exame_error", level: "error", message: `Erro ao atualizar exame '${id}'`, details: errorMessage, component: "exames-api/[id]" });
        const status = errorMessage.includes("acesso não permitido") ? 403 : 500;
        return NextResponse.json({ error: `Não foi possível atualizar o exame: ${errorMessage}` }, { status });
    }
}

export async function PATCH(request: NextRequest) {
    let userId: string | undefined;
    const id = getIdFromUrl(request.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;
        if (!id) return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });

        const body = await request.json();
        const { consultaId, condicaoSaudeId } = body;
        
        const existingExame = await db.exame.findFirst({ where: { id, userId } });
        if (!existingExame) return NextResponse.json({ error: "Exame não encontrado ou acesso não permitido." }, { status: 404 });
        
        const updateData: Prisma.ExameUpdateInput = {};
        if (consultaId !== undefined) updateData.consulta = consultaId ? { connect: { id: consultaId } } : { disconnect: true };
        if (condicaoSaudeId !== undefined) updateData.condicaoSaude = condicaoSaudeId ? { connect: { id: condicaoSaudeId } } : { disconnect: true };

        if (Object.keys(updateData).length === 0) return NextResponse.json({ error: "Nenhum dado válido para atualização fornecido." }, { status: 400 });

        const updatedExame = await db.exame.update({ where: { id }, data: updateData });

        await logAction({ userId, action: "patch_exame", level: "info", message: `Vínculo do exame '${id}' atualizado`, component: "exames-api/[id]" });
        return NextResponse.json({ message: "Vínculo do exame atualizado com sucesso!", exame: updatedExame });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "patch_exame_error", level: "error", message: `Erro ao atualizar vínculo do exame '${id}'`, details: errorMessage, component: "exames-api/[id]" });
        const status = errorMessage.includes("acesso não permitido") ? 403 : 500;
        return NextResponse.json({ error: `Não foi possível atualizar o vínculo: ${errorMessage}` }, { status });
    }
}

export async function DELETE(req: NextRequest) {
    let userId: string | undefined;
    const id = getIdFromUrl(req.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;
        if (!id) return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });

        const existingExame = await db.exame.findFirst({ where: { id, userId } });
        if (!existingExame) return NextResponse.json({ error: "Exame não encontrado ou acesso não permitido." }, { status: 404 });

        await db.exame.delete({ where: { id } });

        await logAction({ userId, action: "delete_exame", level: "info", message: `Exame '${id}' deletado com sucesso`, component: "exames-api/[id]" });
        return NextResponse.json({ message: "Exame deletado com sucesso." }, { status: 200 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "delete_exame_error", level: "error", message: `Erro ao deletar exame '${id}'`, details: errorMessage, component: "exames-api/[id]" });
        let status = 500;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') status = 404;
        else if (errorMessage.includes("acesso não permitido")) status = 403;

        return NextResponse.json({ error: `Não foi possível deletar o exame: ${errorMessage}` }, { status });
    }
}
