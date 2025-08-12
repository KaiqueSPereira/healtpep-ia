import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/_lib/prisma'; // Adjust the import path as necessary

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const searchTerm = searchParams.get('term');

    if (!searchTerm) {
      return NextResponse.json([], { status: 200 });
    }

    const tratamentos = await prisma.tratamento.findMany({
      where: {
        nome: {
          contains: searchTerm,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      // Include related Consultas and Exames directly in the Treatment query
      // This assumes your Prisma schema has defined relationships named 'consultas' and 'exames'
      // on the Tratamento model.
      include: {
        // Assuming 'consultas' is the relation name on Tratamento model
        consultas: {
           // Optionally include professional on related consultations if needed for display
           include: {
              profissional: true, // Assuming 'profissional' relation exists on Consulta model
           }
        },
        // Assuming 'exames' is the relation name on Tratamento model
        exames: {
           // Optionally include professional on related exams if needed for display
            include: {
               profissional: true, // Assuming 'profissional' relation exists on Exame model
            }
        },
      },
    });

    // Return a combined response structure
    // The found treatments already contain the nested consultations and exames
    return NextResponse.json(tratamentos, { status: 200 });
  } catch (error) {
    console.error('Error searching tratamentos:', error);
    return NextResponse.json({ error: 'Failed to search tratamentos' }, { status: 500 });
  }
}