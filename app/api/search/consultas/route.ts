import { NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma'; // Adjust the import path as necessary

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('term');

  if (!searchTerm) {
    return NextResponse.json([]); // Return empty array if no search term
  }

  try {
    const consultas = await prisma.consultas.findMany({
      where: {
        OR: [
            // Removed 'tipo' search as it's likely an Enum and doesn't support 'contains'
          {
            profissional: { // Assuming 'profissional' is the relation field name
              nome: {
                contains: searchTerm,
                mode: 'insensitive', // Case-insensitive search
              },
            },
          },
        ],
      },
      // Optionally include related data like professional name for display
      include: {
        profissional: {
          select: {
            nome: true,
          },
        },
      },
    });

    // Format the response if needed (e.g., flatten professional name)
    const formattedConsultas = consultas.map(consulta => ({
 ...consulta,
        profissionalNome: consulta.profissional?.nome || 'Desconhecido' // Add professional name
    }));


    return NextResponse.json(formattedConsultas);

  } catch (error) {
    console.error("Error searching consultas:", error);
    return NextResponse.json({ error: "Failed to search consultas" }, { status: 500 });
  }
}