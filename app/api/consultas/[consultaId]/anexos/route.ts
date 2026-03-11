
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { z } from 'zod';
import { encryptString, safeDecrypt, encrypt as encryptBuffer } from '@/app/_lib/crypto';
import { logAction } from '@/app/_lib/logger';
import { Buffer } from 'buffer';
import { format } from 'date-fns';

async function getSessionInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Não autorizado");
    }
    return { userId: session.user.id };
}

const getConsultaIdFromUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');
        const anexosIndex = pathSegments.indexOf('anexos');
        if (anexosIndex > 1) return pathSegments[anexosIndex - 1];
    } catch (e) {
        const parts = url.split('/');
        const anexosIndex = parts.indexOf('anexos');
        if (anexosIndex > 1) return parts[anexosIndex - 1];
    }
    return null;
};

const anexoCreateSchema = z.object({
  tipo: z.enum(['Encaminhamento', 'Atestado', 'Declaracao', 'Receita_Medica', 'Relatorio', 'Outro']),
});

export async function GET(req: Request) {
    let userId: string | undefined;
    const consultaId = getConsultaIdFromUrl(req.url);
    try {
        const { userId: uId } = await getSessionInfo();
        userId = uId;
        if (!consultaId) return NextResponse.json({ error: 'ID da Consulta não encontrado' }, { status: 400 });

        const consulta = await db.consultas.findFirst({ where: { id: consultaId, userId } });
        if (!consulta) return NextResponse.json({ error: 'Consulta não encontrada ou não autorizada' }, { status: 404 });

        const anexos = await db.anexoConsulta.findMany({
            where: { consultaId },
            select: { id: true, nomeArquivo: true, tipo: true, createdAt: true, mimetype: true },
            orderBy: { createdAt: 'asc' },
        });

        const decryptedAnexos = anexos.map(anexo => ({
            ...anexo,
            nomeArquivo: safeDecrypt(anexo.nomeArquivo) ?? "arquivo_corrompido.txt",
        }));

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
        if (!consultaId) return NextResponse.json({ error: 'ID da Consulta não encontrado' }, { status: 400 });

        // MODIFICAÇÃO: Incluir o nome da unidade na busca da consulta
        const consulta = await db.consultas.findFirst({
            where: { id: consultaId, userId },
            include: { unidade: { select: { nome: true } } },
        });
        if (!consulta) return NextResponse.json({ error: 'Consulta não encontrada ou não autorizada' }, { status: 404 });

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const tipo = formData.get('tipo') as string;

        if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });

        const validation = anexoCreateSchema.safeParse({ tipo });
        if (!validation.success) return NextResponse.json({ error: `Tipo de anexo inválido: ${tipo}` }, { status: 400 });
        
        // MODIFICAÇÃO: Contar anexos existentes para o número de ordem
        const anexoCount = await db.anexoConsulta.count({ where: { consultaId } });
        const numeroDeOrdem = anexoCount + 1;

        const fileExtension = file.name.split('.').pop() || 'bin';
        const dataConsulta = format(new Date(consulta.data), 'dd-MM-yyyy');
        const tipoConsulta = consulta.tipo.replace(/\s+/g, '_'); // Sanitiza tipo da consulta
        const nomeUnidade = (consulta.unidade?.nome || 'N_A').replace(/\s+/g, '_'); // Sanitiza nome da unidade

        // MODIFICAÇÃO: Construir o novo nome do arquivo
        const newFileName = `${validation.data.tipo}-${dataConsulta}-${tipoConsulta}-${nomeUnidade}-${numeroDeOrdem}.${fileExtension}`;

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const encryptedFileBuffer = encryptBuffer(fileBuffer);
        const encryptedFileName = encryptString(newFileName);

        const anexo = await db.anexoConsulta.create({
            data: {
                consultaId: consultaId,
                nomeArquivo: encryptedFileName,
                arquivo: new Uint8Array(encryptedFileBuffer),
                mimetype: file.type,
                tipo: validation.data.tipo as any,
            },
            select: { id: true, nomeArquivo: true, tipo: true, createdAt: true, consultaId: true, mimetype: true },
        });

        await logAction({ userId, action: "create_anexo", level: "info", message: `Anexo '${anexo.id}' (${newFileName}) criado para a consulta '${consultaId}'`, component: "consultas-anexos-api" });

        // Retorna o anexo com o nome de arquivo padronizado e descriptografado
        return NextResponse.json({ ...anexo, nomeArquivo: newFileName });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        await logAction({ userId, action: "create_anexo_error", level: "error", message: `Erro ao criar anexo para a consulta '${consultaId}'`, details: errorMessage, component: "consultas-anexos-api" });
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro Interno do Servidor: ${errorMessage}` }, { status });
    }
}
