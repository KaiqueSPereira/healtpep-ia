
import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { PdfReader } from "pdfreader";
import { Buffer } from "buffer";
import { GoogleGenAI } from "@google/genai";
import { logErrorToDb } from "@/app/_lib/logger";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

const unidadesMedida = [
    "g/dL", "mg/dL", "mg/L", "mg/mL", "mg/g", "mg/kg", "μg/dL", "µg/dL", "μg/mL", "µg/mL", "μg/L", "µg/L",
    "ng/mL", "ng/dL", "pg/mL", "pg/dL", "pg", "mmol/L", "μmol/L", "µmol/L", "mcmol/L", "mcmol/mol",
    "nmol/L", "pmol/L","mEq/L", "Eq/L","U/L", "IU/L", "UI/L", "KU/L", "μIU/mL", "µIU/mL", "uUI/mL", "µUI/mL", "mUI/mL","%", "milhões/mm³", "mil/mm³",
    "mm³", "mm/h","células/μL", "células/uL", "10³/μL", "10³/uL","10⁶/μL", "10⁶/uL", "x10⁶/uL","fL", "pL","g/L", "g/mL",
    "mL/min", "L/min","uL", "μL", "µL","mL", "L","mL/kg/min","g/24h", "mg/24h", "μg/24h", "µg/24h",
    "cópias/mL", "UI/mL", "IU/mL","log", "log10", "log cópias/mL","ratio", "Índice", "Index",
    "segundos", "s","bpm","mmHg","°C","mOsm/kg", "mOsm/L","U/mL","RFU","S/CO","AU/mL","--","Outro",
  ];

interface ExameResultado {
  nome: string;
  valor: string;
  unidade: string;
  valorReferencia: string;
}
interface AnaliseSucesso {
  resultados: ExameResultado[];
  anotacao: string;
}
interface AnaliseResult extends AnaliseSucesso {
    error?: string;
}

function extractJsonFromText(text: string): object | null {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    const potentialJson = match ? match[1] : text;
    try {
        const firstBrace = potentialJson.indexOf('{');
        const lastBrace = potentialJson.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) return null;

        const jsonString = potentialJson.substring(firstBrace, lastBrace + 1);
        const correctedJson = jsonString.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
        return JSON.parse(correctedJson);
    } catch (e) {
        return null;
    }
}

function parseIaResponse(iaObject: unknown): AnaliseSucesso {
    if (typeof iaObject !== 'object' || iaObject === null) return { resultados: [], anotacao: "" };
    const iaRecord = iaObject as Record<string, unknown>;
    const anotacao = typeof iaRecord.anotacao === 'string' ? iaRecord.anotacao : "";
    if (!Array.isArray(iaRecord.resultados)) return { resultados: [], anotacao };

    const resultadosFinais: ExameResultado[] = [];
    for (const item of iaRecord.resultados) {
        if (typeof item === 'object' && item !== null && 'nome' in item && 'valor' in item) {
            const nome = String(item.nome || '').trim();
            const valor = String(item.valor || '').trim();
            if (nome && valor) {
                const valorReferencia = String(item.valorReferencia || item.referencia || '--').trim();
                const unidade = String(item.unidade || determinarUnidade(valor, valorReferencia));
                resultadosFinais.push({ nome, valor, unidade, valorReferencia });
            }
        }
    }
    return { resultados: resultadosFinais, anotacao };
}

function determinarUnidade(valor: string, referencia: string): string {
    if (/[a-zA-Z]/.test(valor) && !/^[0-9.,<> ]*[a-zA-Z/³μLmgdL%-]+$/.test(valor)) return "--";
    const textoBusca = (referencia + ' ' + valor).toLowerCase();
    for (const unidade of unidadesMedida) {
        if (unidade !== '--' && unidade !== 'Outro') {
            const regex = new RegExp(`\\b${unidade.toLowerCase().replace(/[/³]/g, '\\$&')}\\b`);
            if (regex.test(textoBusca)) return unidade;
        }
    }
    if (/[0-9]/.test(valor)) return "Outro";
    return "--";
}

async function analisarTextoDeExameComIA(texto: string): Promise<AnaliseResult> {
    const componentName = "analisarTextoDeExameComIA_Gemini";
    const unidadesMedidaString = unidadesMedida.join(', ');
    
    const prompt = `Analise o texto de um exame laboratorial e extraia os dados estruturados. Sua resposta DEVE ser APENAS um objeto JSON válido.
O objeto JSON precisa ter duas chaves:
1. "resultados": um array de objetos, onde cada objeto representa um biomarcador e contém as chaves:
    - "nome"
    - "valor"
    - "unidade": Use estritamente uma das seguintes opções: [${unidadesMedidaString}].
    - "valorReferencia": O intervalo de referência (ex: "4.2 - 5.4"). NÃO inclua a unidade de medida aqui.
2. "anotacao": uma string com um resumo conciso do exame. IMPORTANTE: A anotação não deve incluir nenhum título, nome de arquivo ou qualquer informação que não seja a análise direta dos resultados.

---
**EXEMPLO DE SAÍDA JSON:**
\`\`\`json
{
  "resultados": [
    { "nome": "Eritrócitos", "valor": "4.5", "unidade": "milhões/mm³", "valorReferencia": "4.2 - 5.4" },
    { "nome": "Hemoglobina", "valor": "14.1", "unidade": "g/dL", "valorReferencia": "12.0 - 16.0" }
  ],
  "anotacao": "O hemograma está dentro dos valores de referência."
}
\`\`\`
---
**AGORA, ANALISE O TEXTO REAL ABAIXO E GERE O JSON CORRESPONDENTE:**
**ENTRADA:** ${texto}
**SAÍDA JSON:** `;

    try {
        // REVERTENDO PARA A CHAMADA ORIGINAL E FUNCIONAL DA API
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        const generatedText = result.text?.trim() ?? "";

        const jsonResponse = extractJsonFromText(generatedText);

        if (!jsonResponse) {
            const errorMessage = "Não foi possível interpretar o resultado da análise. A resposta da IA não estava em um formato esperado.";
            await logErrorToDb("A IA (Gemini) não retornou um JSON válido", { rawText: generatedText }, componentName);
            return { resultados: [], anotacao: "", error: errorMessage };
        }

        const parsedResponse = parseIaResponse(jsonResponse);
        return { ...parsedResponse };

    } catch (error: unknown) {
        let errorMessage = "O serviço de análise de IA está temporariamente indisponível. Tente novamente mais tarde.";
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API key expired'))) {
            errorMessage = "O serviço de análise não está configurado corretamente.";
        }
        await logErrorToDb("Erro na chamada da API do Google Gemini", error instanceof Error ? error.stack || error.message : String(error), componentName);
        return { resultados: [], anotacao: "", error: errorMessage };
    }
}

async function extrairTextoDePdf(buffer: Buffer): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let fullText = '';
        new PdfReader({}).parseBuffer(buffer, (err, item) => {
            if (err) reject(err); else if (!item) resolve(fullText.trim()); else if (item.text) fullText += item.text + ' ';
        });
    });
}

export async function POST(req: NextRequest) {
  const componentName = "API /api/exames/analise";
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo foi enviado. Por favor, selecione um para continuar." }, { status: 400 });
    }

    if (!process.env.GOOGLE_API_KEY) {
        const errorMessage = "O serviço de análise não está configurado corretamente.";
        await logErrorToDb("Chave da API do Google não configurada", "A variável de ambiente GOOGLE_API_KEY não foi encontrada.", componentName);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    let textoExtraido = "";

    if (file.type === "application/pdf") {
        textoExtraido = await extrairTextoDePdf(fileBuffer);
    } else if (file.type.startsWith("image/")) {
        const worker = await createWorker("por");
        const { data: { text } } = await worker.recognize(fileBuffer);
        await worker.terminate();
        textoExtraido = text;
    } else {
        return NextResponse.json({ error: "Tipo de arquivo não suportado. Por favor, envie um PDF ou uma imagem (PNG, JPG)." }, { status: 415 });
    }

    if (!textoExtraido.trim()) {
        const errorMessage = "Não foi possível ler o conteúdo do arquivo. Verifique se a imagem está nítida ou se o PDF não está protegido ou em branco.";
        await logErrorToDb("Nenhum texto extraído do arquivo", { fileName: file.name, fileType: file.type }, componentName);
        return NextResponse.json({ error: errorMessage }, { status: 422 });
    }

    const analiseIA = await analisarTextoDeExameComIA(textoExtraido);

    if (analiseIA.error) {
        return NextResponse.json({ error: analiseIA.error, resultados: [], anotacao: '' }, { status: 500 });
    }

    return NextResponse.json({ resultados: analiseIA.resultados, anotacao: analiseIA.anotacao });

  } catch (error: unknown) {
    const errorMessage = "Ocorreu um erro inesperado ao processar o arquivo.";
    await logErrorToDb("Erro geral no handler POST de análise", error instanceof Error ? error.stack || error.message : String(error), componentName);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
