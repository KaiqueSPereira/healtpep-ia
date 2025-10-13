
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  req: Request,
  { params }: { params: { consultaId: string, anexoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const { consultaId, anexoId } = params;
    if (!consultaId || !anexoId) {
      return new NextResponse('IDs de Consulta ou Anexo não encontrados', { status: 400 });
    }

    // 1. Encontrar o anexo na base de dados para obter o caminho do arquivo
    const anexo = await db.anexoConsulta.findUnique({
        where: {
            id: anexoId,
            consultaId: consultaId, // Garante que o anexo pertence à consulta correta
        }
    });

    if (!anexo) {
        return new NextResponse('Anexo não encontrado', { status: 404 });
    }

    // 2. Apagar o arquivo físico do sistema de ficheiros
    const filePath = path.join(process.cwd(), 'public', anexo.urlArquivo);

    try {
        await unlink(filePath);
    } catch (error) { 
        // Se o arquivo não existir, podemos continuar para apagar o registo da BD,
        if ((error as { code: string })?.code !== 'ENOENT') {
            console.error("Erro ao apagar o arquivo físico:", error);
            // Dependendo da política, pode-se optar por parar aqui ou continuar
        }
    }

    // 3. Apagar o registo do anexo da base de dados
    await db.anexoConsulta.delete({
        where: {
            id: anexoId,
        }
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content - sucesso, sem corpo de resposta

  } catch (error) {
    console.error('[ANEXOS_DELETE]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
