
import { NextRequest } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { decrypt, safeDecrypt } from "@/app/_lib/crypto"; 
import { Buffer } from 'buffer';
import mime from 'mime-types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anexoId = searchParams.get("anexoId");

  if (!anexoId) {
    return new Response("ID do anexo não fornecido", { status: 400 });
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
      return new Response("Arquivo não encontrado", { status: 404 });
    }

    const decryptedFileBuffer = decrypt(Buffer.from(anexo.arquivo));
    const fileName = safeDecrypt(anexo.nomeArquivo);

    // Determina o Content-Type com base no nome do arquivo para mais precisão
    const contentType = mime.lookup(fileName) || "application/octet-stream";

    const body = new Uint8Array(decryptedFileBuffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Garante que o navegador tente exibir o arquivo em vez de baixar
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error("Erro interno ao buscar o arquivo do anexo:", error);
    return new Response("Erro interno ao buscar o arquivo", { status: 500 });
  }
}
