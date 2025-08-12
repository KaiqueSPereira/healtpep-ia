// app/_components/ExameResultCard.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ExameResult {
    id: string;
    tipo: string;
    profissionalNome?: string; // Optional
    data: string; // Assuming date is available and maybe formatted
    unidadeNome?: string; // Assuming unit name is available (optional)
    tratamentoNome?: string; // Assuming treatment name is available (optional)
    // Add other fields you want to display
}

interface ExameResultCardProps {
    exame: ExameResult;
}

const ExameResultCard: React.FC<ExameResultCardProps> = ({ exame }) => {
     // Format date if needed, assuming exame.data is a Date object or string
    const formattedDate = exame.data ? new Date(exame.data).toLocaleDateString('pt-BR') : 'Data não disponível';

    return (
        <Link href={`/exames/${exame.id}`} passHref>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle>{exame.tipo}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Data: {formattedDate}</p>
                    {exame.profissionalNome && <p className="text-sm text-gray-600 dark:text-gray-300">Profissional: {exame.profissionalNome}</p>}
                    {exame.unidadeNome && <p className="text-sm text-gray-600 dark:text-gray-300">Unidade: {exame.unidadeNome}</p>}
                     {exame.tratamentoNome && <p className="text-sm text-gray-600 dark:text-gray-300">Tratamento: {exame.tratamentoNome}</p>}
                    {/* Add more relevant exame details here */}
                </CardContent>
            </Card>
        </Link>
    );
};

export default ExameResultCard;
