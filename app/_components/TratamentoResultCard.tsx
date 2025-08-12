import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface TratamentoResult {
    id: string;
    nome: string;
    // Add other fields you want to display for treatments
}

interface TratamentoResultCardProps {
    tratamento: TratamentoResult;
}

const TratamentoResultCard: React.FC<TratamentoResultCardProps> = ({ tratamento }) => {
    return (
        <Card> {/* No Link for treatments currently */}
            <CardHeader>
                <CardTitle>{tratamento.nome}</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Add more relevant tratamento details here if needed */}
            </CardContent>
        </Card>
    );
};

export default TratamentoResultCard;
