
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ConsultaResult {
    id: string;
    tipo: string;
    profissionalNome: string;
    data: string; // Assuming date is available and maybe formatted
    unidadeNome?: string; // Assuming unit name is available (optional)
    // Add other fields you want to display
}

interface ConsultaResultCardProps {
    consulta: ConsultaResult;
}

const ConsultaResultCard: React.FC<ConsultaResultCardProps> = ({ consulta }) => {
    // Format date if needed, assuming consulta.data is a Date object or string
    const formattedDate = consulta.data ? new Date(consulta.data).toLocaleDateString('pt-BR') : 'Data não disponível';

    return (
        <Link href={`/consulta/${consulta.id}`} passHref>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle>{consulta.tipo}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Profissional: {consulta.profissionalNome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Data: {formattedDate}</p>
                    {consulta.unidadeNome && <p className="text-sm text-gray-600 dark:text-gray-300">Unidade: {consulta.unidadeNome}</p>}
                    {/* Add more relevant consulta details here */}
                </CardContent>
            </Card>
        </Link>
    );
};

export default ConsultaResultCard;
