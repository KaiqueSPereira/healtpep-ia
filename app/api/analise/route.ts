import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";

export const dynamic = "force-dynamic"; // necessário para lidar com arquivos

function extrairExamesDeTexto(texto: string) {
  const linhas = texto.split("\n");
  const resultados = [];

  for (const linha of linhas) {
    const match = linha.match(/^(.*?)\s+([\d.,]+)\s+([^\s]+)\s+(.*)$/);
    if (match) {
      resultados.push({
        nome: match[1].trim(),
        valor: match[2].trim(),
        unidade: match[3].trim(),
        valorReferencia: match[4].trim(),
        outraUnidade: "",
      });
    }
  }

  return resultados;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type;

  let textoExtraido = "";

  try {
    if (mime === "application/pdf") {
      const data = await pdfParse(buffer);
      textoExtraido = data.text;
    } else if (mime.startsWith("image/")) {
      const worker = await createWorker("por");
      const {
        data: { text },
      } = await worker.recognize(buffer);
      await worker.terminate();
      textoExtraido = text;
    } else {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado" },
        { status: 415 },
      );
    }

    const exames = extrairExamesDeTexto(textoExtraido);

    return NextResponse.json({
      resultados: exames,
      anotacao: exames.length === 0 ? textoExtraido.trim() : "",
    });
  } catch (error) {
    console.error("Erro ao processar arquivo:", error);
    return NextResponse.json(
      { error: "Erro ao processar arquivo" },
      { status: 500 },
    );
  }
}
