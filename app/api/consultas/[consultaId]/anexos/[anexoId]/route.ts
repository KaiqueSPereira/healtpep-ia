
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { consultaId: string; anexoId: string } }
) {
  const { consultaId, anexoId } = params;
  return NextResponse.json({
    message: "Rota de teste - Compilou!",
    consultaId,
    anexoId
  });
}

export async function DELETE(
    request: Request,
    { params }: { params: { consultaId: string; anexoId: string } }
  ) {
    const { consultaId, anexoId } = params;
    console.log(`Recebido DELETE para consulta ${consultaId} e anexo ${anexoId}`);
    return new NextResponse(null, { status: 204 });
  }
