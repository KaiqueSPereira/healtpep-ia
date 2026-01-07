import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { safeDecrypt } from '@/app/_lib/crypto';

// Tipos para a resposta da API RxNorm
interface SimpleInteraction {
    medicamentoA: string;
    medicamentoB: string;
    gravidade: string;
    descricao: string;
}

interface RxNormInteractionData {
    nlmDisclaimer?: string;
    fullInteractionTypeGroup?: {
        fullInteractionType: {
            interactionPair: {
                interactionConcept: {
                    sourceConceptItem: {
                        name: string;
                    };
                }[];
                severity: string;
                description: string;
            }[];
        }[];
    }[];
}


// Função principal do endpoint GET
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse('Não autorizado', { status: 401 });
    }

    try {
        const medicamentosCriptografados = await db.medicamento.findMany({
            where: {
                userId: session.user.id,
                status: 'Ativo',
                principioAtivo: { not: null },
            },
            select: { principioAtivo: true }
        });

        if (medicamentosCriptografados.length < 1) {
            return NextResponse.json({ interactions: [], message: 'Você precisa de pelo menos um medicamento ativo para verificar as interações.' });
        }

        const decryptedPrinciples = medicamentosCriptografados
            .map(med => med.principioAtivo ? safeDecrypt(med.principioAtivo) : null)
            .filter(Boolean) as string[];

        const rxcuiPromises = decryptedPrinciples.flatMap(pa => 
            pa.split('+').map(p => p.trim())
        ).map(async (principlePart) => {
            const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(principlePart)}&maxEntries=1`;
            try {
                const response = await fetch(url);
                if (!response.ok) return null;
                const data = await response.json();
                return data.approximateGroup?.candidate?.[0]?.rxcui || null;
            } catch { // _e removido
                return null;
            }
        });

        const rxcuiList = (await Promise.all(rxcuiPromises)).filter(Boolean);
        const uniqueRxcuiList = [...new Set(rxcuiList)];

        if (uniqueRxcuiList.length < 2) {
             return NextResponse.json({ interactions: [], message: 'Não foi possível encontrar códigos de referência suficientes para verificar interações. Verifique a grafia dos princípios ativos.' });
        }
        
        const interactionUrl = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${uniqueRxcuiList.join('+')}`;
        const interactionResponse = await fetch(interactionUrl);
        
        let interactionData: RxNormInteractionData = {}; // Corrigido de 'any' para o tipo específico
        const interactions: SimpleInteraction[] = [];

        const responseText = await interactionResponse.text();

        if (interactionResponse.ok && !responseText.toLowerCase().includes('not found') && responseText.startsWith('{')) {
            try {
                interactionData = JSON.parse(responseText);

                if (interactionData.fullInteractionTypeGroup) {
                    for (const group of interactionData.fullInteractionTypeGroup) {
                        for (const type of group.fullInteractionType) {
                            for (const pair of type.interactionPair) {
                                if (pair.interactionConcept.length === 2) {
                                    interactions.push({
                                        medicamentoA: pair.interactionConcept[0].sourceConceptItem.name,
                                        medicamentoB: pair.interactionConcept[1].sourceConceptItem.name,
                                        gravidade: pair.severity,
                                        descricao: pair.description,
                                    });
                                }
                            }
                        }
                    }
                }
            } catch(e) {
                console.error('Falha ao fazer parse da resposta de interação:', e, responseText);
            }
        }

        const message = interactions.length === 0 ? "Nenhuma interação medicamentosa encontrada entre seus medicamentos ativos." : "";

        return NextResponse.json({ interactions, disclaimer: interactionData.nlmDisclaimer || "", message });

    } catch (error) {
        console.error("Erro interno ao processar interações:", error);
        return new NextResponse('Erro interno do servidor', { status: 500 });
    }
}
