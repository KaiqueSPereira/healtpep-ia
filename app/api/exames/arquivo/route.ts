import { NextRequest } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { decrypt, decryptString } from "@/app/_lib/crypto";
import { Buffer } from 'buffer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("ID do exame não fornecido", { status: 400 });
  }

  try {
    const exame = await prisma.exame.findUnique({
      where: { id },
      select: {
        nomeArquivo: true,
        arquivoExame: true,
      },
    });

    if (!exame || !exame.arquivoExame) {
      return new Response("Arquivo não encontrado", { status: 404 });
    }

    const encryptedBuffer = Buffer.from(exame.arquivoExame as Uint8Array);
    const decryptedFileBuffer = decrypt(encryptedBuffer);

    let decryptedFileName: string | null = null;
    if (exame.nomeArquivo) {
        try {
            decryptedFileName = decryptString(exame.nomeArquivo);
        } catch (e) {
            console.error("Erro ao descriptografar nome do arquivo:", e);
        }
    }

    const fileExtension = decryptedFileName?.split(".").pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
    };

    const contentType = (fileExtension && contentTypes[fileExtension]) || "application/octet-stream";

    // SOLUÇÃO FINAL E DEFINITIVA:
    // Cria uma cópia dos dados do Buffer do Node.js para uma nova Uint8Array (tipo da Web API).
    // Isto quebra a herança de tipos do Node.js e cria um objeto "puro", 100% compatível
    // com o construtor da Response, resolvendo o conflito de tipos de uma vez por todas.
    const body = new Uint8Array(decryptedFileBuffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${decryptedFileName || "arquivo"}"`,
      },
    });

  } catch (error) {
    console.error("Erro interno ao buscar o arquivo do exame:", error);
    return new Response("Erro interno ao buscar o arquivo", { status: 500 });
  }
}
