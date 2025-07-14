import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        CNS: true,
        tipoSanguineo: true,
        sexo: true,
        dataNascimento: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Crie uma cópia do objeto user para converter o BigInt antes de retornar
    const userResponse = {
      ...user,
      CNS: user.CNS ? user.CNS.toString() : null, // Converte BigInt para String
    };

    return NextResponse.json(userResponse, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const data = await request.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        CNS: data.CNS ? BigInt(data.CNS) : null, // Converter de volta para BigInt
        tipoSanguineo: data.tipoSanguineo,
        sexo: data.sexo,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null, // Converter de volta para Date
        // Adicione outros campos que você deseja atualizar
      },
    });

      // Crie uma cópia do objeto updatedUser para converter o BigInt antes de retornar
      const userResponse = {
        ...updatedUser,
        CNS: updatedUser.CNS ? updatedUser.CNS.toString() : null, // Converte BigInt para String
      };

      // Retorne a cópia modificada
      return NextResponse.json(userResponse);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ message: "Erro ao atualizar usuário" }, { status: 500 });
  }
}
