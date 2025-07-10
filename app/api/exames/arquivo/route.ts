import { NextRequest } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { decrypt } from "@/app/_lib/crypto"; // Importe sua função de descriptografia de Buffer
import { Buffer } from 'buffer'; // Importe Buffer explicitamente

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
        arquivoExame: true, // Agora sabemos que este é um Uint8Array
      },
    });

    if (!exame || !exame.arquivoExame) {
      return new Response("Arquivo não encontrado", { status: 404 });
    }

    // === Lógica de Descriptografia ===
    // Converta o Uint8Array para Buffer
    const encryptedBuffer = Buffer.from(exame.arquivoExame as Uint8Array);

    // Chame a função decrypt que espera um Buffer
    const decryptedFileBuffer = decrypt(encryptedBuffer);
    // ===============================================

    const fileExtension = exame.nomeArquivo?.split(".").pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      txt: "text/plain",
      // ...
    };

    const contentType =
      (fileExtension && contentTypes[fileExtension]) ||
      "application/octet-stream";

    // --- Logs para depuração ---
    console.log("Content-Type enviado:", contentType);
    console.log("Content-Disposition enviado:", `inline; filename="${exame.nomeArquivo}"`);
    // --- Fim dos logs ---

    
    const base64File = decryptedFileBuffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64File}`;

    return new Response(dataUrl, {
      headers: {
        "Content-Type": "text/plain", 
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar o arquivo do exame:", error);
    console.error("Detalhes do erro:", error); // Manter log detalhado
    return new Response("Erro interno ao buscar o arquivo", { status: 500 });
  }
}
