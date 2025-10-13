
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

function parseIaResponse(iaObject: any): IaResponse {
    const resultadosFinais: ExameResultado[] = [];
    const anotacao = iaObject.anotacao || "";

    if (Array.isArray(iaObject.resultados)) {
        for (const mainSection of iaObject.resultados) {
            const examesContainer = mainSection.exames;
            if (typeof examesContainer !== 'object' || examesContainer === null) continue;

            for (const subSectionName in examesContainer) {
                if (Object.prototype.hasOwnProperty.call(examesContainer, subSectionName)) {
                    const subSectionObject = examesContainer[subSectionName];
                    if (typeof subSectionObject !== 'object' || subSectionObject === null) continue;

                    for (const examName in subSectionObject) {
                        if (Object.prototype.hasOwnProperty.call(subSectionObject, examName)) {
                            const examDetails = subSectionObject[examName];
                            
                            if (typeof examDetails === 'object' && examDetails !== null && 'valor' in examDetails) {
                                const valor = String(examDetails.valor || '');
                                const valorReferencia = String(examDetails.referencia || '');
                                const unidade = determinarUnidade(valor, valorReferencia);

                                resultadosFinais.push({
                                    nome: examName.charAt(0).toUpperCase() + examName.slice(1).toLowerCase().replace(/_/g, ' '),
                                    valor: valor,
                                    unidade: unidade,
                                    valorReferencia: valorReferencia,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    return { resultados: resultadosFinais, anotacao };
}

async function analisarTextoDeExameComIA(texto: string, tipo: string): Promise<IaResponse> {
    const prompt = `Analise o texto e retorne um JSON. O objeto DEVE ter duas chaves: "resultados" e "anotacao".
1. "resultados": DEVE ser um ARRAY. Cada item no array representa uma seção principal (ex: "URINA I") e deve ter DUAS chaves: "secao" (o nome da seção) e "exames".
2. O valor de "exames" DEVE ser um OBJETO. As chaves deste objeto são as sub-seções (ex: "ANÁLISE QUÍMICA").
3. O valor de cada sub-seção DEVE ser um OBJETO. As chaves deste objeto são os nomes dos testes (ex: "COR", "DENSIDADE").
4. O valor de cada teste DEVE ser um OBJETO com as chaves "valor" e "referencia".

Texto:
"${texto}"`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const jsonResponse = response.choices[0]?.message?.content;
        if (!jsonResponse) return { resultados: [], anotacao: texto };

        const parsedResponse = JSON.parse(jsonResponse);
        return parseIaResponse(parsedResponse);

    } catch (error) {
        console.error("Erro na análise da IA:", error);
        return { resultados: [], anotacao: "Erro ao processar a resposta da IA." };
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
    const tipoExame = formData.get("tipo") as string | null;

    if (!file || !tipoExame) {
      return NextResponse.json({ error: "Arquivo e tipo são obrigatórios" }, { status: 400 });
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
      return NextResponse.json({ error: "Nenhum texto extraído" }, { status: 500 });
    }

    const analiseIA = await analisarTextoDeExameComIA(textoExtraido, tipoExame);

    return NextResponse.json({ ...analiseIA });

  } catch (error) {
    console.error("Erro geral no handler POST:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
