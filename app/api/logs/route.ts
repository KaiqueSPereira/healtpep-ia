import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const errorData = await request.json();
    // Por enquanto, vamos apenas registrar o erro no console do lado do servidor.
    console.error("Erro do lado do cliente registrado:", errorData);

    // No futuro, você pode salvar isso em um banco de dados, um arquivo ou enviar para um serviço de log.

    return NextResponse.json({ message: "Erro registrado com sucesso" }, { status: 200 });
  } catch (e) {
    // Isso captura erros no próprio endpoint de log.
    console.error("Erro ao registrar o erro do lado do cliente:", e);
    return NextResponse.json({ message: "Falha ao registrar o erro" }, { status: 500 });
  }
}
