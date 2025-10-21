'use client';

import { MedicamentoComRelacoes } from "@/app/_components/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { format} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Syringe, Clock, Link as LinkIcon, Info, User, Activity, MapPin } from 'lucide-react'; // REMOVED Badge and Pill

interface MedicamentoDetailsProps {
  medicamento: MedicamentoComRelacoes;
}

const MedicamentoDetails = ({ medicamento }: MedicamentoDetailsProps) => {

  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start">
      <Icon className="h-5 w-5 text-gray-500 mt-1 mr-3 flex-shrink-0" />
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-gray-600">{value || 'Não informado'}</p>
      </div>
    </div>
  );

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">{medicamento.nome}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DetailItem icon={Info} label="Princípio Ativo" value={medicamento.principioAtivo} />
        <DetailItem icon={Syringe} label="Forma Farmacêutica" value={medicamento.forma} />
        <DetailItem icon={Activity} label="Tipo" value={medicamento.tipo.replace('_', ' ')} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem 
                icon={CalendarDays} 
                label="Início do Tratamento" 
                value={format(new Date(medicamento.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
            />
            {medicamento.dataFim && (
                 <DetailItem 
                    icon={CalendarDays} 
                    label="Fim do Tratamento" 
                    value={format(new Date(medicamento.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                />
            )}
        </div>

        {medicamento.posologia && <DetailItem icon={Clock} label="Posologia e Observações" value={medicamento.posologia} />}
        
        {medicamento.linkBula && (
            <DetailItem 
                icon={LinkIcon} 
                label="Bula" 
                value={<a href={medicamento.linkBula} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Acessar Bula</a>}
            />
        )}

        <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-center mb-2">Associações</h3>
            {medicamento.profissional && <DetailItem icon={User} label="Profissional" value={medicamento.profissional.nome} />}
            {medicamento.condicaoSaude && <DetailItem icon={Activity} label="Condição de Saúde" value={medicamento.condicaoSaude.nome} />}
            {medicamento.consulta && (
                 <DetailItem 
                    icon={MapPin} 
                    label="Consulta Relacionada" 
                    value={`Consulta de ${medicamento.consulta.tipo} em ${format(new Date(medicamento.consulta.data), 'dd/MM/yyyy', { locale: ptBR })}`}
                />
            )}
            { !medicamento.profissional && !medicamento.condicaoSaude && !medicamento.consulta && <p className="text-center text-gray-500">Nenhuma associação registrada.</p> }
        </div>

      </CardContent>
    </Card>
  );
};

export default MedicamentoDetails;
