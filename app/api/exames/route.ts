import { db } from "@/app/_lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const nome = formData.get("nome") as string;
    const dataExame = new Date(formData.get("dataExame") as string); // Assuming date is sent as string
    const file = formData.get("arquivoExame") as File;
    const userId = formData.get("userId") as string;
    const profissionalId = formData.get("profissionalId") as string;
    const consultaId = formData.get("consultaId") as string;
    const unidadesId = formData.get("unidadesId") as string | null;

    const arrayBuffer = await file.arrayBuffer();
    const arquivoExame = new Uint8Array(arrayBuffer);

    const newExame = await db.exame.create({
      data: {
        nome,
        dataExame,
        arquivoExame,
        userId,
        profissionalId,
        consultaId,
        unidadesId,
      },
    });

    return new Response(JSON.stringify(newExame), { status: 201 });
  } catch (error) {
    console.error("Error creating exame:", error);
    return new Response(JSON.stringify({ error: "Failed to create exame" }), {
      status: 500,
    });
  }
}
