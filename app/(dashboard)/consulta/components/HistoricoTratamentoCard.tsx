import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
// Correção: Remover importações não utilizadas de Profissional e Unidade
import { TimelineItem } from "@/app/_components/types";

interface HistoricoTratamentoCardProps {
    items: TimelineItem[];
    consultaAtualId: string;
}

const HistoricoTratamentoCard = ({ items, consultaAtualId }: HistoricoTratamentoCardProps) => {
    if (items.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Linha do Tempo</CardTitle></CardHeader>
                <CardContent>
                    <p>Nenhum evento registrado.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><CardTitle>Linha do Tempo</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {items.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="flex items-start">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`w-3 h-3 rounded-full ${item.id === consultaAtualId ? 'bg-blue-500 ring-4 ring-blue-200' : 'bg-gray-300'}`}></div>
                                {index < items.length - 1 && <div className="w-px h-full bg-gray-300 mt-1"></div>}
                            </div>
                            <div className="flex-1 pb-6">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                                    <Badge variant={item.entryType === 'consulta' ? "default" : "secondary"}>{item.tipo}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{item.motivo}</p>
                                {item.profissional && <p className="text-xs text-gray-500">{item.profissional.nome}</p>}
                                {item.unidade && <p className="text-xs text-gray-500">{item.unidade.nome}</p>}
                                {item.id !== consultaAtualId && (
                                    <a href={item.href} className="text-sm text-blue-500 hover:underline mt-2 inline-flex items-center">
                                        Ver Detalhes <ArrowRightIcon className="ml-1 h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default HistoricoTratamentoCard;
