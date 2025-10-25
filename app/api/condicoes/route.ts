import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// --- Funções de Criptografia (Ultra-Robustas) ---
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL_ERROR: A variável de ambiente ENCRYPTION_KEY tem de ser definida com 32 caracteres em produção.');
  } else {
    console.warn('AVISO: ENCRYPTION_KEY não definida ou inválida. Usando uma chave de fallback insegura para desenvolvimento.');
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
  }
}

const key = process.env.ENCRYPTION_KEY as string;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string | null | undefined): string {
    // 1. Retorna imediatamente se o valor for nulo, indefinido ou não for uma string.
    if (typeof text !== 'string' || !text.includes(':')) {
        return text || '';
    }

    const textParts = text.split(':');
    const ivHex = textParts.shift();
    const encryptedHex = textParts.join(':');
    const hexRegex = /^[0-9a-fA-F]+$/;

    // 2. Validação rigorosa da estrutura e do conteúdo.
    // Verifica se o IV e o texto encriptado existem, se o IV tem o tamanho correto,
    // e se ambos contêm apenas caracteres hexadecimais.
    if (!ivHex || ivHex.length !== IV_LENGTH * 2 || !hexRegex.test(ivHex) || !hexRegex.test(encryptedHex)) {
        console.warn(`Valor suspeito de não estar encriptado ou corrompido foi detectado. Retornando valor original: "${text}"`);
        return text;
    }

    // 3. Tentativa de desencriptação apenas se todas as validações passarem.
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error(`Falha crítica ao decriptar um valor que parecia válido: "${text}"`, error);
        return text; // Retorna o texto original como último recurso.
    }
}
// --- Fim das Funções de Criptografia ---

const condicaoCreateSchema = z.object({
  userId: z.string().min(1, 'O ID do usuário é obrigatório.'),
  nome: z.string().min(2, "O nome da condição é obrigatório."),
  dataInicio: z.coerce.date({ required_error: "A data de início é obrigatória." }),
  cidCodigo: z.string().optional(),
  cidDescricao: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    const condicoes = await prisma.condicaoSaude.findMany({
      where: { userId: userId },
      orderBy: { dataInicio: 'desc' },
    });

    const decryptedCondicoes = condicoes.map(cond => ({
      ...cond,
      nome: decrypt(cond.nome),
      observacoes: decrypt(cond.observacoes),
    }));

    return NextResponse.json(decryptedCondicoes, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar condições de saúde:", error);
    return NextResponse.json({ error: 'Falha ao buscar condições de saúde' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = condicaoCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { userId, nome, dataInicio, cidCodigo, cidDescricao, observacoes } = validation.data;

    const encryptedNome = encrypt(nome);
    const encryptedObservacoes = observacoes ? encrypt(observacoes) : undefined;

    const newCondicao = await prisma.condicaoSaude.create({
      data: {
        userId,
        nome: encryptedNome,
        dataInicio,
        cidCodigo,
        cidDescricao,
        observacoes: encryptedObservacoes,
      },
    });

    const decryptedResponse = {
        ...newCondicao,
        nome: decrypt(newCondicao.nome),
        observacoes: decrypt(newCondicao.observacoes),
    };

    return NextResponse.json(decryptedResponse, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar condição de saúde:", error);
    return NextResponse.json({ error: 'Falha ao criar condição de saúde' }, { status: 500 });
  }
}