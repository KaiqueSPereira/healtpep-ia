import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import OpenAI from "openai";
import { PdfReader} from 'pdfreader';
import { Buffer } from 'buffer';

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface para o resultado do exame (para exames de sangue/urina)
interface ExameResultado {
  nome: string;
  valor: string;
  unidade: string;
  valorReferencia: string;
}

// Interface para a resposta da IA
interface IaResponse {
  resultados: ExameResultado[];
  resumo: string;
}

// Função para analisar texto de exame usando IA, adaptada para diferentes tipos
async function analisarTextoDeExameComIA(texto: string, tipo: string): Promise<IaResponse> {
  let prompt;

  // Seleciona o prompt com base no tipo de exame
  if (tipo === 'sangue' || tipo === 'urina') {
    prompt = `Analise o seguinte texto de um relatório de exame (${tipo}) e execute duas tarefas:
1. Extraia os resultados dos exames em um formato JSON. O array JSON deve ser acessível pela chave "resultados". Cada objeto no array deve ter as chaves "nome", "valor", "unidade", e "valorReferencia". Se um campo não estiver disponível, use uma string vazia.
2. Crie um resumo conciso dos achados do exame, destacando quaisquer valores que estejam fora do normal. O resumo deve ser uma string e acessível pela chave "resumo".

Texto do Exame:
"${texto}"

Formato JSON de saída esperado:
{
  "resultados": [
    {
      "nome": "Nome do Exame",
      "valor": "Valor",
      "unidade": "Unidade",
      "valorReferencia": "Referência"
    }
  ],
  "resumo": "Resumo dos achados do exame..."
}`;
  } else {
    prompt = `Analise o seguinte texto de um laudo de exame de imagem ou outro procedimento ("${tipo}") e crie um resumo detalhado dos achados em linguagem clara. Não extraia dados tabulares. O resultado deve ser um objeto JSON com uma única chave "resumo" contendo o texto do resumo.

Texto do Laudo:
"${texto}"

Formato JSON de saída esperado:
{
  "resumo": "Resumo detalhado do laudo..."
}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const jsonResponse = response.choices[0]?.message?.content;

    if (!jsonResponse) {
      console.error("Resposta da IA vazia.");
      return { resultados: [], resumo: texto }; // Retorna o texto original como fallback
    }

    try {
      const parsedResponse = JSON.parse(jsonResponse);
      
      // Validação e extração para sangue/urina
      if (tipo === 'sangue' || tipo === 'urina') {
        const resultados = Array.isArray(parsedResponse.resultados) ? parsedResponse.resultados.filter((item: any) =>
          typeof item.nome === 'string' &&
          typeof item.valor === 'string' &&
          typeof item.unidade === 'string' &&
          typeof item.valorReferencia === 'string'
        ) : [];
        const resumo = parsedResponse.resumo || "";
        return { resultados, resumo };
      }

      // Extração para outros tipos de exame
      const resumo = parsedResponse.resumo || "Não foi possível gerar um resumo.";
      return { resultados: [], resumo };

    } catch (jsonError) {
      console.error("Erro ao analisar JSON da IA:", jsonError, "Resposta da IA:", jsonResponse);
      // Fallback para o caso de erro de JSON: retorna o texto extraído como anotação
      return { resultados: [], resumo: texto };
    }

  } catch (error) {
    console.error("Erro ao chamar API da IA:", error);
    return { resultados: [], resumo: "Erro ao comunicar com a IA." };
  }
}

// Função para extrair texto de PDF
async function extrairTextoDePdf(buffer: Buffer): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let fullText = '';
        new PdfReader({}).parseBuffer(buffer, (err, item) => {
            if (err) {
                console.error("Erro ao extrair texto com pdfreader:", err);
                reject(err);
            } else if (!item) { // Fim do arquivo
                resolve(fullText);
            } else if (item.text) {
                fullText += item.text + ' ';
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
    const tipoExame = formData.get("tipoExame") as string | null;

    if (!file || !tipoExame) {
      console.log("Arquivo ou tipo de exame não enviado para análise.");
      return NextResponse.json({ error: "Arquivo e tipo de exame são obrigatórios" }, { status: 400 });
    }

    console.log(`Analisando arquivo: ${file.name}, Tipo: ${tipoExame}`);

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const mime = file.type;

    let textoExtraido = "";

    try {
      if (mime === "application/pdf") {
        textoExtraido = await extrairTextoDePdf(fileBuffer);
      } else if (mime.startsWith("image/")) {
        const worker = await createWorker("por");
        const { data: { text } } = await worker.recognize(fileBuffer);
        await worker.terminate();
        textoExtraido = text;
      } else {
        console.log(`Tipo de arquivo não suportado para análise: ${mime}`);
        return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 415 });
      }
    } catch (extractionError) {
        console.error("Erro ao extrair texto do arquivo para análise:", extractionError);
        return NextResponse.json({ error: "Erro ao extrair texto do arquivo" }, { status: 500 });
    }

    if (!textoExtraido.trim()) {
        console.log("Nenhum texto pôde ser extraído do arquivo.");
        return NextResponse.json({ error: "Nenhum texto pôde ser extraído do arquivo." }, { status: 500 });
    }

    const analiseIA = await analisarTextoDeExameComIA(textoExtraido, tipoExame);

    console.log("Análise concluída. Retornando resultados e anotação.");
    console.log("--- Fim do POST em /api/exames/analise ---");

    return NextResponse.json({
      resultados: analiseIA.resultados,
      anotacao: analiseIA.resumo,
    });

  } catch (error) {
    console.error("Erro geral no handler POST de análise:", error);
    console.log("--- Fim do POST em /api/exames/analise com erro ---");
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}