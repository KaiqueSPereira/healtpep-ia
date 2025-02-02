"use server";

import { db } from "../_lib/prisma";

import { Consultatype } from "../_lib/prisma";

interface createConsultaParams {
    queixas: string;
    data: Date;
    tratamento: string;
    tipodeexame: string;
    tipo: Consultatype;
    userId: string;
    profissionalId: string;
    unidadeId: string;
}

export const createConsulta = async (param: createConsultaParams) => {
    await db.consultas.create({
        data: param
    });

        }