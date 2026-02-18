
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { encryptString, safeDecrypt } from "@/app/_lib/crypto";
import { GoogleGenAI } from "@google/genai";
import { logErrorToDb } from "@/app/_lib/logger";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

interface LocalResultadoExame {
    id: string;
    nome: string;
    valor: string;
    unidade: string | null;
    referencia: string | null;
}

interface LocalTratamento {
    nome: string;
}

function calcularIdade(dataNascimento: string): number {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

async function analisarExame(examId: string, userId: string): Promise<string | null> {
  const componentName = "analisarExame_Gemini";
  try {
    const exame = await prisma.exame.findUnique({
      where: { id: examId, userId: userId },
      include: {
        resultados: true,
        usuario: {
          include: {
            dadosSaude: true,
            condicoesSaude: true,
            historicoPeso: { orderBy: { data: 'desc' }, take: 1 }
          }
        },
        consulta: true
      }
    });

    if (!exame || !exame.usuario) {
      await logErrorToDb("Exame ou usuário não encontrado para análise completa.", { examId, userId }, componentName);
      return null;
    }

    const resultadosFormatados = exame.resultados.map((r: LocalResultadoExame) => {
        const nome = safeDecrypt(r.nome);
        const valor = safeDecrypt(r.valor);
        const unidade = r.unidade ? safeDecrypt(r.unidade) : "";
        const referencia = r.referencia ? safeDecrypt(r.referencia) : "N/A";
        return `- ${nome || 'N/A'}: ${valor || 'N/A'} ${unidade || ''} (Ref: ${referencia || 'N/A'})`;
    }).join('\n');

    const dadosSaude = exame.usuario.dadosSaude;
    const idade = dadosSaude?.dataNascimento ? calcularIdade(dadosSaude.dataNascimento) : 'Não informado';
    const sexo = dadosSaude?.sexo || 'Não informado';
    const peso = exame.usuario.historicoPeso[0]?.peso ? `${exame.usuario.historicoPeso[0].peso} kg` : 'Não informado';
    
    const tratamentosAtuais = exame.usuario.condicoesSaude.map((t: LocalTratamento) => `- ${t.nome}`).join('\n') || "Nenhum";

    let consultaInfo = "Nenhuma consulta diretamente vinculada a este exame.";
    if (exame.consulta) {
        const dataConsulta = new Date(exame.consulta.data).toLocaleDateString("pt-BR");
        const queixas = exame.consulta.motivo ? safeDecrypt(exame.consulta.motivo) : 'Não informado';
        consultaInfo = `\n- Data da Consulta: ${dataConsulta}\n- Tipo de Consulta: ${exame.consulta.tipo || 'Não informado'}\n- Queixas do Paciente na Consulta: ${queixas}\n`;
    }

    const anotacaoExame = exame.anotacao ? safeDecrypt(exame.anotacao) : "Nenhuma anotação fornecida.";

    const prompt = `Por favor, analise os seguintes dados de um paciente e seus resultados de exame. Atue como um assistente de análise de saúde.
Forneça uma análise concisa em um único parágrafo de texto corrido em português.
A análise deve destacar quaisquer resultados que pareçam fora do padrão e explicar sua possível significância de forma geral, sem dar um diagnóstico. Considere todo o contexto fornecido.

**Dados do Paciente:**
- Idade: ${idade} anos
- Sexo: ${sexo}
- Peso: ${peso}
- Tratamentos Atuais: ${tratamentosAtuais}

**Contexto da Consulta:**${consultaInfo}

**Anotações sobre o Exame:**
${anotacaoExame}

**Resultados do Exame:**
${resultadosFormatados}

**Sua Resposta (APENAS o parágrafo de análise, sem títulos ou introduções):**`;

    // REVERTENDO PARA A CHAMADA ORIGINAL E FUNCIONAL DA API
    const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const analiseGerada = result.text?.trim() ?? "";

    if (!analiseGerada) {
      await logErrorToDb("Resposta da IA para análise completa estava vazia.", { examId }, componentName);
      return null;
    }

    await prisma.exame.update({
      where: { id: examId },
      data: { analiseIA: encryptString(analiseGerada) }
    });
    
    return analiseGerada;

  } catch (error) {
    await logErrorToDb(
        `Erro ao gerar ou salvar análise de IA para o exame ${examId}.`,
        error instanceof Error ? error.stack || error.message : String(error),
        componentName
    );
    return null;
  }
}

export async function POST(req: NextRequest) {
  const componentName = "API /api/exames/analise-completa";
  try {
    const { examId, userId } = await req.json();

    if (!examId || !userId) {
      return NextResponse.json({ error: "As informações necessárias para a análise não foram fornecidas." }, { status: 400 });
    }

    if (!process.env.GOOGLE_API_KEY) {
        await logErrorToDb("Chave da API do Google não configurada.", "A variável de ambiente GOOGLE_API_KEY não foi encontrada.", componentName);
        return NextResponse.json({ error: "O serviço de análise não está configurado corretamente." }, { status: 500 });
    }

    const analise = await analisarExame(examId, userId);

    if (!analise) {
        return NextResponse.json({ error: "Não foi possível gerar a análise para este exame. Verifique se os dados estão completos ou tente novamente mais tarde." }, { status: 500 });
    }

    return NextResponse.json({ analysis: analise });

  } catch (error) {
    await logErrorToDb(
        "Erro geral no handler POST de analise-completa.", 
        error instanceof Error ? error.stack || error.message : String(error), 
        componentName
    );
    return NextResponse.json({ error: "Ocorreu um erro inesperado no servidor ao solicitar a análise." }, { status: 500 });
  }
}
