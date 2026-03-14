
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { getPermissionsForUser } from '@/app/_lib/auth/permission-checker';
import { logAction } from '@/app/_lib/logger';
import { decryptString, encryptString } from '@/app/_lib/crypto';
import { AcompanhamentoCorporal, Bioimpedancia, Prisma } from '@prisma/client';

const decryptItems = <T extends { id: unknown }>(items: T[], fields: (keyof T)[]): T[] => {
  return items.map(item => {
    const decryptedItem = { ...item };
    for (const field of fields) {
      const value = item[field];
      if (typeof value === 'string' && value) {
        try {
          decryptedItem[field] = decryptString(value) as T[keyof T];
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          console.warn(`Falha ao descriptografar campo ${String(field)} para o item ${item.id}. Mantendo valor original. Erro: ${message}`);
        }
      }
    }
    return decryptedItem;
  });
};

const getParamIdFromRequest = (req: NextRequest): string => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    // Expected URL format: /api/users/[id]/medidas
    // Segments: ['', 'api', 'users', '[id]', 'medidas']
    return pathSegments[3];
};

export async function GET(req: NextRequest) {
    let userId: string | undefined;
    const paramId = getParamIdFromRequest(req);

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new Error("Não autorizado");
        }
        userId = session.user.id;

        if (userId !== paramId) {
            throw new Error("Não autorizado");
        }

        const acompanhamentos = await prisma.acompanhamentoCorporal.findMany({
            where: { userId: paramId },
            orderBy: { data: 'desc' },
        });

        const bioimpedancias = await prisma.bioimpedancia.findMany({
            where: { userId: paramId },
            orderBy: { data: 'desc' },
        });
        
        const decryptedAcompanhamentos = decryptItems<AcompanhamentoCorporal>(acompanhamentos, ['peso', 'imc', 'pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD']);
        const decryptedBioimpedancias = decryptItems<Bioimpedancia>(bioimpedancias, ['gorduraCorporal', 'massaMuscular', 'gorduraVisceral', 'taxaMetabolica', 'idadeCorporal', 'massaOssea', 'aguaCorporal']);

        return NextResponse.json({ acompanhamentos: decryptedAcompanhamentos, bioimpedancias: decryptedBioimpedancias });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        if (errorMessage !== "Não autorizado") {
            await logAction({
                userId,
                action: 'get_medidas_error',
                level: 'error',
                message: 'Erro ao buscar medidas',
                details: { error: errorMessage, params: { id: paramId } },
                component: 'medidas-api'
            });
        }
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Erro ao buscar medidas: ${errorMessage}` }, { status });
    }
}

export async function POST(req: NextRequest) {
    let userId: string | undefined;
    const paramId = getParamIdFromRequest(req);

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new Error("Não autorizado");
        }
        userId = session.user.id;
        
        if (userId !== paramId) {
            throw new Error("Não autorizado");
        }

        const permissions = await getPermissionsForUser(userId);
        if (await permissions.hasReachedLimit('medidas')) {
            return NextResponse.json({ error: "Você atingiu o limite de registros de medidas para o seu plano." }, { status: 403 });
        }

        const body = await req.json();
        const { data, ...medidas } = body;

        if (medidas.peso) {
            const userWithHealthData = await prisma.user.findUnique({
                where: { id: userId },
                include: { dadosSaude: true },
            });

            if (userWithHealthData?.dadosSaude?.altura) {
                try {
                    const heightValue = parseFloat(decryptString(userWithHealthData.dadosSaude.altura));
                    if (heightValue > 0) {
                        const heightInMeters = heightValue >= 3 ? heightValue / 100 : heightValue;
                        const weightKg = parseFloat(medidas.peso);
                        if (weightKg > 0) {
                            medidas.imc = (weightKg / (heightInMeters * heightInMeters)).toFixed(2);
                        }
                    }
                } catch (e: unknown) {
                    console.error("Não foi possível calcular o IMC.", e);
                }
            }
        }

        const acompanhamentoFields: (keyof Prisma.AcompanhamentoCorporalCreateInput)[] = ['peso', 'imc', 'pescoco', 'torax', 'cintura', 'quadril', 'bracoE', 'bracoD', 'pernaE', 'pernaD', 'pantE', 'pantD'];
        const bioimpedanciaFields: (keyof Prisma.BioimpedanciaCreateInput)[] = ['gorduraCorporal', 'massaMuscular', 'gorduraVisceral', 'taxaMetabolica', 'idadeCorporal', 'massaOssea', 'aguaCorporal'];
        
        const acompanhamentoData: Prisma.AcompanhamentoCorporalUncheckedCreateInput = { userId: paramId, data: new Date(data) };
        const bioimpedanciaData: Prisma.BioimpedanciaUncheckedCreateInput = { userId: paramId, data: new Date(data) };
        
        let hasAcompanhamentoData = false;
        let hasBioimpedanciaData = false;

        for (const key in medidas) {
            const value = medidas[key];
            if (value !== '' && value !== null && value !== undefined) {
                const encryptedValue = encryptString(String(value));
                if (acompanhamentoFields.includes(key as any)) {
                    (acompanhamentoData as Record<string, unknown>)[key] = encryptedValue;
                    hasAcompanhamentoData = true;
                }
                if (bioimpedanciaFields.includes(key as any)) {
                    (bioimpedanciaData as Record<string, unknown>)[key] = encryptedValue;
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

        await logAction({
            userId,
            action: 'create_medidas',
            level: 'info',
            message: 'Medidas adicionadas com sucesso',
            component: 'medidas-api'
        });

        return NextResponse.json({ message: 'Medidas adicionadas com sucesso' }, { status: 201 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';

        if (errorMessage !== "Não autorizado") {
            await logAction({
                userId,
                action: 'create_medidas_error',
                level: 'error',
                message: 'Erro ao criar medidas',
                details: { error: errorMessage, params: { id: paramId } },
                component: 'medidas-api'
            });
        }
        const status = errorMessage === "Não autorizado" ? 401 : 500;
        return NextResponse.json({ error: `Falha ao criar medidas: ${errorMessage}` }, { status });
    }
}
