import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/_lib/auth';


// A mock function that simulates calling an external drug interaction API.
// In a real-world scenario, this would make an HTTP request to a service like
// the National Library of Medicine (NLM) API or a commercial drug database API.
async function checkDrugInteractions(activePrinciples: string[]): Promise<string[]> {
    console.log(`Checking interactions for: ${activePrinciples.join(', ')}`);

    // Mock data for potential interactions.
    const interactionDatabase: { [key: string]: string[] } = {
        'warfarin': ['ibuprofen', 'aspirin'],
        'ibuprofen': ['warfarin', 'aspirin'],
        'aspirin': ['warfarin', 'ibuprofen', 'lisinopril'],
        'lisinopril': ['aspirin'],
        'paracetamol': [],
    };

    const interactionsFound: string[] = [];
    const principlesToCheck = activePrinciples.map(p => p.toLowerCase());

    for (let i = 0; i < principlesToCheck.length; i++) {
        for (let j = i + 1; j < principlesToCheck.length; j++) {
            const principle1 = principlesToCheck[i];
            const principle2 = principlesToCheck[j];

            if (interactionDatabase[principle1]?.includes(principle2)) {
                const interactionMsg = `Interação potencial detectada entre ${principle1} e ${principle2}.`;
                if (!interactionsFound.includes(interactionMsg)) {
                    interactionsFound.push(interactionMsg);
                }
            }
        }
    }

    // Simulate network delay.
    await new Promise(resolve => setTimeout(resolve, 500));

    return interactionsFound;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        // CORRECTED: 'const' is used as 'interactions' is not reassigned.
        const activePrinciples: string[] = await req.json();

        if (!Array.isArray(activePrinciples) || activePrinciples.length < 2) {
            return NextResponse.json({ interactions: [] }); // No need to check if less than 2 drugs
        }

        const interactions = await checkDrugInteractions(activePrinciples);

        return NextResponse.json({ interactions });
    } catch (error) {
        console.error("Falha ao verificar interações medicamentosas:", error);
        // CORRECTED: Explicitly typed the error object.
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado';
        return NextResponse.json({ error: 'Erro Interno do Servidor', details: errorMessage }, { status: 500 });
    }
}
