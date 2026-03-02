import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/app/_lib/prisma';
import { decryptString, encryptString } from '@/app/_lib/crypto';

const getUserIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};

// Função para descriptografar uma lista de itens
const decryptItems = (items: any[], fields: string[]) => {
  return items.map(item => {
    const decryptedItem: { [key: string]: any } = { ...item };
    for (const field of fields) {
      if (typeof item[field] === 'string' && item[field]) {
        try {
          decryptedItem[field] = decryptString(item[field]);
        } catch (e: any) {
          console.warn(`Falha ao descriptografar campo ${field} para o item ${item.id}. Mantendo valor original. Erro: ${e.message}`);
          decryptedItem[field] = item[field]; 
        }
      }
    }
    return decryptedItem;
  });
};

export async function GET(req: NextRequest) {
  const userId = getUserIdFromUrl(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não encontrado na URL.' }, { status: 400 });
  }

  try {
    const acompanhamentos = await prisma.acompanhamentoCorporal.findMany({
      where: { userId },
      orderBy: { data: 'desc' },
    });

    const bioimpedancias = await prisma.bioimpedancia.findMany({
      where: { userId },
      orderBy: { data: 'desc' },
    });

    // Descriptografa os dados, AGORA INCLUINDO O IMC
    const decryptedAcompanhamentos = decryptItems(acompanhamentos, ['peso', 'imc', 'pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD']);
    const decryptedBioimpedancias = decryptItems(bioimpedancias, ['gorduraCorporal', 'massaMuscular', 'gorduraVisceral', 'taxaMetabolica', 'idadeCorporal', 'massaOssea', 'aguaCorporal']);

    return NextResponse.json({ acompanhamentos: decryptedAcompanhamentos, bioimpedancias: decryptedBioimpedancias });
  } catch (error) {
    console.error('Error fetching medidas:', error);
    return NextResponse.json({ error: 'Erro ao buscar medidas.' }, { status: 500 });
  }
}

// Criptografa os dados antes de salvar
const encryptData = (data: any) => {
    const encryptedData: { [key: string]: any } = {};
    for (const key in data) {
        if (typeof data[key] === 'string' && data[key] !== '') {
            encryptedData[key] = encryptString(data[key]);
        }
    }
    return encryptedData;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  const userId = getUserIdFromUrl(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não encontrado na URL.' }, { status: 400 });
  }

  if (!token || token.sub !== userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data, ...medidas } = body;

    const acompanhamentoFields = ['peso', 'pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD'];
    const bioimpedanciaFields = ['gorduraCorporal', 'massaMuscular', 'gorduraVisceral', 'taxaMetabolica', 'idadeCorporal', 'massaOssea', 'aguaCorporal'];

    const acompanhamentoData: any = { userId, data: new Date(data) };
    const bioimpedanciaData: any = { userId, data: new Date(data) };

    let hasAcompanhamentoData = false;
    let hasBioimpedanciaData = false;

    for (const key in medidas) {
        if (medidas[key] !== '' && medidas[key] !== null) {
            const encryptedValue = encryptString(medidas[key]);
            if (acompanhamentoFields.includes(key)) {
                acompanhamentoData[key] = encryptedValue;
                hasAcompanhamentoData = true;
            }
            if (bioimpedanciaFields.includes(key)) {
                bioimpedanciaData[key] = encryptedValue;
                hasBioimpedanciaData = true;
            }
        }
    }

    if (hasAcompanhamentoData) {
        await prisma.acompanhamentoCorporal.create({ data: acompanhamentoData });
    }

    if (hasBioimpedanciaData) {
        await prisma.bioimpedancia.create({ data: bioimpedanciaData });
    }

    return NextResponse.json({ message: 'Medidas adicionadas com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Error creating medidas:', error);
    return NextResponse.json({ error: 'Erro ao criar medidas.' }, { status: 500 });
  }
}
