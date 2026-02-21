import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge, BadgeProps } from "@/app/_components/ui/badge";
import { Stethoscope, FlaskConical } from "lucide-react";
import Link from 'next/link';
import { TimelineItem } from "@/app/_components/types";

interface HistoricoTratamentoCardProps {
    items: TimelineItem[];
    consultaAtualId: string;
}

// Helper para cortar o texto
const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const TimelineIcon = ({ entryType }: { entryType: 'consulta' | 'exame' | string }) => {
    switch (entryType) {
        case 'consulta':
            return <Stethoscope size={16} />;
        case 'exame':
            return <FlaskConical size={16} />;
        default:
            return null;
    }
};

// Retorna a variante da badge com base no tipo
const getBadgeVariant = (tipo: string): BadgeProps["variant"] => {
    switch (tipo.toLowerCase()) {
        case 'retorno':
        case 'rotina':
            return 'destructive';
        case 'outros':
            return 'secondary';
        default:
            return 'default';
    }
};

const HistoricoTratamentoCard = ({ items, consultaAtualId }: HistoricoTratamentoCardProps) => {
    if (items.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Linha do Tempo</CardTitle></CardHeader>
                <CardContent><p>Nenhum evento registrado.</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><CardTitle>Linha do Tempo</CardTitle></CardHeader>
            <CardContent>
                <div className="relative space-y-4">
                    {/* Linha vertical contínua com cor do tema */}
                    <div className="absolute left-4 top-2 h-full w-px bg-border -translate-x-px"></div>

                    {items.map((item) => {
                        const isCurrent = item.id === consultaAtualId;
                        const description = item.entryType === 'exame' && item.anotacao 
                            ? truncateText(item.anotacao, 80) 
                            : item.motivo;

                        const timelineContent = (
                            <div className="relative flex items-start space-x-4">
                                {/* Icone posicionado sobre a linha */}
                                <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                                        <TimelineIcon entryType={item.entryType} />
                                    </div>
                                </div>

                                <div className="flex-1 pt-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <p className="font-semibold text-foreground">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                                        <Badge variant={getBadgeVariant(item.tipo)}>{item.tipo}</Badge>
                                    </div>
                                    <p className={`text-sm text-muted-foreground ${!isCurrent ? 'group-hover:underline' : ''}`}>{description}</p>
                                    {item.profissional && <p className="text-xs text-muted-foreground mt-1">{item.profissional.nome}</p>}
                                    {item.unidade && <p className="text-xs text-muted-foreground">{item.unidade.nome}</p>}
                                </div>
                            </div>
                        );

                        if (isCurrent) {
                            return <div key={item.id}>{timelineContent}</div>;
                        }

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="group no-underline text-inherit block cursor-pointer"
                            >
                                {timelineContent}
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default HistoricoTratamentoCard;
