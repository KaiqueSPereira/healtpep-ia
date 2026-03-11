import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/_lib/auth';
import { decrypt } from '@/app/_lib/crypto';
import { logAction } from '@/app/_lib/logger';


// GET para buscar um anexo específico
export async function GET(request: NextRequest, context: { params: Promise<{ consultaId: string; anexoId: string; }> }) {
    const session = await getServerSession(authOptions);
    const { consultaId, anexoId } = await context.params;
    const userId = session?.user?.id;

    if (!session || !userId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const anexo = await prisma.anexoConsulta.findFirst({
            where: { id: anexoId, consultaId: consultaId },
        });

        if (!anexo || !anexo.arquivo) {
            return NextResponse.json({ error: 'Anexo não encontrado ou está vazio' }, { status: 404 });
        }

        const bufferFromDb = Buffer.from(anexo.arquivo);
        const decryptedBuffer = decrypt(bufferFromDb);

        const arrayBuffer = Uint8Array.from(decryptedBuffer).buffer;

        return new NextResponse(new Blob([arrayBuffer]), {
            status: 200,
            headers: {
                'Content-Type': anexo.mimetype || 'application/octet-stream',
                'Content-Disposition': `inline; filename="${anexo.nomeArquivo}"`,
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({
            userId: userId,
            action: "get_anexo_error",
            level: "error",
            message: `Erro ao buscar anexo '${anexoId}' para a consulta '${consultaId}'`,
            details: errorMessage,
            component: "anexo-details-api"
        });
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE para apagar um anexo
export async function DELETE(request: NextRequest, context: { params: Promise<{ consultaId: string; anexoId: string; }> }) {
    const session = await getServerSession(authOptions);
    const { consultaId, anexoId } = await context.params;
    const userId = session?.user?.id;

    if (!session || !userId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    try {
        const anexo = await prisma.anexoConsulta.findFirst({
            where: { id: anexoId, consultaId: consultaId },
        });

        if (!anexo) {
            return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 });
        }

        await prisma.anexoConsulta.delete({ where: { id: anexoId } });

        // Log de sucesso na exclusão
        await logAction({
            userId: userId,
            action: "delete_anexo",
            level: "info",
            message: `Anexo '${anexoId}' foi deletado da consulta '${consultaId}'`,
            details: `Nome do arquivo (criptografado): ${anexo.nomeArquivo}`,
            component: "anexo-details-api"
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        // Log de erro na exclusão
        await logAction({
            userId: userId,
            action: "delete_anexo_error",
            level: "error",
            message: `Erro ao deletar anexo '${anexoId}' da consulta '${consultaId}'`,
            details: errorMessage,
            component: "anexo-details-api"
        });
        return NextResponse.json({ error: 'Erro interno do servidor ao deletar o anexo' }, { status: 500 });
    }
}
