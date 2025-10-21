import { prisma } from '@/app/_lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Zod schema for input validation
const exameSchema = z.object({
  nome: z.string().min(1, 'O nome do exame é obrigatório.'),
  dataExame: z.string().transform((str) => new Date(str)), // Expecting ISO string from frontend
  horaExame: z.string().optional(), // Expecting time in HH:mm format
  tipo: z.string().optional(),
  userId: z.string(),
  profissionalId: z.string().optional(),
  unidadesId: z.string().optional(),
  condicaoSaudeId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Separate validation to handle the date/time combination
    const parsedBody = exameSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    // 2. Combine date and time into a single DateTime object
    const { dataExame, horaExame, ...restOfData } = parsedBody.data;

    if (horaExame) {
        const [hours, minutes] = horaExame.split(':').map(Number);
        dataExame.setHours(hours, minutes, 0, 0); // Set time on the date object
    }

    // 3. Create the exame record with the combined DateTime
    const newExame = await prisma.exame.create({
      data: {
        ...restOfData,
        dataExame: dataExame, // Use the updated Date object
      },
      include: {
        unidades: true,
        profissional: true,
      },
    });

    return NextResponse.json(newExame, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar exame:", error);
    return NextResponse.json({ error: 'Falha ao criar exame' }, { status: 500 });
  }
}
