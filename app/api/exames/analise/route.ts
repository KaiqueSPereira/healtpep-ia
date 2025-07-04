import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import OpenAI from "openai";

interface ExameResultado {
  nome: string;
  valor: string;
  unidade: string;
  valorReferencia: string;
}

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Nova função para extrair exames usando IA
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
                 // Validar se os objetos dentro do array têm a estrutura esperada
                 const resultadosValidos = parsedResponse[key].filter((item: ExameResultado) => // Usando a interface
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
                 const resultadosValidos = fallbackParsed.filter((item: ExameResultado) => // Usando a interface
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

import { PdfReader, DataEntry } from 'pdfreader';

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
      textoExtraido = await extrairTextoDePdf(buffer); // Usar a nova função
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

    const examesExtraidosPelaIA = await extrairExamesDeTextoComIA(textoExtraido);

    return NextResponse.json({
      resultados: examesExtraidosPelaIA,
      anotacao: examesExtraidosPelaIA.length > 0 ? "" : textoExtraido.trim(),
    });
  } catch (error) {
    console.error("Erro ao processar arquivo:", error);
    return NextResponse.json(
      { error: "Erro ao processar arquivo" },
      { status: 500 },
    );
  }
}