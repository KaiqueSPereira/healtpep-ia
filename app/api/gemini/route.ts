import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { resultados } = await req.json();

    if (!resultados) {
      return NextResponse.json({ error: 'Resultados não fornecidos' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Chave da API do Gemini não configurada' }, { status: 500 });
    }

    const prompt = `Analisar os seguintes resultados de exame de sangue: ${resultados}`;

    const geminiRequest = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const geminiResponse = await geminiRequest.json();

    if (
      geminiResponse.candidates &&
      geminiResponse.candidates[0] &&
      geminiResponse.candidates[0].content &&
      geminiResponse.candidates[0].content.parts &&
      geminiResponse.candidates[0].content.parts[0] &&
      geminiResponse.candidates[0].content.parts[0].text
    ) {
      const analise = geminiResponse.candidates[0].content.parts[0].text;
      return NextResponse.json({ analise });
    } else {
      return NextResponse.json({ error: 'Erro na análise da IA' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro na comunicação com a API do Gemini:', error);
    return NextResponse.json(
      { error: 'Erro na comunicação com a API do Gemini' },
      { status: 500 }
    );
  }
}