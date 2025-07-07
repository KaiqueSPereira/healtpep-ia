// app/api/exames/analise/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import OpenAI from "openai";
import { PdfReader, DataEntry } from 'pdfreader';
import { Buffer } from 'buffer';

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface para o resultado do exame
interface ExameResultado {
  nome: string;
  valor: string;
  unidade: string;
  valorReferencia: string;
}

// Função para extrair exames usando IA
async function extrairExamesDeTextoComIA(texto: string): Promise<ExameResultado[]> {
  try {
    const prompt = `Analise o seguinte texto de um relatório de exame de sangue e extraia os resultados dos exames. Retorne os dados em formato JSON, onde cada objeto no array representa um resultado de exame com as chaves "nome", "valor", "unidade", e "valorReferencia". Se um campo não estiver disponível, use uma string vazia.

Texto do Exame:
"${texto}"

Formato JSON de saída:
[
  {
    "nome": "Nome do Exame",
    "valor": "Valor do Resultado",
    "unidade": "Unidade de Medida",
    "valorReferencia": "Valor de Referência"
  },
  // ... outros exames
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const jsonResponse = response.choices[0]?.message?.content;

    if (!jsonResponse) {
      console.error("Resposta da IA vazia.");
      return [];
    }

    try {
        const parsedResponse = JSON.parse(jsonResponse);

        for (const key in parsedResponse) {
            if (Array.isArray(parsedResponse[key])) {
                 const resultadosValidos = parsedResponse[key].filter((item: ExameResultado) =>
                    typeof item.nome === 'string' &&
                    typeof item.valor === 'string' &&
                    typeof item.unidade === 'string' &&
                    typeof item.valorReferencia === 'string'
                 );
                 return resultadosValidos;
            }
        }

        console.error("Resposta da IA não contém um array de exames esperado:", parsedResponse);
        return [];


    } catch (jsonError) {
        console.error("Erro ao analisar JSON da IA:", jsonError, "Resposta da IA:", jsonResponse);
        const jsonMatch = jsonResponse.match(/[s*{.*?}s*]/s);
        if (jsonMatch && jsonMatch[0]) {
             try {
                 const fallbackParsed = JSON.parse(jsonMatch[0]);
                 const resultadosValidos = fallbackParsed.filter((item: ExameResultado) =>
                    typeof item.nome === 'string' &&
                    typeof item.valor === 'string' &&
                    typeof item.unidade === 'string' &&
                    typeof item.valorReferencia === 'string'
                 );
                 return resultadosValidos;
             } catch (fallbackJsonError) {
                 console.error("Erro ao analisar JSON de fallback:", fallbackJsonError);
                 return [];
             }
        }

        return [];
    }


  } catch (error) {
    console.error("Erro ao chamar API da IA:", error);
    return [];
  }
}

// Função para extrair texto de PDF
async function extrairTextoDePdf(buffer: Buffer): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let fullText = '';

 new PdfReader({}).parseBuffer(buffer, (err: Error | string | null | undefined, item: DataEntry | null | undefined) => {
      if (err) {
        console.error("Erro ao extrair texto com pdfreader:", err);
        return reject(err);
 } else if (item === null || item === undefined) {

        fullText += ' ';

 fullText += ' ';
        resolve(fullText);
      } else if (item.text) {

        fullText += item.text;

      }

      if (item && 'page' in item && item.page !== undefined) {
 fullText += '\\n';
      }
    });
  });
}

// Função POST para a API de análise
export async function POST(req: NextRequest) {
  console.log("--- Início do POST em /api/exames/analise ---");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.log("Arquivo não enviado para análise.");
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const mime = file.type;

    let textoExtraido = "";

    try { // Try para extração de texto
      if (mime === "application/pdf") {
        textoExtraido = await extrairTextoDePdf(fileBuffer);
      } else if (mime.startsWith("image/")) {
        const worker = await createWorker("por");
        const {
          data: { text },
        } = await worker.recognize(fileBuffer);
        await worker.terminate();
        textoExtraido = text;
      } else {
        console.log(`Tipo de arquivo não suportado para análise: ${mime}`);
        return NextResponse.json(
          { error: "Tipo de arquivo não suportado para análise" },
          { status: 415 },
        );
      }
    } catch (extractionError) { // Catch para extração de texto
        console.error("Erro ao extrair texto do arquivo para análise:", extractionError);
         return NextResponse.json(
          { error: "Erro ao extrair texto do arquivo para análise" },
          { status: 500 },
        );
    }

    const examesExtraidosPelaIA = await extrairExamesDeTextoComIA(textoExtraido);

     // Definir anotação com o texto extraído se a IA não encontrar resultados
     const anotacaoFinal = examesExtraidosPelaIA.length > 0 ? "" : textoExtraido.trim();

    console.log("Análise concluída. Retornando resultados e anotação.");
    console.log("--- Fim do POST em /api/exames/analise ---");

    return NextResponse.json({
      resultados: examesExtraidosPelaIA,
      anotacao: anotacaoFinal,
    });

  } catch (error) {
    console.error("Erro geral no handler POST de análise:", error);
    console.log("--- Fim do POST em /api/exames/analise com erro ---");
    return NextResponse.json(
      { error: "Erro interno no servidor durante a análise." },
      { status: 500 },
    );
  }
}
