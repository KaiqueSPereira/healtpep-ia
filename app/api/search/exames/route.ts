import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/_lib/prisma'; // Adjust the import path as necessary

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const term = searchParams.get('term');

    if (!term) {
      // Return an empty array or a specific response if no search term is provided
      return NextResponse.json([], { status: 200 });
    }

    // Perform the search in the database using Prisma
    const exames = await prisma.exame.findMany({
      where: {
        OR: [
          {
            tipo: {
              contains: term,
              mode: 'insensitive', // Case-insensitive search
            },
          },
          {
            profissional: { // Assuming a relation named 'profissional'
              nome: {
                contains: term,
                mode: 'insensitive', // Case-insensitive search
              },
            },
          },
        ],
      },
      include: {
        profissional: { // Include professional to return their name
          select: {
            nome: true,
          },
        },
      },
    });

    // Map the results to include the professional name for easier display
    const formattedExames = exames.map(exame => ({
        ...exame,
        profissionalNome: exame.profissional?.nome || null, // Include professional name or null
        profissional: undefined, // Remove the nested professional object if not needed
    }));


    // Return the matching exams as a JSON response
    return NextResponse.json(formattedExames, { status: 200 });

  } catch (error) {
    console.error("Error searching exams:", error);
    return NextResponse.json({ error: "Failed to search exams" }, { status: 500 });
  }
}