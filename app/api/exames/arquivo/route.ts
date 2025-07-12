import { NextRequest } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { decrypt } from "@/app/_lib/crypto"; // Importe sua função de descriptografia de Buffer
import { decryptString } from "@/app/_lib/crypto"; // Importe sua função para descriptografar strings
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

    // === Lógica de Descriptografia do Arquivo ===
    // Converta o Uint8Array para Buffer
    const encryptedBuffer = Buffer.from(exame.arquivoExame as Uint8Array);

    // Chame a função decrypt que espera um Buffer
    const decryptedFileBuffer = decrypt(encryptedBuffer);
    // ===============================================

    // === Lógica de Descriptografia do Nome do Arquivo e Determinação do Content-Type ===
    let decryptedFileName: string | null = null;
    if (exame.nomeArquivo) {
        try {
            decryptedFileName = decryptString(exame.nomeArquivo); // Descriptografa o nome do arquivo
        } catch (e) {
            console.error("Erro ao descriptografar nome do arquivo:", e);
            // Se a descriptografia do nome do arquivo falhar, podemos prosseguir sem um nome específico
        }
    }


    const fileExtension = decryptedFileName?.split(".").pop()?.toLowerCase(); // Usa o nome descriptografado

    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      txt: "text/plain",
      // Adicione outros tipos MIME conforme necessário
    };

    const contentType =
      (fileExtension && contentTypes[fileExtension]) ||
      "application/octet-stream"; // Fallback para tipo genérico

    // --- Logs para depuração ---
    console.log("Nome do arquivo descriptografado:", decryptedFileName); // Log do nome descriptografado
    console.log("Extensão do arquivo:", fileExtension); // Log da extensão
    console.log("Content-Type enviado:", contentType); // Log do Content-Type
    console.log("Content-Disposition enviado:", `inline; filename="${decryptedFileName || "arquivo"}"`); // Usar nome descriptografado no Content-Disposition
    // --- Fim dos logs ---


    const base64File = decryptedFileBuffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64File}`;

    return new Response(dataUrl, {
      headers: {
        "Content-Type": "text/plain", // Retornamos a Data URL como uma string de texto
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${decryptedFileName || "arquivo"}"`, // Adiciona o cabeçalho Content-Disposition
      },
    });
  } catch (error) {
    console.error("Erro interno ao buscar o arquivo do exame:", error);
    return new Response("Erro interno ao buscar o arquivo", { status: 500 });
  }
}
