// app/api/consultas/tipoconsultas/route.ts
import { NextResponse } from "next/server";

// Definindo as opções do ENUM diretamente no código
const consultaTiposEnum = ["Rotina", "Exame", "Emergencia"];

// Exportando a função para o método GET
export async function GET() {
  try {
    // Retornando as opções do ENUM diretamente com NextResponse
    return NextResponse.json(consultaTiposEnum);
  } catch (error) {
    console.error("Erro ao buscar os tipos de consulta:", error);
    return NextResponse.json(
      { error: "Erro ao buscar os tipos de consulta" },
      { status: 500 },
    );
  }
}
