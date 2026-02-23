
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt, safeEncrypt, encryptString, encrypt as encryptBuffer } from "@/app/_lib/crypto";
import { Prisma } from "@prisma/client";
import { Buffer } from "buffer";
import { logErrorToDb } from "@/app/_lib/logger";

const exameWithDetailsArgs = {
    include: {
        resultados: true,
        unidades: { include: { endereco: true } },
        profissional: true,
        profissionalExecutante: true,
        consulta: { include: { profissional: true, unidade: true } },
        anexos: true,
        _count: { select: { anexos: true } },
    },
};

type ExameWithDetails = Prisma.ExameGetPayload<typeof exameWithDetailsArgs>;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const componentName = "API GET /api/exames/[id]";
    const id = params.id;
    const { searchParams } = req.nextUrl;
    const includeAnexos = searchParams.get('includeAnexos') === 'true';

    if (!id) {
        return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });
    }

    try {
        const exameFromDb = await prisma.exame.findUnique({
            where: { id },
            include: {
                resultados: true,
                unidades: { include: { endereco: true } },
                profissional: true,
                profissionalExecutante: true,
                consulta: { include: { profissional: true, unidade: true } },
                anexos: includeAnexos ? {
                    select: {
                        id: true,
                        nomeArquivo: true,
                        createdAt: true,
                        mimetype: true,
                    }
                } : undefined,
                _count: includeAnexos ? undefined : { select: { anexos: true } },
            },
        });

        if (!exameFromDb) {
            return NextResponse.json({ error: "Exame não encontrado." }, { status: 404 });
        }

        const exame = exameFromDb as ExameWithDetails;

        const decryptedConsulta = exame.consulta ? {
            ...exame.consulta,
            motivo: exame.consulta.motivo ? safeDecrypt(exame.consulta.motivo) : null,
            profissional: exame.consulta.profissional && exame.consulta.profissional.nome
                ? { ...exame.consulta.profissional, nome: safeDecrypt(exame.consulta.profissional.nome) }
                : exame.consulta.profissional,
            unidade: exame.consulta.unidade && exame.consulta.unidade.nome
                ? { ...exame.consulta.unidade, nome: safeDecrypt(exame.consulta.unidade.nome) }
                : exame.consulta.unidade,
        } : null;

        const finalExameObject = {
            ...exame,
            nome: exame.nome ? safeDecrypt(exame.nome) : "Exame",
            tipo: exame.tipo ? safeDecrypt(exame.tipo) : null,
            anotacao: exame.anotacao ? safeDecrypt(exame.anotacao) : null,
            analiseIA: exame.analiseIA ? safeDecrypt(exame.analiseIA) : null,
            profissional: exame.profissional && exame.profissional.nome ? { ...exame.profissional, nome: safeDecrypt(exame.profissional.nome) } : exame.profissional,
            profissionalExecutante: exame.profissionalExecutante && exame.profissionalExecutante.nome ? { ...exame.profissionalExecutante, nome: safeDecrypt(exame.profissionalExecutante.nome) } : exame.profissionalExecutante,
            unidades: exame.unidades && exame.unidades.nome ? { ...exame.unidades, nome: safeDecrypt(exame.unidades.nome) } : exame.unidades,
            resultados: exame.resultados.map(r => ({
                ...r,
                nome: r.nome ? safeDecrypt(r.nome) : null,
                valor: r.valor ? safeDecrypt(r.valor) : null,
                unidade: r.unidade ? safeDecrypt(r.unidade) : null,
                referencia: r.referencia ? safeDecrypt(r.referencia) : null,
            })),
            consulta: decryptedConsulta,
            anexos: includeAnexos && exame.anexos ? exame.anexos.map(anexo => ({ ...anexo, nomeArquivo: safeDecrypt(anexo.nomeArquivo) })) : [],
        };

        return NextResponse.json({ exame: finalExameObject });

    } catch (error) {
        await logErrorToDb(`Erro ao buscar detalhes do exame ${id}`, error instanceof Error ? error.stack || error.message : String(error), componentName);
        return NextResponse.json({ error: "Não foi possível carregar os detalhes do exame. Tente novamente mais tarde." }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const componentName = "API PUT /api/exames/[id]";
    const id = params.id;
    if (!id) {
        return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });
    }

    try {
        const formData = await request.formData();
        const nome = formData.get("nome") as string | null;
        const tipo = formData.get("tipo") as string | null;
        const anotacao = formData.get("anotacao") as string | null;
        const dataExameStr = formData.get("dataExame") as string | null;
        const unidadesId = formData.get("unidadesId") as string | null;
        const profissionalId = formData.get("profissionalId") as string | null;
        const profissionalExecutanteId = formData.get("profissionalExecutanteId") as string | null;
        const condicaoSaudeId = formData.get("condicaoSaudeId") as string | null;
        const consultaId = formData.get("consultaId") as string | null;
        const resultadosStr = formData.get("resultados") as string | null;
        const laudoFinalizadoStr = formData.get("laudoFinalizado") as string | null;
        const newFiles = formData.getAll("files") as File[];

        if (!nome || !tipo) {
            return NextResponse.json({ error: "Os campos 'nome' e 'tipo' são obrigatórios." }, { status: 400 });
        }
        
        const laudoFinalizado = laudoFinalizadoStr === 'true';
        const resultados: {nome: string, valor: string, unidade?: string, referencia?: string}[] = resultadosStr ? JSON.parse(resultadosStr) : [];

        const updatedExame = await prisma.$transaction(async (tx) => {
            const updateData: Prisma.ExameUpdateInput = {
                nome: safeEncrypt(nome),
                tipo: safeEncrypt(tipo),
                laudoFinalizado: laudoFinalizado,
                anotacao: anotacao ? safeEncrypt(anotacao) : null,
                dataExame: dataExameStr ? new Date(dataExameStr) : undefined,
                unidades: unidadesId && unidadesId !== 'null' ? { connect: { id: unidadesId } } : { disconnect: true },
                profissional: profissionalId && profissionalId !== 'null' ? { connect: { id: profissionalId } } : { disconnect: true },
                profissionalExecutante: profissionalExecutanteId && profissionalExecutanteId !== 'null' ? { connect: { id: profissionalExecutanteId } } : { disconnect: true },
                condicaoSaude: condicaoSaudeId && condicaoSaudeId !== 'null' ? { connect: { id: condicaoSaudeId } } : { disconnect: true },
                consulta: consultaId && consultaId !== 'null' ? { connect: { id: consultaId } } : { disconnect: true },
            };

            const exameAtualizado = await tx.exame.update({ where: { id }, data: updateData });

            await tx.resultadoExame.deleteMany({ where: { exameId: id } });
            if (resultados && resultados.length > 0) {
                await tx.resultadoExame.createMany({
                    data: resultados.map((r) => ({
                        exameId: id,
                        nome: safeEncrypt(r.nome),
                        valor: safeEncrypt(r.valor),
                        unidade: r.unidade ? safeEncrypt(r.unidade) : null,
                        referencia: r.referencia ? safeEncrypt(r.referencia) : null,
                    })),
                });
            }

            if (newFiles && newFiles.length > 0) {
                for (const file of newFiles) {
                    if(file.size === 0) continue;
                    const fileBuffer = await file.arrayBuffer();
                    const originalBuffer = Buffer.from(fileBuffer);
                    await tx.anexoExame.create({
                        data: {
                            exameId: id,
                            nomeArquivo: encryptString(file.name),
                            mimetype: file.type,
                            arquivo: new Uint8Array(encryptBuffer(originalBuffer)),
                        },
                    });
                }
            }
            
            return exameAtualizado;
        });

        return NextResponse.json({ message: "Exame atualizado com sucesso!", exame: updatedExame });

    } catch (error) {
        await logErrorToDb(`Erro ao atualizar o exame ${id}`, error instanceof Error ? error.stack || error.message : String(error), componentName);
        return NextResponse.json({ error: "Não foi possível atualizar o exame. Verifique os dados e tente novamente." }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const componentName = "API PATCH /api/exames/[id]";
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { consultaId, condicaoSaudeId } = body;

        const updateData: Prisma.ExameUpdateInput = {};

        if (consultaId !== undefined) {
            if (consultaId) {
                updateData.consulta = { connect: { id: consultaId } };
            } else {
                updateData.consulta = { disconnect: true };
            }
        }

        if (condicaoSaudeId !== undefined) {
            if (condicaoSaudeId) {
                updateData.condicaoSaude = { connect: { id: condicaoSaudeId } };
            } else {
                updateData.condicaoSaude = { disconnect: true };
            }
        }
        
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Nenhum dado válido para atualização foi fornecido." }, { status: 400 });
        }

        const updatedExame = await prisma.exame.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ message: "Vínculo do exame atualizado com sucesso!", exame: updatedExame });

    } catch (error) {
        await logErrorToDb(`Erro ao atualizar vínculo do exame ${id}`, error instanceof Error ? error.stack || error.message : String(error), componentName);
        return NextResponse.json({ error: "Não foi possível atualizar o vínculo do exame." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const componentName = "API DELETE /api/exames/[id]";
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });
    }

    try {
        await prisma.exame.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Exame deletado com sucesso." }, { status: 200 });

    } catch (error) {
        let errorMessage = "Não foi possível deletar o exame. Tente novamente mais tarde.";
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            errorMessage = "Exame não encontrado.";
        }
        
        await logErrorToDb(`Erro ao deletar o exame ${id}`, error instanceof Error ? error.stack || error.message : String(error), componentName);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
