
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs'; // CORREÇÃO: Módulo 'fs' importado usando a sintaxe ES6

// Validação para o corpo do pedido (multipart/form-data)
const anexoCreateSchema = z.object({
  tipo: z.enum(['ENCAMINHAMENTO', 'ATESTADO_DECLARACAO', 'RECEITA_MEDICA', 'RELATORIO', 'OUTRO']),
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

    // 1. Guardar o arquivo no sistema de ficheiros
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cria um nome de ficheiro único para evitar conflitos
    const fileExtension = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    // Caminho onde o ficheiro será guardado (dentro da pasta public)
    const uploadDir = path.join(process.cwd(), 'public/uploads/anexos');
    const filePath = path.join(uploadDir, fileName);

    // Certifique-se de que o diretório de upload existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // 2. Criar o registo na base de dados
    const publicUrl = `/uploads/anexos/${fileName}`;

    const anexo = await db.anexoConsulta.create({
      data: {
        consultaId: consultaId,
        nomeArquivo: file.name, // Nome original do ficheiro
        urlArquivo: publicUrl, // URL pública para aceder ao ficheiro
        tipo: validation.data.tipo,
      },
    });

    return NextResponse.json(anexo, { status: 201 });

  } catch (error) {
    console.error('[ANEXOS_POST]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
