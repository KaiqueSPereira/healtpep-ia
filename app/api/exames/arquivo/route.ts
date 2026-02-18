
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { decrypt, safeDecrypt } from "@/app/_lib/crypto"; 
import { Buffer } from 'buffer';
import mime from 'mime-types';
import { logErrorToDb } from "@/app/_lib/logger";

export async function GET(req: NextRequest) {
  const componentName = "API GET /api/exames/arquivo";
  const { searchParams } = new URL(req.url);
  const anexoId = searchParams.get("anexoId");

  if (!anexoId) {
    return NextResponse.json({ error: "O ID do anexo não foi fornecido." }, { status: 400 });
  }

  try {
    const anexo = await prisma.anexoExame.findUnique({
      where: { id: anexoId },
      select: {
        nomeArquivo: true,
        arquivo: true,
      },
    });

    if (!anexo || !anexo.arquivo) {
      return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    const decryptedFileBuffer = decrypt(Buffer.from(anexo.arquivo));
    const fileName = safeDecrypt(anexo.nomeArquivo);

    const contentType = mime.lookup(fileName) || "application/octet-stream";

    const body = new Uint8Array(decryptedFileBuffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });

  } catch (error) {
    await logErrorToDb(
        `Erro ao buscar o arquivo de exame com ID: ${anexoId}`,
        error instanceof Error ? error.stack || error.message : String(error),
        componentName
    );
    return NextResponse.json({ error: "Ocorreu um erro interno ao buscar o arquivo. Tente novamente mais tarde." }, { status: 500 });
  }
}
