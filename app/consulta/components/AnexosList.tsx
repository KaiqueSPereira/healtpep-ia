"use client";

import { AnexoConsulta } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";

interface AnexosListProps {
    anexos: AnexoConsulta[];
    onDeleteAnexo: (anexoId: string) => void;
}

export default function AnexosList({ anexos, onDeleteAnexo }: AnexosListProps) {
    if (anexos.length === 0) {
        return null; // Não renderiza nada se não houver anexos
    }

    const formatTipo = (tipo: string) => {
        return tipo.replace(/_/g, ' ').charAt(0).toUpperCase() + tipo.replace(/_/g, ' ').slice(1).toLowerCase();
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Anexos da Consulta</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {anexos.map(anexo => (
                        <li key={anexo.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-accent">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <div className="flex flex-col">
                                     {/* CORREÇÃO: O link agora aponta para a rota da API que serve o ficheiro para download */}
                                     <Link href={`/api/consultas/${anexo.consultaId}/anexos/${anexo.id}`} className="font-medium hover:underline">
                                        {anexo.nomeArquivo}
                                    </Link>
                                    <span className="text-sm text-muted-foreground">{formatTipo(anexo.tipo)}</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteAnexo(anexo.id)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Apagar anexo</span>
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
