import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import OpenAI from "openai";
import { encryptString, safeDecrypt } from "@/app/_lib/crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Função para obter o mimetype a partir do nome do arquivo
const getMimeType = (fileName: string): string | null => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return null;

    switch (extension) {
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'webp': return 'image/webp';
        // A OpenAI não suporta PDFs diretamente via image_url, mas pode ser útil para outras integrações
        case 'pdf': return 'application/pdf';
        default: return null;
    }
};


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
  try {
    // CORREÇÃO: Busca o Exame com seus campos escalares (incluindo arquivoExame)
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
      console.error("Exame ou usuário não encontrado para análise.");
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
        consultaInfo = `
      - Data da Consulta: ${dataConsulta}
      - Tipo de Consulta: ${exame.consulta.tipo || 'Não informado'}
      - Queixas do Paciente na Consulta: ${queixas}
    `;
    }

    const anotacaoExame = exame.anotacao ? safeDecrypt(exame.anotacao) : "Nenhuma anotação fornecida.";

    const textPrompt = `
      Por favor, analise os seguintes resultados de exame e quaisquer imagens anexadas para um paciente. Forneça uma análise clara e concisa em português, destacando quaisquer resultados que estejam fora do padrão e explicando sua possível significância clínica de forma geral. Se imagens ou documentos forem fornecidos, descreva o que você vê e relacione com os dados do exame.
      A análise não deve ser um diagnóstico, mas sim um resumo informativo para auxiliar o usuário/paciente a passar informações para o profissional de saúde. Leve em consideração todos os dados fornecidos para uma análise mais precisa e contextualizada.

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

      **Resultados do Exame (dados textuais):**
      ${resultadosFormatados}

      **Formato da Resposta:**
      Gere um parágrafo de texto corrido com a análise. Comece com uma visão geral e depois detalhe os pontos importantes. Seja objetivo e use uma linguagem que um leigo possa entender, mas que seja clinicamente relevante.
    `;

    const messageContent: (OpenAI.Chat.ChatCompletionContentPartText | OpenAI.Chat.ChatCompletionContentPartImage)[] = [
        { type: "text", text: textPrompt },
    ];

    // CORREÇÃO: Pega o anexo do próprio exame e o converte
    if (exame.arquivoExame && exame.nomeArquivo) {
        const mimetype = getMimeType(exame.nomeArquivo);
        // Apenas processa imagens que a API da OpenAI aceita
        if (mimetype && mimetype.startsWith('image/')) {
            const base64Image = (exame.arquivoExame as Buffer).toString('base64');
            const imageUrl = `data:${mimetype};base64,${base64Image}`;

            messageContent.push({
                type: "image_url",
                image_url: { "url": imageUrl },
            });
        }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: messageContent }],
      temperature: 0.2,
    });

    const analiseGerada = response.choices[0]?.message?.content;

    if (!analiseGerada) {
      console.error("Resposta da IA para análise completa estava vazia.");
      return null;
    }

    await prisma.exame.update({
      where: { id: examId },
      data: { analiseIA: encryptString(analiseGerada) }
    });
    
    console.log(`Análise de IA gerada e salva para o exame ${examId}.`);
    return analiseGerada;

  } catch (error) {
    console.error(`Erro ao gerar ou salvar análise de IA para o exame ${examId}:`, error);
    return null;
  }
}

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
