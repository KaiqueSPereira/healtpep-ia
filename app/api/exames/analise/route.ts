import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import OpenAI from "openai"; // Importar a biblioteca OpenAI

export const dynamic = "force-dynamic"; // necessário para lidar com arquivos

// Inicializar o cliente OpenAI com a API Key da variável de ambiente
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Certifique-se de configurar OPENAI_API_KEY nas variáveis de ambiente do Firebase Studio
});


// Função original para extrair exames com regex (manteremos por enquanto como fallback ou para comparação)
function extrairExamesDeTextoRegex(texto: string) {
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

// Nova função para extrair exames usando IA
async function extrairExamesDeTextoComIA(texto: string): Promise<{ nome: string; valor: string; unidade: string; valorReferencia: string }[]> {
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
      model: "gpt-4o-mini", // Você pode escolher um modelo diferente dependendo da sua necessidade e custo
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, // Solicita a resposta em formato JSON
      temperature: 0, // Temperatura baixa para respostas mais previsíveis
    });

    const jsonResponse = response.choices[0]?.message?.content;

    if (!jsonResponse) {
      console.error("Resposta da IA vazia.");
      return [];
    }

    try {
        // A resposta da IA deve ser um objeto JSON com uma chave que contém o array de exames
        // Precisamos analisar a resposta para encontrar o array correto.
        // Por exemplo, a IA pode retornar algo como: { "exames": [...] }
        const parsedResponse = JSON.parse(jsonResponse);

        // Vamos procurar por um array na resposta.
        for (const key in parsedResponse) {
            if (Array.isArray(parsedResponse[key])) {
                 // Validar se os objetos dentro do array têm a estrutura esperada
                 const resultadosValidos = parsedResponse[key].filter((item: any) =>
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
        // Tentar extrair o array JSON da string, caso a IA não retorne um objeto JSON diretamente
        const jsonMatch = jsonResponse.match(/\[\s*\{.*?\}\s*\]/s);
        if (jsonMatch && jsonMatch[0]) {
             try {
                 const fallbackParsed = JSON.parse(jsonMatch[0]);
                 const resultadosValidos = fallbackParsed.filter((item: any) =>
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

        return []; // Retorna array vazio se não conseguir extrair JSON
    }


  } catch (error) {
    console.error("Erro ao chamar API da IA:", error);
    return []; // Retorna array vazio em caso de erro na API
  }
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
      const worker = await createWorker("por"); // Use "por" para português
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

    // Usar a função com IA para extrair os exames
    const examesExtraidosPelaIA = await extrairExamesDeTextoComIA(textoExtraido);

    // Retorna os resultados da IA. Se a IA não encontrar nada, retorna um array vazio.
    // Você pode adicionar uma lógica aqui para tentar a extração com regex se a IA falhar, se desejar.
    return NextResponse.json({
      resultados: examesExtraidosPelaIA,
      // Pode ajustar a anotação para incluir o texto completo ou uma parte dele
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