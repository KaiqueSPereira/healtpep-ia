import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { encryptString, safeDecrypt } from '@/app/_lib/crypto';

export async function GET(
 request: NextRequest,
 { params = {} }: { params?: { id?: string } } = {}) {
  const userId = params.id;

  console.log('userId:', userId);

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        dadosSaude: true,
      },
    });



    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userResponse = {
      ...user,
 dadosSaude: user.dadosSaude ? {
        ...user.dadosSaude,
 CNS: user.dadosSaude.CNS ? safeDecrypt(user.dadosSaude.CNS) : null,
 tipoSanguineo: user.dadosSaude.tipoSanguineo ? safeDecrypt(user.dadosSaude.tipoSanguineo) : null,
 sexo: user.dadosSaude.sexo ? safeDecrypt(user.dadosSaude.sexo) : null,
 dataNascimento: user.dadosSaude.dataNascimento ? safeDecrypt(user.dadosSaude.dataNascimento) : null,
 altura: user.dadosSaude.altura ? parseFloat(safeDecrypt(user.dadosSaude.altura)) : null,
 } : null,
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

  const { CNS, tipoSanguineo, sexo, dataNascimento, altura } = data.dadosSaude || {}; // Corrigido para desestruturar de data.dadosSaude

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dadosSaude: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updatedDadosSaude = user.dadosSaude;

    if (user.dadosSaude) {
      updatedDadosSaude = await prisma.dadosSaude.update({
        where: { id: user.dadosSaude.id },
        data: {
          CNS: CNS ? encryptString(CNS) : null,
          tipoSanguineo: tipoSanguineo ? encryptString(tipoSanguineo) : null,
          sexo: sexo ? encryptString(sexo) : null,
          dataNascimento: dataNascimento ? encryptString(dataNascimento) : null,
          altura: altura ? encryptString(altura.toString()) : null,
        },
      });
      
    } else if (CNS || tipoSanguineo || sexo || dataNascimento || altura) {
      
      updatedDadosSaude = await prisma.dadosSaude.create({
        data: {
          userId: userId,
          CNS: CNS ? encryptString(CNS) : null,
          tipoSanguineo: tipoSanguineo ? encryptString(tipoSanguineo) : null,
          sexo: sexo ? encryptString(sexo) : null,
          dataNascimento: dataNascimento ? encryptString(dataNascimento) : null,
          altura: altura ? encryptString(altura.toString()) : null,
        },
      });
      
    } 

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        image: data.image,
      },
    });
   
    // Crie uma cópia do objeto updatedUser para converter o BigInt antes de retornar
    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      dadosSaude: updatedDadosSaude ? {
        ...updatedDadosSaude,
        CNS: updatedDadosSaude.CNS ? safeDecrypt(updatedDadosSaude.CNS) : null,
        tipoSanguineo: updatedDadosSaude.tipoSanguineo ? safeDecrypt(updatedDadosSaude.tipoSanguineo) : null,
        sexo: updatedDadosSaude.sexo ? safeDecrypt(updatedDadosSaude.sexo) : null,
        dataNascimento: updatedDadosSaude.dataNascimento ? safeDecrypt(updatedDadosSaude.dataNascimento) : null,
        altura: updatedDadosSaude.altura ? parseFloat(safeDecrypt(updatedDadosSaude.altura)) : null,
      } : null,
    };

   
    return NextResponse.json(userResponse);
  } catch (error) {
    return NextResponse.json({ message: "Erro ao atualizar usuário" }, { status: 500 });
  }
}
