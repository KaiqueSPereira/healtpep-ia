import { prisma } from '@/app/_lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// --- Funções de Criptografia ---
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Chave de encriptação tem de ser uma string de 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL_ERROR: A variável de ambiente ENCRYPTION_KEY tem de ser definida com 32 caracteres em produção.');
  } else {
    console.warn('AVISO: ENCRYPTION_KEY não definida ou inválida. Usando uma chave de fallback insegura para desenvolvimento.');
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
  }
}

// Assegura que a chave é uma string para as funções crypto
const key = process.env.ENCRYPTION_KEY as string;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Falha ao decriptar, retornando valor original.", error);
    return text;
  }
}
// --- Fim das Funções de Criptografia ---

// Zod schema para validação da criação
const condicaoCreateSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório.'),
  userId: z.string().min(1, 'O ID do usuário é obrigatório.'),
  dataInicio: z.string().optional(), // Adicionado para validação
});

// GET handler para buscar e DECRIPTAR condições
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'O ID do usuário é obrigatório.' }, { status: 400 });
    }

    const condicoes = await prisma.condicaoSaude.findMany({
      where: { userId: userId },
      orderBy: { nome: 'asc' },
    });

    // Decripta os dados antes de os enviar para o cliente
    const decryptedCondicoes = condicoes.map(cond => ({
      ...cond,
      nome: decrypt(cond.nome),
    }));

    return NextResponse.json(decryptedCondicoes, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar condições de saúde:", error);
    return NextResponse.json({ error: 'Falha ao buscar condições de saúde' }, { status: 500 });
  }
}

// POST handler para criar e ENCRIPTAR condições
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = condicaoCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nome, userId } = validation.data;

    // Encripta o dado sensível antes de o guardar
    const encryptedNome = encrypt(nome);

    const newCondicao = await prisma.condicaoSaude.create({
      data: {
        nome: encryptedNome,
        userId: userId,
        dataInicio: new Date(), // CORREÇÃO: Adiciona o campo obrigatório
      },
    });

    // Decripta o nome antes de o devolver como confirmação
    const decryptedResponse = {
        ...newCondicao,
        nome: decrypt(newCondicao.nome)
    };

    return NextResponse.json(decryptedResponse, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar condição de saúde:", error);
    return NextResponse.json({ error: 'Falha ao criar condição de saúde' }, { status: 500 });
  }
}
