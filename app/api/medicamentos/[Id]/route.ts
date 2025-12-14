
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { encryptString, safeDecrypt } from '@/app/_lib/crypto';
import { TipoMedicamento, StatusMedicamento, FrequenciaTipo } from '@prisma/client';

const medicamentoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.').optional(),
  principioAtivo: z.string().optional().nullable(),
  linkBula: z.string().url().optional().nullable(),
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  tipo: z.nativeEnum(TipoMedicamento).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(StatusMedicamento).optional(),
  estoque: z.coerce.number().optional().nullable(),
  quantidadeCaixa: z.coerce.number().optional().nullable(),
  quantidadeDose: z.coerce.number().optional().nullable(),
  frequenciaNumero: z.coerce.number().optional().nullable(),
  frequenciaTipo: z.nativeEnum(FrequenciaTipo).optional().nullable(),
  condicaoSaudeId: z.string().optional().nullable(),
  profissionalId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
});

export async function GET(req: Request, { params }: { params: { Id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const medicamento = await db.medicamento.findUnique({
      where: { id: params.Id, userId: session.user.id },
      include: { profissional: true, condicaoSaude: true, consulta: true },
    });

    if (!medicamento) {
      return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
    }

    const decryptedMedicamento = {
      ...medicamento,
      nome: safeDecrypt(medicamento.nome),
      principioAtivo: medicamento.principioAtivo ? safeDecrypt(medicamento.principioAtivo) : null,
      posologia: medicamento.posologia ? safeDecrypt(medicamento.posologia) : null,
      forma: medicamento.forma ? safeDecrypt(medicamento.forma) : null,
      condicaoSaude: medicamento.condicaoSaude ? { ...medicamento.condicaoSaude, nome: safeDecrypt(medicamento.condicaoSaude.nome) } : null,
      profissional: medicamento.profissional ? { ...medicamento.profissional, nome: safeDecrypt(medicamento.profissional.nome) } : null,
      consulta: medicamento.consulta ? { ...medicamento.consulta, motivo: safeDecrypt(medicamento.consulta.motivo) } : null,
    };

    return NextResponse.json(decryptedMedicamento);

  } catch (error) {
    console.error('[MEDICAMENTO_GET_ID]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { Id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const existingMedicamento = await db.medicamento.findUnique({ where: { id: params.Id, userId: session.user.id } });
    if (!existingMedicamento) {
      return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
    }

    const json = await req.json();
    const body = medicamentoUpdateSchema.parse(json);

    const { nome, principioAtivo, posologia, forma, ...restOfBody } = body;

    const dataToUpdate = {
        ...restOfBody,
        ...(nome && { nome: encryptString(nome) }),
        ...(principioAtivo && { principioAtivo: encryptString(principioAtivo) }),
        ...(posologia && { posologia: encryptString(posologia) }),
        ...(forma && { forma: encryptString(forma) }),
    };

    const updatedMedicamento = await db.medicamento.update({
      where: { id: params.Id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedMedicamento);

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[MEDICAMENTO_PUT_VALIDATION_ERROR]', error.issues);
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error('[MEDICAMENTO_PUT]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { Id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const existingMedicamento = await db.medicamento.findUnique({ where: { id: params.Id, userId: session.user.id } });
    if (!existingMedicamento) {
        return new NextResponse('Medicamento não encontrado ou não autorizado', { status: 404 });
    }

    await db.medicamento.delete({ where: { id: params.Id } });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('[MEDICAMENTO_DELETE]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
