import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import Link from "next/link";
import { format } from 'date-fns';
import { ptBR } from "date-fns/locale";
import React from "react";

interface ExameItemProps {
  exame: {
    tipo: string;
    data: Date;
    profissional: string;
  };
}

const ExameItem: React.FC<ExameItemProps> = ({ exame }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const exameId = "123" // Substituir pelo ID real do exame quando a API estiver pronta

    return (
        <Link href={`/exames/${exameId}`}>
            <Card
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <CardHeader>
                    <CardTitle>{exame.tipo}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                    <p>Data: {format(exame.data, "dd/MM/yyyy", { locale: ptBR })}</p>
                    <p>Profissional: {exame.profissional}</p>
                    {isHovered && (
                        <p className="text-sm text-gray-500">Clique para ver detalhes do exame.</p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
};

export default ExameItem;