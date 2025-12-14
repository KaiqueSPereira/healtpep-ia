
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/_lib/auth';
import { db } from '@/app/_lib/prisma';
import { TipoMedicamento, StatusMedicamento, FrequenciaTipo } from '@prisma/client';
import { encryptString, safeDecrypt } from '@/app/_lib/crypto';

// Esquema de validação para criação de medicamentos
const medicamentoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.'),
  principioAtivo: z.string().optional().nullable(),
  linkBula: z.string().url().optional().nullable(),
  posologia: z.string().optional().nullable(),
  forma: z.string().optional().nullable(),
  tipo: z.nativeEnum(TipoMedicamento),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(StatusMedicamento),
  estoque: z.coerce.number().optional().nullable(),
  quantidadeCaixa: z.coerce.number().optional().nullable(),
  quantidadeDose: z.coerce.number().optional().nullable(),
  frequenciaNumero: z.coerce.number().optional().nullable(),
  frequenciaTipo: z.nativeEnum(FrequenciaTipo).optional().nullable(),
  profissionalId: z.string().optional().nullable(),
  consultaId: z.string().optional().nullable(),
  condicaoSaudeId: z.string().optional().nullable(),
});

// --- FUNÇÃO GET: BUSCAR E DESCRIPTOGRAFAR MEDICAMENTOS ---
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const medicamentos = await db.medicamento.findMany({
      where: { userId: session.user.id },
      include: {
        profissional: true,
        condicaoSaude: true,
        consulta: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Descriptografa os dados para enviar ao frontend
    const decryptedMedicamentos = medicamentos.map(med => ({
      ...med,
      nome: safeDecrypt(med.nome),
      principioAtivo: med.principioAtivo ? safeDecrypt(med.principioAtivo) : null,
      posologia: med.posologia ? safeDecrypt(med.posologia) : null,
      forma: med.forma ? safeDecrypt(med.forma) : null,
      condicaoSaude: med.condicaoSaude ? {
        ...med.condicaoSaude,
        nome: safeDecrypt(med.condicaoSaude.nome),
      } : null,
      profissional: med.profissional ? {
          ...med.profissional,
          nome: safeDecrypt(med.profissional.nome),
      } : null,
      consulta: med.consulta ? {
          ...med.consulta,
          motivo: safeDecrypt(med.consulta.motivo),
      } : null,
    }));

    return NextResponse.json(decryptedMedicamentos);
  } catch (error) {
    console.error('[MEDICAMENTOS_GET]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}

// --- FUNÇÃO POST: CRIPTOGRAFAR E CRIAR NOVO MEDICAMENTO ---
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const json = await req.json();
    const body = medicamentoCreateSchema.parse(json);

    // Criptografa os dados antes de salvar no banco
    const encryptedData = {
      ...body,
      nome: encryptString(body.nome),
      principioAtivo: body.principioAtivo ? encryptString(body.principioAtivo) : null,
      posologia: body.posologia ? encryptString(body.posologia) : null,
      forma: body.forma ? encryptString(body.forma) : null,
    };

    const medicamento = await db.medicamento.create({
      data: {
        userId: session.user.id,
        ...encryptedData,
      },
    });

    return NextResponse.json(medicamento, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error('[MEDICAMENTOS_POST]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}
