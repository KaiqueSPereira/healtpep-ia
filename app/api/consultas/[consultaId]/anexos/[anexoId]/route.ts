
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { logAction } from '@/app/_lib/logger';
import { decrypt as decryptBuffer, safeDecrypt } from '@/app/_lib/crypto';
import { Buffer } from 'buffer';

async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

const getIdsFromUrl = (url: string) => {
  const parts = url.split('/');
  const anexoId = parts[parts.length - 1];
  const consultaId = parts[parts.length - 3];
  return { consultaId, anexoId };
};

export async function GET(request: Request) {
    let userId: string | undefined;
    const { consultaId, anexoId } = getIdsFromUrl(request.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!consultaId || !anexoId) {
            return NextResponse.json({ error: 'IDs de consulta e anexo são obrigatórios.' }, { status: 400 });
        }

        const anexo = await db.anexoConsulta.findFirst({
            where: { id: anexoId, consultaId: consultaId, consulta: { userId: userId } },
        });

        if (!anexo || !anexo.arquivo) {
            return NextResponse.json({ error: 'Anexo não encontrado ou arquivo inválido.' }, { status: 404 });
        }

        // Correção definitiva: Converter o Uint8Array do Prisma para Buffer ANTES de decriptar.
        const bufferToDecrypt = Buffer.from(anexo.arquivo);
        const decryptedFileArray = decryptBuffer(bufferToDecrypt);
        const decryptedFileBuffer = Buffer.from(decryptedFileArray);
        
        const decryptedFileName = safeDecrypt(anexo.nomeArquivo);

        const headers = new Headers();
        headers.set('Content-Type', anexo.mimetype || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${decryptedFileName || 'arquivo'}"`);

        return new NextResponse(decryptedFileBuffer, { status: 200, headers });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "get_anexo_error", level: "error", message: `Erro ao buscar anexo '${anexoId}'`, details: errorMessage, component: "consultas-anexo-id-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao buscar anexo: ${errorMessage}` }, { status });
    }
}

export async function DELETE(request: Request) {
    let userId: string | undefined;
    const { consultaId, anexoId } = getIdsFromUrl(request.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!consultaId || !anexoId) {
            return NextResponse.json({ error: 'IDs de consulta e anexo são obrigatórios.' }, { status: 400 });
        }

        const anexo = await db.anexoConsulta.findFirst({
            where: { id: anexoId, consultaId: consultaId, consulta: { userId: userId } },
        });

        if (!anexo) {
            return NextResponse.json({ error: 'Anexo não encontrado ou não autorizado para exclusão.' }, { status: 404 });
        }

        await db.anexoConsulta.delete({ where: { id: anexoId } });

        await logAction({ userId, action: "delete_anexo", level: "info", message: `Anexo '${anexoId}' deletado com sucesso`, component: "consultas-anexo-id-api" });

        return new NextResponse(null, { status: 204 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "delete_anexo_error", level: "error", message: `Erro ao deletar anexo '${anexoId}'`, details: errorMessage, component: "consultas-anexo-id-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao deletar anexo: ${errorMessage}` }, { status });
    }
}
