import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/app/_lib/prisma';
import { decryptString, encryptString } from '@/app/_lib/crypto';

const getUserIdFromUrl = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 2];
};

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

    const decryptedAcompanhamentos = decryptItems(acompanhamentos, ['peso', 'imc', 'pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD']);
    const decryptedBioimpedancias = decryptItems(bioimpedancias, ['gorduraCorporal', 'massaMuscular', 'gorduraVisceral', 'taxaMetabolica', 'idadeCorporal', 'massaOssea', 'aguaCorporal']);

    return NextResponse.json({ acompanhamentos: decryptedAcompanhamentos, bioimpedancias: decryptedBioimpedancias });
  } catch (error) {
    console.error('Error fetching medidas:', error);
    return NextResponse.json({ error: 'Erro ao buscar medidas.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromUrl(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não encontrado na URL.' }, { status: 400 });
  }

  const token = await getToken({ req });
  if (!token || token.sub !== userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data, ...medidas } = body;

    if (medidas.peso) {
        const userComDadosSaude = await prisma.user.findUnique({
            where: { id: userId },
            include: { dadosSaude: true },
        });

        if (userComDadosSaude?.dadosSaude?.altura) {
            try {
                const alturaCriptografada = userComDadosSaude.dadosSaude.altura;
                const valorAltura = parseFloat(decryptString(alturaCriptografada));

                if (valorAltura > 0) {
                    // LÓGICA ROBUSTA: Verifica se a altura está em metros ou centímetros.
                    const alturaMetros = valorAltura >= 3 ? valorAltura / 100 : valorAltura;
                    const pesoKg = parseFloat(medidas.peso);

                    if (pesoKg > 0) {
                        const imc = pesoKg / (alturaMetros * alturaMetros);
                        medidas.imc = imc.toFixed(2);
                    }
                }
            } catch (e) {
                console.error("Não foi possível calcular o IMC.", e);
            }
        }
    }

    const acompanhamentoFields = ['peso', 'imc', 'pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD'];
    const bioimpedanciaFields = ['gorduraCorporal', 'massaMuscular', 'gorduraVisceral', 'taxaMetabolica', 'idadeCorporal', 'massaOssea', 'aguaCorporal'];

    const acompanhamentoData: any = { userId, data: new Date(data) };
    const bioimpedanciaData: any = { userId, data: new Date(data) };

    let hasAcompanhamentoData = false;
    let hasBioimpedanciaData = false;

    for (const key in medidas) {
        const valor = medidas[key];
        if (valor !== '' && valor !== null) {
            const encryptedValue = encryptString(String(valor));
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
     if (error instanceof Error) {
        return NextResponse.json({ error: 'Erro ao criar medidas.', details: error.message, code: (error as any).code }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erro ao criar medidas.' }, { status: 500 });
  }
}
