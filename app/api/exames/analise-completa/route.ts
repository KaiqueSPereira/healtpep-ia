// app/api/exames/analise-completa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import OpenAI from "openai";
import { encryptString, decryptString } from "@/app/_lib/crypto";

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORREÇÃO: Definir tipos locais que correspondem exatamente aos dados do Prisma,
// incluindo a possibilidade de valores nulos.
interface LocalResultadoExame {
    id: string;
    nome: string;
    valor: string;
    unidade: string | null; // Permite que unidade seja nula
    referencia: string | null; // Permite que referencia seja nula
}

interface LocalTratamento {
    nome: string;
}

// Função para calcular a idade a partir da data de nascimento
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

// A função principal que será chamada para gerar a análise
async function analisarExame(examId: string, userId: string): Promise<string | null> {
  try {
    // 1. Buscar todos os dados relevantes do banco de dados
    const exame = await prisma.exame.findUnique({
      where: { id: examId, userId: userId },
      include: {
        resultados: true,
        usuario: {
          include: {
            dadosSaude: true,
            condicoesSaude: true,
            historicoPeso: {
              orderBy: { data: 'desc' },
              take: 1
            }
          }
        },
        consulta: true 
      }
    });

    if (!exame || !exame.usuario) {
      console.error("Exame ou usuário não encontrado para análise.");
      return null;
    }

    // 2. Descriptografar e formatar os dados para o prompt
    // Usa o tipo local correto agora
    const resultadosFormatados = exame.resultados.map((r: LocalResultadoExame) => {
        const nome = r.nome ? decryptString(r.nome) : "";
        const valor = r.valor ? decryptString(r.valor) : "";
        const unidade = r.unidade ? decryptString(r.unidade) : "";
        const referencia = r.referencia ? decryptString(r.referencia) : "N/A";
        return `- ${nome || 'N/A'}: ${valor || 'N/A'} ${unidade || ''} (Ref: ${referencia || 'N/A'})`;
    }).join('\n');

    const dadosSaude = exame.usuario.dadosSaude;
    const idade = dadosSaude?.dataNascimento ? calcularIdade(dadosSaude.dataNascimento) : 'Não informado';
    const sexo = dadosSaude?.sexo || 'Não informado';
    const peso = exame.usuario.historicoPeso[0]?.peso ? `${exame.usuario.historicoPeso[0].peso} kg` : 'Não informado';
    
    // Usa o tipo local correto agora
    const tratamentosAtuais = exame.usuario.condicoesSaude.map((t: LocalTratamento) => `- ${t.nome}`).join('\n') || "Nenhum";

    let consultaInfo = "Nenhuma consulta diretamente vinculada a este exame.";
    if (exame.consulta) {
        const dataConsulta = new Date(exame.consulta.data).toLocaleDateString("pt-BR");
        const queixas = exame.consulta.motivo || 'Não informado';
        consultaInfo = `
      - Data da Consulta: ${dataConsulta}
      - Tipo de Consulta: ${exame.consulta.tipo || 'Não informado'}
      - Queixas do Paciente na Consulta: ${queixas}
    `;
    }

    const anotacaoExame = exame.anotacao ? decryptString(exame.anotacao) : "Nenhuma anotação fornecida.";

    // 3. Construir o prompt detalhado para a IA
    const prompt = `
      Por favor, analise os seguintes resultados de exame para um paciente. Forneça uma análise clara e concisa em português, destacando quaisquer resultados que estejam fora do padrão e explicando sua possível significância clínica de forma geral. 
      A análise não deve ser um diagnóstico, mas sim um resumo informativo para auxiliar o usuário/paciente a passar informações para o profissional de saúde. Leve em consideração todos os dados fornecidos: dados do paciente, contexto da consulta e as 
      anotações do próprio usuário, para uma análise mais precisa e contextualizada.

      **Dados do Paciente:**
      - Idade: ${idade} anos
      - Sexo: ${sexo}
      - Peso: ${peso}
      - Tratamentos Atuais: 
      ${tratamentosAtuais}

      **Contexto da Consulta Vinculada ao Exame:**
      ${consultaInfo}

      **Anotações do Usuário sobre o Exame:**
      ${anotacaoExame}

      **Resultados do Exame:**
      ${resultadosFormatados}

      **Formato da Resposta:**
      Gere um parágrafo de texto corrido com a análise. Comece com uma visão geral e depois detalhe os pontos importantes. Seja objetivo e use uma linguagem que um leigo possa entender, mas que seja clinicamente relevante.
    `;

    // 4. Chamar a API da OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const analiseGerada = response.choices[0]?.message?.content;

    if (!analiseGerada) {
      console.error("Resposta da IA para análise completa estava vazia.");
      return null;
    }

    // 5. Salvar a análise no banco de dados
    await prisma.exame.update({
      where: { id: examId },
      data: {
        analiseIA: encryptString(analiseGerada)
      }
    });
    
    console.log(`Análise de IA gerada e salva para o exame ${examId}.`);
    return analiseGerada;

  } catch (error) {
    console.error(`Erro ao gerar ou salvar análise de IA para o exame ${examId}:`, error);
    return null;
  }
}

// Rota da API POST para acionar a análise
export async function POST(req: NextRequest) {
  console.log("--- Início do POST em /api/exames/analise-completa ---");
  
  try {
    const { examId, userId } = await req.json();

    if (!examId || !userId) {
      return NextResponse.json({ error: "examId e userId são obrigatórios" }, { status: 400 });
    }

    const analise = await analisarExame(examId, userId);

    if (!analise) {
        return NextResponse.json({ error: "Falha ao gerar a análise do exame." }, { status: 500 });
    }

    console.log("--- Fim do POST em /api/exames/analise-completa ---");
    return NextResponse.json({ analysis: analise });

  } catch (error) {
    console.error("Erro geral no handler POST de analise-completa:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
