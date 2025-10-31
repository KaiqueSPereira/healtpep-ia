import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import OpenAI from "openai";
import { PdfReader } from "pdfreader";
import { Buffer } from "buffer";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const unidadesMedida = [
  "g/dL", "mg/dL", "milhões/mm³", "mil/mm³", "mm³", "mm/h", "mg/L", "ng/mL", "pg", "fL", "U/L", "mEq/L", "%",
  "uUI/mL", "mL/min", "mg", "μg/dL", "μIU/mL", "μmol/L", "mcmol/L", "mcmol/mol", "mg/g", "IU/L", "μg/mL",
  "mmol/L", "nmol/L", "10³/ul", "Cópias/ML", "log", "células/μL", "x106/uL", "pg/mL", "µg/dL", "uL",
  "µUI/mL", "mL", "--", "Outro",
];

interface ExameResultado {
  nome: string;
  valor: string;
  unidade: string;
  valorReferencia: string;
}

interface IaResponse {
  resultados: ExameResultado[];
  anotacao: string;
}

function determinarUnidade(valor: string, referencia: string): string {
    if (/[a-zA-Z]/.test(valor) && !/^[0-9.,<> ]*[a-zA-Z/³μLmgdL%-]+$/.test(valor)) {
        return "--";
    }
    const textoBusca = (referencia + ' ' + valor).toLowerCase();
    for (const unidade of unidadesMedida) {
        if (unidade !== '--' && unidade !== 'Outro') {
            const regex = new RegExp(`\\b${unidade.toLowerCase().replace(/[/³]/g, '\\$&')}\\b`);
            if (regex.test(textoBusca)) {
                return unidade;
            }
        }
    }
    if (/[0-9]/.test(valor)) {
        return "Outro";
    }
    return "--";
}

function parseIaResponse(iaObject: unknown): IaResponse {
    // Validação inicial para garantir que a resposta da IA seja um objeto
    if (typeof iaObject !== 'object' || iaObject === null) {
        return {
            resultados: [],
            anotacao: "Resposta da IA inválida: não é um objeto JSON."
        };
    }

    const iaRecord = iaObject as Record<string, unknown>;

    // Extrai a anotação, garantindo que seja uma string
    const anotacao = typeof iaRecord.anotacao === 'string' ? iaRecord.anotacao : "Anotação não fornecida pela IA.";

    // Valida se 'resultados' é um array
    if (!Array.isArray(iaRecord.resultados)) {
        return {
            resultados: [],
            anotacao: anotacao || "Resposta da IA inválida: a chave 'resultados' não é um array."
        };
    }

    const resultadosFinais: ExameResultado[] = [];
    // Itera sobre cada item do array 'resultados'
    for (const item of iaRecord.resultados) {
        // Valida se o item é um objeto com as propriedades essenciais
        if (
            typeof item === 'object' &&
            item !== null &&
            'nome' in item &&
            'valor' in item
        ) {
            const nome = String(item.nome || '').trim();
            const valor = String(item.valor || '').trim();

            // Garante que nome e valor não estejam vazios
            if (nome && valor) {
                // Usa 'valorReferencia' ou 'referencia' para flexibilidade
                const valorReferencia = String(item.valorReferencia || item.referencia || '--').trim();
                // Tenta pegar a unidade do item, senão, determina a partir do valor e referência
                const unidade = String(item.unidade || determinarUnidade(valor, valorReferencia)).trim();

                resultadosFinais.push({
                    nome,
                    valor,
                    unidade,
                    valorReferencia,
                });
            }
        }
    }

    return { resultados: resultadosFinais, anotacao };
}


async function analisarTextoDeExameComIA(texto: string): Promise<IaResponse> {
    const prompt = `Analise o texto a seguir, que contém resultados de exames. Sua tarefa é extrair cada item do exame e estruturar a informação em um formato JSON específico.

O JSON de saída deve ter **exatamente** duas chaves no nível raiz: \`resultados\` e \`anotacao\`.

1.  **\`resultados\`**: Esta chave deve conter um **ARRAY** de objetos. Cada objeto no array representa um único item do exame e deve conter as seguintes chaves:
    *   \`"nome"\`: Uma string com o nome do teste (ex: "Hemácias", "Glicose", "Colesterol Total").
    *   \`"valor"\`: Uma string contendo o valor medido para o teste (ex: "4.71", "99", "170").
    *   \`"unidade"\`: Uma string para a unidade de medida (ex: "milhões/mm³", "mg/dL"). Se a unidade não for encontrada, use "--".
    *   \`"valorReferencia"\`: Uma string para o intervalo ou valor de referência (ex: "4.50 - 5.90", "< 100", "< 190"). Se não for encontrado, use "--".

2.  **\`anotacao\`**: Esta chave deve conter uma **string** com um resumo e uma análise geral dos resultados. A análise deve ser concisa, informativa e destacar quaisquer resultados que estejam fora dos valores de referência.

**Certifique-se de que a saída seja um JSON válido e siga estritamente a estrutura descrita.**

Texto do Exame para Análise:
\`\`\`
${texto}
\`\`\``;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const jsonResponse = response.choices[0]?.message?.content;
        if (!jsonResponse) {
             return { resultados: [], anotacao: "A IA não retornou conteúdo." };
        }

        const parsedResponse = JSON.parse(jsonResponse);
        return parseIaResponse(parsedResponse);

    } catch (error: unknown) {
        console.error("Erro na análise da IA:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar a resposta da IA.";
        return { resultados: [], anotacao: `Erro ao processar a resposta da IA: ${errorMessage}` };
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
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
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
        return NextResponse.json({ error: "Tipo de arquivo não suportado" }, { status: 415 });
    }

    if (!textoExtraido.trim()) {
      return NextResponse.json({ error: "Nenhum texto extraído do arquivo." }, { status: 500 });
    }

    const analiseIA = await analisarTextoDeExameComIA(textoExtraido);

    return NextResponse.json({ ...analiseIA });

  } catch (error: unknown) {
    console.error("Erro geral no handler POST:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro interno desconhecido.";
    return NextResponse.json({ error: `Erro interno no servidor: ${errorMessage}` }, { status: 500 });
  }
}
