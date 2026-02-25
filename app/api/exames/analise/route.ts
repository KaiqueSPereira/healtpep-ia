
import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { PdfReader } from "pdfreader";
import { Buffer } from "buffer";
import { GoogleGenAI } from "@google/genai";
import { logErrorToDb } from "@/app/_lib/logger";
import { getBiomarkerRule } from "@/app/_lib/biomarkerUtils";
import { notifyAdmins } from "@/app/_lib/notificationUtils";

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
  categoria?: string; 
}
interface AnaliseSucesso {
  resultados: ExameResultado[];
  anotacao: string;
}
interface AnaliseResult extends AnaliseSucesso {
    error?: string;
}

function extractJsonFromText(text: string): object | null {
    const jsonRegex = /```json\\s*([\\s\\S]*?)\\s*```/;
    const match = text.match(jsonRegex);
    const potentialJson = match ? match[1] : text;
    try {
        const firstBrace = potentialJson.indexOf('{');
        const lastBrace = potentialJson.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) return null;

        const jsonString = potentialJson.substring(firstBrace, lastBrace + 1);
        const correctedJson = jsonString.replace(/,\\s*]/g, "]").replace(/,\\s*}/g, "}");
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
        if (
            typeof item === 'object' && item !== null &&
            'nome' in item && typeof item.nome === 'string' && item.nome.trim() &&
            'valor' in item && (typeof item.valor === 'string' || typeof item.valor === 'number') && String(item.valor).trim() &&
            'unidade' in item && typeof item.unidade === 'string' &&
            'valorReferencia' in item && typeof item.valorReferencia === 'string'
        ) {
            resultadosFinais.push({
                nome: item.nome.trim(),
                valor: String(item.valor).trim(),
                unidade: item.unidade.trim(),
                valorReferencia: item.valorReferencia.trim(),
            });
        }
    }
    return { resultados: resultadosFinais, anotacao };
}

async function analisarTextoDeExameComIA(texto: string): Promise<AnaliseResult> {
    const componentName = "analisarTextoDeExameComIA_Gemini";
    const unidadesMedidaString = unidadesMedida.join(', ');
    
    const prompt = `
    **TAREFA:** Analise o texto de um exame laboratorial e retorne um objeto JSON.

    **REGRAS DO JSON DE SAÍDA:**
    1.  **Estrutura:** O JSON deve conter duas chaves: \`resultados\` (um array de objetos) e \`anotacao\` (uma string).
    2.  **Formato Limpo:** Sua resposta final deve ser **APENAS** o objeto JSON, sem nenhum outro texto, markdown ou caracteres especiais como \`\`\`json.

    **REGRAS PARA A CHAVE "resultados":**
    -   Cada objeto no array representa um biomarcador.

    1.  **CHAVE "nome":**
        -   **Extração Fiel:** Extraia o nome do biomarcador EXATAMENTE como ele aparece no texto. NÃO padronize ou corrija (Ex: "creatininia" -> "creatininia", "hdl colesterol" -> "hdl colesterol").

    2.  **CHAVE "valor":**
        -   **Padronização Numérica:**
            -   "superior a 10", "maior que 10" -> "> 10"
            -   "inferior a 5", "menor que 5" -> "< 5"

    3.  **CHAVE "unidade":**
        -   **Seleção Obrigatória:** Use estritamente uma das unidades da lista: [${unidadesMedidaString}].
        -   **Padrão:** Se a unidade não for encontrada, use "--".

    4.  **CHAVE "valorReferencia":**
        -   **Formato de Intervalo:** Padronize intervalos para o formato "X - Y" (Ex: "10 a 20" -> "10 - 20").
        -   **Sem Unidade:** Não inclua a unidade de medida neste campo.

    **REGRAS PARA A CHAVE "anotacao":**
    -   **Descrição:** Crie um resumo descritivo dos itens medidos no exame (Ex: 'Hemograma, Creatinina e Colesterol - HDL.'). NÃO faça uma análise ou interpretação dos resultados.
    -   **Sem Metadados:** Não inclua nomes de arquivos.

    **EXEMPLO DE SAÍDA JSON:**
    {
      "resultados": [
        { "nome": "Creatinina", "valor": "1.2", "unidade": "mg/dL", "valorReferencia": "0.7 - 1.3" }
      ],
      "anotacao": "Hemograma e Creatinina."
    }

    **ANALISE O TEXTO ABAIXO E GERE O JSON:**

    **ENTRADA:**
    ${texto}
    `;

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        const generatedText = result.text?.trim() ?? "";
        const jsonResponse = extractJsonFromText(generatedText);

        if (!jsonResponse) {
            const errorMessage = "A resposta da IA não estava no formato esperado.";
            await logErrorToDb("A IA (Gemini) não retornou um JSON válido", { rawText: generatedText }, componentName);
            return { resultados: [], anotacao: "", error: errorMessage };
        }

        const parsedResponse = parseIaResponse(jsonResponse);
        return { ...parsedResponse };

    } catch (error: unknown) {
        let errorMessage = "O serviço de análise de IA está temporariamente indisponível.";
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
  await logErrorToDb("Análise de Exame Iniciada", `Requisição recebida em ${new Date().toISOString()}`, componentName);
  try {
    const formData = await req.formData();
    const file = formData.get("files") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo foi enviado." }, { status: 400 });
    }

    if (!process.env.GOOGLE_API_KEY) {
        const errorMessage = "O serviço de análise não está configurado.";
        await logErrorToDb("Chave da API do Google não configurada", "A variável GOOGLE_API_KEY não foi encontrada.", componentName);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const worker = await createWorker("por");
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let texto = "";

    if (file.type === "application/pdf") {
        texto = await extrairTextoDePdf(fileBuffer);
    } else if (file.type.startsWith("image/")) {
        const { data: { text } } = await worker.recognize(fileBuffer);
        texto = text;
    } else {
        await worker.terminate();
        return NextResponse.json({ error: `Tipo de arquivo '${file.type}' não suportado.` }, { status: 415 });
    }
    
    await worker.terminate();

    if (!texto.trim()) {
        const errorMessage = "Não foi possível ler o conteúdo do arquivo. Verifique a qualidade do documento.";
        await logErrorToDb("Nenhum texto extraído do arquivo", { fileName: file.name }, componentName);
        return NextResponse.json({ error: errorMessage }, { status: 422 });
    }

    const analiseIA = await analisarTextoDeExameComIA(texto);

    if (analiseIA.error) {
        return NextResponse.json({ error: analiseIA.error, resultados: [], anotacao: '' }, { status: 500 });
    }
    
    const resultadosProcessados: ExameResultado[] = [];
    const notificacoesPendentes = new Set<string>();

    for (const resultado of analiseIA.resultados) {
      const rule = await getBiomarkerRule(resultado.nome);
      
      if (rule.category === 'Pendente') {
        notificacoesPendentes.add(resultado.nome);
      }
      
      resultadosProcessados.push({
        ...resultado,
        nome: rule.standardizedName,
        categoria: rule.category,
      });
    }

    if (notificacoesPendentes.size > 0) {
        const biomarcadoresNaoCategorizados = Array.from(notificacoesPendentes).join(', ');
        await notifyAdmins({
            title: 'Biomarcador não categorizado',
            message: `Os seguintes biomarcadores precisam de categorização: ${biomarcadoresNaoCategorizados}.`,
            url: '/admin/biomarcadores',
            type: 'BIOMARCADOR_PENDENTE'
        });
    }

    return NextResponse.json({ resultados: resultadosProcessados, anotacao: analiseIA.anotacao });

  } catch (error: unknown) {
    const errorMessage = "Ocorreu um erro inesperado ao processar o arquivo.";
    await logErrorToDb("Erro geral no handler POST de análise", error instanceof Error ? error.stack || error.message : String(error), componentName);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
