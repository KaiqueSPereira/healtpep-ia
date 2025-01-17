// /app/api/consultas/[consultaId]/route.ts
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

// Atualizar a descrição da consulta
export async function PATCH(req: Request, { params }: { params: { consultaId: string } }) {
    try {
        const { queixas } = await req.json();
        const { consultaId } = params;

        const updatedConsulta = await db.consultas.update({
            where: { id: consultaId },
            data: { queixas },
        });
        return NextResponse.json(updatedConsulta);
    } catch (error) {
        return NextResponse.json({ error: "Falha ao atualizar a descrição" }, { status: 500 });
    }
}

// Obter uma consulta específica
export async function getConsultaById(req: Request, { params }: { params: { consultaId: string } }) {
    try {
        const { consultaId } = params;

        const consulta = await db.consultas.findUnique({
            where: { id: consultaId },
        });

        if (!consulta) {
            return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 });
        }
        return NextResponse.json(consulta);
    } catch {
        return NextResponse.json({ error: "Falha ao buscar a consulta" }, { status: 500 });
    }
}

// Deletar uma consulta
export async function DELETE(req: Request, { params }: { params: { consultaId: string } }) {
    try {
        const { consultaId } = params;

        await db.consultas.delete({
            where: { id: consultaId },
        });
        return NextResponse.json({ message: "Consulta deletada com sucesso!" });
    } catch {
        return NextResponse.json({ error: "Falha ao deletar a consulta" }, { status: 500 });
    }
}

// Criar uma nova consulta
export async function POST(req: Request) {
    try {
        const { queixas, data, tratamento, tipodeexame, tipo, userId, profissionalId, unidadeId } = await req.json();

        const novaConsulta = await db.consultas.create({
            data: {
                queixas,
                data: new Date(data),
                tratamento,
                tipodeexame,
                tipo,
                userId,
                profissionalId,
                unidadeId,
            },
        });
        return NextResponse.json(novaConsulta);
    } catch (error) {
        return NextResponse.json({ error: "Falha ao criar a consulta" }, { status: 500 });
    }
}

// Listar todas as consultas
export async function getAllConsultas() {
    try {
        const consultas = await db.consultas.findMany();
        return NextResponse.json(consultas);
    } catch {
        return NextResponse.json({ error: "Falha ao buscar as consultas" }, { status: 500 });
    }
}
