 'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { PlusCircle, Target, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { Badge } from '@/app/_components/ui/badge';
import { AddMetaDialog } from './AddMetaDialog';
import { MetaDetailDialog } from './MetaDetailDialog';

// 1. Tipagem aprimorada: Todas as chaves de medida são declaradas como opcionais.
export interface PesoRegistro {
  id: string;
  data: string;
  peso?: string | null;
  gorduraCorporal?: string | null;
  massaMuscular?: string | null;
  imc?: string | null;
  pescoco?: string | null;
  torax?: string | null;
  cintura?: string | null;
  quadril?: string | null;
  bracoE?: string | null;
  bracoD?: string | null;
  pernaE?: string | null;
  pernaD?: string | null;
  pantE?: string | null;
  pantD?: string | null;
}

export enum TipoMeta {
  PESO = 'PESO',
  GORDURA_CORPORAL = 'GORDURA_CORPORAL',
  MASSA_MUSCULAR = 'MASSA_MUSCULAR',
  IMC = 'IMC',
  PESCOCO = 'PESCOCO',
  TORAX = 'TORAX',
  CINTURA = 'CINTURA',
  QUADRIL = 'QUADRIL',
  BRACO_E = 'BRACO_E',
  BRACO_D = 'BRACO_D',
  PERNA_E = 'PERNA_E',
  PERNA_D = 'PERNA_D',
  PANTURRILHA_E = 'PANTURRILHA_E',
  PANTURRILHA_D = 'PANTURRILHA_D',
}

export enum StatusMeta {
  ATIVA = 'ATIVA',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export interface Meta {
  id: string;
  tipo: TipoMeta;
  valorAlvo: string;
  valorInicial?: string | null;
  dataInicio: string;
  dataFim?: string | null;
  status: StatusMeta;
}

interface MetasCardProps {
  userId: string;
  historicoMedidas: PesoRegistro[];
}

export const metaLabels: Record<TipoMeta, string> = {
  [TipoMeta.PESO]: 'Peso (kg)',
  [TipoMeta.GORDURA_CORPORAL]: 'Gordura Corporal (%)',
  [TipoMeta.MASSA_MUSCULAR]: 'Massa Muscular (kg)',
  [TipoMeta.IMC]: 'IMC',
  [TipoMeta.PESCOCO]: 'Pescoço (cm)',
  [TipoMeta.TORAX]: 'Tórax (cm)',
  [TipoMeta.CINTURA]: 'Cintura (cm)',
  [TipoMeta.QUADRIL]: 'Quadril (cm)',
  [TipoMeta.BRACO_E]: 'Braço E. (cm)',
  [TipoMeta.BRACO_D]: 'Braço D. (cm)',
  [TipoMeta.PERNA_E]: 'Perna E. (cm)',
  [TipoMeta.PERNA_D]: 'Perna D. (cm)',
  [TipoMeta.PANTURRILHA_E]: 'Panturrilha E. (cm)',
  [TipoMeta.PANTURRILHA_D]: 'Panturrilha D. (cm)',
};

// 2. Tipagem corrigida: Mapeia TipoMeta para uma chave de PesoRegistro (exceto id e data).
// A chave é opcional (?) porque IMC não possui um mapeamento direto.
export const metaToRegistroKey: { [key in TipoMeta]?: keyof Omit<PesoRegistro, 'id' | 'data'> } = {
    [TipoMeta.PESO]: 'peso',
    [TipoMeta.GORDURA_CORPORAL]: 'gorduraCorporal',
    [TipoMeta.MASSA_MUSCULAR]: 'massaMuscular',
    [TipoMeta.PESCOCO]: 'pescoco',
    [TipoMeta.TORAX]: 'torax',
    [TipoMeta.CINTURA]: 'cintura',
    [TipoMeta.QUADRIL]: 'quadril',
    [TipoMeta.BRACO_E]: 'bracoE',
    [TipoMeta.BRACO_D]: 'bracoD',
    [TipoMeta.PERNA_E]: 'pernaE',
    [TipoMeta.PERNA_D]: 'pernaD',
    [TipoMeta.PANTURRILHA_E]: 'pantE',
    [TipoMeta.PANTURRILHA_D]: 'pantD',
};


const statusConfig = {
  [StatusMeta.ATIVA]: { label: 'Ativa', className: 'bg-blue-500', icon: Target },
  [StatusMeta.CONCLUIDA]: { label: 'Concluída', className: 'bg-green-500', icon: CheckCircle },
  [StatusMeta.CANCELADA]: { label: 'Cancelada', className: 'bg-red-500', icon: XCircle },
};

export const MetasCard = ({ userId, historicoMedidas }: MetasCardProps) => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);

  const fetchMetas = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/metas`);
      if (!response.ok) throw new Error('Erro ao buscar metas');
      const data = await response.json();
      setMetas(data);
    } catch (error) {
      console.error(error);
    }
  }, [userId]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  const handleMetaClick = (meta: Meta) => {
    setSelectedMeta(meta);
    setIsDetailOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Target className="mr-2" />
          Minhas Metas
        </CardTitle>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Meta
        </Button>
      </CardHeader>
      <CardContent>
        {metas.length > 0 ? (
          <div className="space-y-4">
            {metas.map((meta) => {
              const config = statusConfig[meta.status];
              if (!config) {
                console.warn('Meta com status inválido encontrada:', meta);
                return null;
              }
              const Icon = config.icon;
              return (
                <div key={meta.id} onClick={() => handleMetaClick(meta)} className="flex items-start justify-between p-4 rounded-lg border transition-shadow hover:shadow-md cursor-pointer">
                    <div className="flex flex-col">
                        <p className='font-semibold text-base'>{metaLabels[meta.tipo]}</p>
                        <div className='flex items-center text-sm text-muted-foreground mt-2'>
                            <Target className="mr-2 h-4 w-4 text-gray-400" />
                            <span>Alvo: {meta.valorAlvo}</span>
                        </div>
                        {meta.dataFim && (
                            <div className='flex items-center text-sm text-muted-foreground mt-1'>
                                <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />
                                <span>
                                    Até {new Date(meta.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </span>
                            </div>
                        )}
                    </div>
                    <Badge className={config.className}>
                        <Icon className="mr-2 h-4 w-4" />
                        {config.label}
                    </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">Nenhuma meta definida ainda.</p>
        )}
      </CardContent>
      
      <AddMetaDialog 
        isOpen={isAddDialogOpen} 
        setIsOpen={setIsAddDialogOpen} 
        userId={userId} 
        onMetaCriada={fetchMetas} 
        historicoMedidas={historicoMedidas}
      />

      <MetaDetailDialog 
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        meta={selectedMeta}
        historicoMedidas={historicoMedidas}
      />
    </Card>
  );
};
