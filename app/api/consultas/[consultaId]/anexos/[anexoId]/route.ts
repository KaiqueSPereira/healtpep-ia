import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { safeDecrypt } from '@/app/_lib/crypto';

// GET: Handles downloading a specific attachment.
export async function GET(
  req: Request,
  { params }: { params: { consultaId: string, anexoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const { consultaId, anexoId } = params;

    const anexo = await db.anexoConsulta.findFirst({
      where: {
        id: anexoId,
        consultaId: consultaId,
        consulta: {
          userId: session.user.id,
        },
      },
    });

    if (!anexo || !anexo.arquivo) {
      return new NextResponse('Anexo não encontrado ou acesso negado', { status: 404 });
    }

    // CORREÇÃO: Converte o Uint8Array da BD para um Buffer do Node.js antes de chamar toString().
    const encryptedString = Buffer.from(anexo.arquivo).toString('utf-8');
    const decryptedBase64 = safeDecrypt(encryptedString);

    if (!decryptedBase64) {
        return new NextResponse('Falha ao obter o conteúdo do arquivo', { status: 500 });
    }
    
    const fileBuffer = Buffer.from(decryptedBase64, 'base64');

    const headers = new Headers();
    headers.set('Content-Type', anexo.mimetype || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${anexo.nomeArquivo}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });

  } catch (error) {
    console.error('[ANEXO_GET]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}


// DELETE: Handles deleting a specific attachment.
export async function DELETE(
  req: Request,
  { params }: { params: { consultaId: string, anexoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const { consultaId, anexoId } = params;
    if (!consultaId || !anexoId) {
      return new NextResponse('IDs de Consulta ou Anexo não encontrados', { status: 400 });
    }

    const deleteResult = await db.anexoConsulta.deleteMany({
        where: {
            id: anexoId,
            consultaId: consultaId,
            consulta: {
                userId: session.user.id,
            }
        }
    });

    if (deleteResult.count === 0) {
        return new NextResponse("Anexo não encontrado ou acesso negado", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('[ANEXOS_DELETE]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
