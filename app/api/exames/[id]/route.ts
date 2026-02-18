
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { safeDecrypt, safeEncrypt, encryptString, encrypt as encryptBuffer } from "@/app/_lib/crypto";
import { Prisma, AnexoExame } from "@prisma/client";
import { Buffer } from "buffer";
import { logErrorToDb } from "@/app/_lib/logger";

interface ResultadoInput {
    nome: string;
    valor: string;
    unidade?: string | null;
    referencia?: string | null;
}

// GET /api/exames/[id] - Busca e descriptografa os detalhes de um exame, com opção de incluir anexos.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const componentName = "API GET /api/exames/[id]";
    const id = params.id;
    const { searchParams } = req.nextUrl;
    const includeAnexos = searchParams.get('includeAnexos') === 'true';

    if (!id) {
        return NextResponse.json({ error: "O ID do exame é obrigatório." }, { status: 400 });
    }

    try {
        const includeOptions: Prisma.ExameInclude = {
            resultados: true,
            unidades: { include: { endereco: true } },
            profissional: true,
            consulta: { include: { profissional: true, unidade: true } },
        };

        if (includeAnexos) {
            includeOptions.anexos = true;
        } else {
            includeOptions._count = { select: { anexos: true } };
        }

        const exameFromDb = await prisma.exame.findUnique({
            where: { id },
            include: includeOptions,
        });

        if (!exameFromDb) {
            return NextResponse.json({ error: "Exame não encontrado." }, { status: 404 });
        }
        
        const decryptedExame = {
            ...exameFromDb,
            nome: exameFromDb.nome ? safeDecrypt(exameFromDb.nome) : "Exame",
            anotacao: exameFromDb.anotacao ? safeDecrypt(exameFromDb.anotacao) : null,
            analiseIA: exameFromDb.analiseIA ? safeDecrypt(exameFromDb.analiseIA) : null,
            resultados: exameFromDb.resultados.map(r => ({
                ...r,
                nome: r.nome ? safeDecrypt(r.nome) : null,
                valor: r.valor ? safeDecrypt(r.valor) : null,
                unidade: r.unidade ? safeDecrypt(r.unidade) : null,
                referencia: r.referencia ? safeDecrypt(r.referencia) : null,
            })),
            consulta: exameFromDb.consulta ? {
                ...exameFromDb.consulta,
                motivo: exameFromDb.consulta.motivo ? safeDecrypt(exameFromDb.consulta.motivo) : null
            } : null
        };

        if (includeAnexos && 'anexos' in decryptedExame && Array.isArray(decryptedExame.anexos)) {
            decryptedExame.anexos = decryptedExame.anexos.map((anexo: AnexoExame) => ({
                ...anexo,
                nomeArquivo: safeDecrypt(anexo.nomeArquivo),
            }));
        }

        return NextResponse.json({ exame: decryptedExame });

    } catch (error) {
        await logErrorToDb(`Erro ao buscar detalhes do exame ${id}`, error instanceof Error ? error.stack || error.message : String(error), componentName);
        return NextResponse.json({ error: "Não foi possível carregar os detalhes do exame. Tente novamente mais tarde." }, { status: 500 });
    }
}


// PUT /api/exames/[id] - Atualiza um exame existente usando FormData.
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
        const condicaoSaudeId = formData.get("condicaoSaudeId") as string | null;
        const consultaId = formData.get("consultaId") as string | null;
        const resultadosStr = formData.get("resultados") as string | null;
        const newFiles = formData.getAll("files") as File[];

        if (!nome || !tipo) {
            return NextResponse.json({ error: "Os campos 'nome' e 'tipo' são obrigatórios." }, { status: 400 });
        }

        const resultados: ResultadoInput[] = resultadosStr ? JSON.parse(resultadosStr) : [];

        const updatedExame = await prisma.$transaction(async (tx) => {
            const updateData: Prisma.ExameUpdateInput = {
                nome: safeEncrypt(nome),
                tipo: safeEncrypt(tipo),
                anotacao: anotacao ? safeEncrypt(anotacao) : null,
                dataExame: dataExameStr ? new Date(dataExameStr) : undefined,
                unidades: unidadesId && unidadesId !== 'null' ? { connect: { id: unidadesId } } : { disconnect: true },
                profissional: profissionalId && profissionalId !== 'null' ? { connect: { id: profissionalId } } : { disconnect: true },
                condicaoSaude: condicaoSaudeId && condicaoSaudeId !== 'null' ? { connect: { id: condicaoSaudeId } } : { disconnect: true },
                consulta: consultaId && consultaId !== 'null' ? { connect: { id: consultaId } } : { disconnect: true },
            };

            const exameAtualizado = await tx.exame.update({ where: { id }, data: updateData });

            await tx.resultadoExame.deleteMany({ where: { exameId: id } });
            if (resultados && resultados.length > 0) {
                await tx.resultadoExame.createMany({
                    data: resultados.map((r: ResultadoInput) => ({
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

// DELETE /api/exames/[id] - Deleta um exame.
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
