import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { encrypt } from "@/app/_lib/crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const profissionalId = formData.get("profissionalId")?.toString();
    const unidadesId = formData.get("unidadeId")?.toString();
    const consultaId = formData.get("consultaId")?.toString() || null;
    const tratamentoId = formData.get("tratamentoId")?.toString() || null;
    const anotacao = formData.get("anotacao")?.toString() || "";
    const dataExame = formData.get("dataExame")?.toString();
    const examesRaw = formData.get("exames")?.toString();
    const file = formData.get("file") as File | null;

    if (!dataExame || !file) {
      return NextResponse.json(
        { error: "Data do exame e arquivo são obrigatórios" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const encryptedFileBuffer = encrypt(fileBuffer);

    const filename = `${randomUUID()}-${file.name}`;

    // Se não houver consulta selecionada, profissional e unidade são obrigatórios
    // Esta validação foi movida para DEPOIS da validação de data e arquivo,
    // e para antes da criação do exame.
    if (!consultaId && (!profissionalId || !unidadesId)) {
        return NextResponse.json(
          { error: "Profissional e Unidade são obrigatórios se nenhuma consulta for selecionada" },
          { status: 400 },
        );
    }

    const exame = await prisma.exame.create({
      data: {
        nome: encrypt(Buffer.from(file.name)).toString("hex"),
        nomeArquivo: encrypt(Buffer.from(filename)).toString("hex"),
        dataExame: new Date(dataExame),
        anotacao: encrypt(Buffer.from(anotacao)).toString("hex"),
        userId,
        profissionalId,
        unidadesId,
        consultaId,
        tratamentoId,
        arquivoExame: encryptedFileBuffer,
      },
    });


    if (examesRaw) {
      const exames = JSON.parse(examesRaw);
      for (const e of exames) {
       await prisma.resultadoExame.create({
         data: {
           exameId: exame.id,
           nome: encrypt(Buffer.from(e.nome)).toString("hex"),
           valor: encrypt(Buffer.from(e.valor)).toString("hex"),
           unidade: encrypt(Buffer.from(e.unidade || "")).toString("hex"),
           referencia: encrypt(Buffer.from(e.ValorReferencia || "")).toString(
             "hex",
           ),
         },
       });

      }
    }

    return NextResponse.json({ message: "Exame cadastrado com sucesso!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao salvar o exame." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const exames = await prisma.exame.findMany({
      include: {
        resultados: true,
        profissional: true,
        unidades: true,
        tratamento: true,
        usuario: true,
        consulta: true,
      },
    });
    return NextResponse.json(exames);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar exames." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID não informado" }, { status: 400 });
  }

  try {
    await prisma.resultadoExame.deleteMany({ where: { exameId: id } });
    await prisma.exame.delete({ where: { id } });
    return NextResponse.json({ message: "Exame deletado com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao deletar o exame." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, anotacao, dataExame, tratamentoId } = data;

    if (!id) {
      return NextResponse.json(
        { error: "ID do exame é obrigatório" },
        { status: 400 },
      );
    }

    const exame = await prisma.exame.update({
      where: { id },
      data: {
        anotacao: encrypt(Buffer.from(anotacao || "")).toString("hex"),
        dataExame: dataExame ? new Date(dataExame) : undefined,
        tratamentoId,
      },
    });

    return NextResponse.json({
      message: "Exame atualizado com sucesso",
      exame,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar o exame." },
      { status: 500 },
    );
  }
}
