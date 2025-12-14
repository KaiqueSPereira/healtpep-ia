'use client';
import { MedicamentoComRelacoes } from "@/app/_components/types";
import { format } from 'date-fns';

interface MedicamentoDetailsProps {
    medicamento: MedicamentoComRelacoes;
}

export default function MedicamentoDetails({ medicamento }: MedicamentoDetailsProps) {

    const DetailItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => (
        <div className="py-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-md text-foreground">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="p-4 bg-card text-card-foreground rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem label="Forma Farmacêutica" value={medicamento.forma} />
                <DetailItem label="Status" value={medicamento.status} />
                <DetailItem label="Tipo de Medicamento" value={medicamento.tipo.replace(/_/g, ' ')} />
                <DetailItem label="Data de Início" value={medicamento.dataInicio ? format(new Date(medicamento.dataInicio), 'dd/MM/yyyy') : 'N/A'} />
                {medicamento.dataFim && <DetailItem label="Data de Fim" value={format(new Date(medicamento.dataFim), 'dd/MM/yyyy')} />}
                {medicamento.linkBula && <div className="py-2"><p className="text-sm font-medium text-muted-foreground">Bula</p><a href={medicamento.linkBula} target="_blank" rel="noopener noreferrer" className="text-md text-primary hover:underline">Acessar bula</a></div>}
            </div>

            <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-lg mb-2 text-foreground">Dosagem e Frequência</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <DetailItem label="Posologia" value={medicamento.posologia} />
                    <DetailItem label="Quantidade por Dose" value={medicamento.quantidadeDose} />
                    <DetailItem label="Frequência" value={medicamento.frequenciaNumero ? `${medicamento.frequenciaNumero} vez(es) a cada ${medicamento.frequenciaTipo}` : 'N/A'} />
                </div>
            </div>

            <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-lg mb-2 text-foreground">Estoque</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <DetailItem label="Estoque Atual" value={medicamento.estoque} />
                    <DetailItem label="Unidades por Caixa" value={medicamento.quantidadeCaixa} />
                </div>
            </div>

            {(medicamento.profissional || medicamento.consulta || medicamento.condicaoSaude) &&
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold text-lg mb-2 text-foreground">Informações Associadas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {medicamento.profissional && <DetailItem label="Prescrito por" value={medicamento.profissional.nome} />}
                        {medicamento.condicaoSaude && <DetailItem label="Condição de Saúde" value={medicamento.condicaoSaude.nome} />}
                        {medicamento.consulta && <DetailItem label="Consulta de Origem" value={`${format(new Date(medicamento.consulta.data), 'dd/MM/yyyy')} - ${medicamento.consulta.motivo}`} />}
                    </div>
                </div>
            }
        </div>
    );
}
