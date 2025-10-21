import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { z } from 'zod';
import { encryptString } from '@/app/_lib/crypto'; // Importa a função de encriptação

// Validação para o tipo de anexo
const anexoCreateSchema = z.object({
  tipo: z.enum(['Encaminhamento', 'Atestado_Declaracao', 'Receita_Medica', 'Relatorio', 'Outro']),
});

export async function POST(
  req: Request,
  { params }: { params: { consultaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const { consultaId } = params;
    if (!consultaId) {
      return new NextResponse('ID da Consulta não encontrado', { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tipo = formData.get('tipo') as string;

    if (!file) {
      return new NextResponse('Nenhum arquivo enviado', { status: 400 });
    }

    const validation = anexoCreateSchema.safeParse({ tipo });
    if (!validation.success) {
        return new NextResponse('Tipo de anexo inválido', { status: 400 });
    }

    // 1. Ler o ficheiro para um buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Encriptar o buffer
    // Para usar a função de encriptação baseada em string, convertemos o buffer para base64
    const fileBase64 = buffer.toString('base64');
    const encryptedFile = encryptString(fileBase64);

    // 3. Criar o registo na base de dados com o ficheiro encriptado
    const anexo = await db.anexoConsulta.create({
      data: {
        consultaId: consultaId,
        nomeArquivo: file.name, // Nome original do ficheiro
        arquivo: Buffer.from(encryptedFile), // Guarda o conteúdo encriptado como Bytes
        mimetype: file.type, // Guarda o tipo do ficheiro
        tipo: validation.data.tipo,
      },
      // Não devolve o conteúdo do ficheiro na resposta por segurança e performance
      select: {
        id: true,
        nomeArquivo: true,
        tipo: true,
        createdAt: true,
        consultaId: true,
      }
    });

    return NextResponse.json(anexo, { status: 201 });

  } catch (error) {
    console.error('[ANEXOS_POST]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
