
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { z } from 'zod';
import { encryptString, safeDecrypt, encrypt as encryptBuffer } from '@/app/_lib/crypto';
import { logAction } from '@/app/_lib/logger';
import { Buffer } from 'buffer';

async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

const getConsultaIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};

const anexoCreateSchema = z.object({
  tipo: z.enum(['Encaminhamento', 'Atestado_Declaracao', 'Receita_Medica', 'Relatorio', 'Outro']),
});

export async function GET(req: Request) {
    let userId: string | undefined;
    const consultaId = getConsultaIdFromUrl(req.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!consultaId) {
            return NextResponse.json({ error: 'ID da Consulta não encontrado' }, { status: 400 });
        }

        const consulta = await db.consultas.findFirst({ where: { id: consultaId, userId } });
        if (!consulta) {
            return NextResponse.json({ error: 'Consulta não encontrada ou não autorizada' }, { status: 404 });
        }

        const anexos = await db.anexoConsulta.findMany({
            where: { consultaId },
            select: { id: true, nomeArquivo: true, tipo: true, createdAt: true },
        });

        const decryptedAnexos = anexos.map(anexo => ({ ...anexo, nomeArquivo: safeDecrypt(anexo.nomeArquivo) }));

        return NextResponse.json(decryptedAnexos);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "get_anexos_error", level: "error", message: `Erro ao buscar anexos para a consulta '${consultaId}'`, details: errorMessage, component: "consultas-anexos-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao buscar anexos: ${errorMessage}` }, { status });
    }
}

export async function POST(req: Request) {
    let userId: string | undefined;
    const consultaId = getConsultaIdFromUrl(req.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;

        if (!consultaId) {
            return NextResponse.json({ error: 'ID da Consulta não encontrado' }, { status: 400 });
        }

        const consulta = await db.consultas.findFirst({ where: { id: consultaId, userId } });
        if (!consulta) {
            return NextResponse.json({ error: 'Consulta não encontrada ou não autorizada' }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const tipo = formData.get('tipo') as string;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const validation = anexoCreateSchema.safeParse({ tipo });
        if (!validation.success) {
            return NextResponse.json({ error: 'Tipo de anexo inválido' }, { status: 400 });
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const encryptedFileBuffer = encryptBuffer(fileBuffer);
        const encryptedFileName = encryptString(file.name);

        const anexo = await db.anexoConsulta.create({
            data: {
                consultaId: consultaId,
                nomeArquivo: encryptedFileName,
                arquivo: new Uint8Array(encryptedFileBuffer), // Correção: Converte Buffer para Uint8Array
                mimetype: file.type,
                tipo: validation.data.tipo,
            },
            select: { id: true, nomeArquivo: true, tipo: true, createdAt: true, consultaId: true },
        });

        await logAction({ userId, action: "create_anexo", level: "info", message: `Anexo '${anexo.id}' criado para a consulta '${consultaId}'`, component: "consultas-anexos-api" });

        return NextResponse.json({ ...anexo, nomeArquivo: file.name }); // Retorna nome original descriptografado para o cliente

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "create_anexo_error", level: "error", message: `Erro ao criar anexo para a consulta '${consultaId}'`, details: errorMessage, component: "consultas-anexos-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro Interno do Servidor: ${errorMessage}` }, { status });
    }
}
