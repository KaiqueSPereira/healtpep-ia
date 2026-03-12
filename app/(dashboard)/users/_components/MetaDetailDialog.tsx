 'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/_components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import { Meta, PesoRegistro, TipoMeta, metaLabels, metaToRegistroKey } from './MetasCard';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Badge } from '@/app/_components/ui/badge';

interface MetaDetailDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  meta: Meta | null;
  historicoMedidas: PesoRegistro[];
}

const getUnit = (tipo: TipoMeta) => {
    const label = metaLabels[tipo];
    const match = label.match(/\((.*?)\)/);
    return match ? match[1] : '';
};

export const MetaDetailDialog = ({ isOpen, setIsOpen, meta, historicoMedidas }: MetaDetailDialogProps) => {
  if (!meta) return null;

  const { dadosGrafico, valorAtual, progresso, tempoRestante } = useMemo(() => {
    const key = metaToRegistroKey[meta.tipo];
    // Se a meta não tem uma chave correspondente no histórico (ex: IMC), retorna valores vazios.
    if (!key) {
      return { dadosGrafico: [], valorAtual: null, progresso: 0, tempoRestante: null };
    }

    const dadosFiltrados = historicoMedidas
      .map(reg => ({ ...reg, data: parseISO(reg.data) }))
      .filter(reg => {
        const valor = reg[key]; // Acesso à propriedade com tipagem segura.
        return reg.data >= parseISO(meta.dataInicio) && valor != null && valor !== '';
      })
      .sort((a, b) => a.data.getTime() - b.data.getTime());

    const dadosParaGrafico = dadosFiltrados.map(reg => ({
      data: format(reg.data, 'dd/MM'),
      // O filtro acima garante que `reg[key]` é uma string válida.
      valor: parseFloat(reg[key]!),
    }));

    const ultimoRegistro = dadosFiltrados[dadosFiltrados.length - 1];
    const vAtual = ultimoRegistro ? parseFloat(ultimoRegistro[key]!) : parseFloat(meta.valorInicial || '0');

    const vInicial = parseFloat(meta.valorInicial || '0');
    const vAlvo = parseFloat(meta.valorAlvo);

    const totalProgresso = vAlvo - vInicial;
    const progressoAtual = vAtual - vInicial;

    let p = 0;
    if (totalProgresso !== 0) {
      p = (progressoAtual / totalProgresso) * 100;
    } else if (vAtual >= vAlvo) {
      p = 100;
    }
    p = Math.max(0, Math.min(p, 100)); // Limita o progresso entre 0 e 100

    let tRestante: number | null = null;
    if (meta.dataFim) {
      tRestante = differenceInDays(parseISO(meta.dataFim), new Date());
    }

    return { dadosGrafico: dadosParaGrafico, valorAtual: vAtual, progresso: p, tempoRestante: tRestante };
  }, [meta, historicoMedidas]);

  const unit = getUnit(meta.tipo);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{metaLabels[meta.tipo]}</DialogTitle>
          <DialogDescription>Acompanhe a sua jornada e evolução.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 text-center">
          <Card>
            <CardHeader><CardTitle>Valor Inicial</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{meta.valorInicial || 'N/A'} {unit}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Valor Atual</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{valorAtual !== null ? valorAtual.toFixed(2) : 'N/A'} {unit}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Meta Final</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{meta.valorAlvo} {unit}</p></CardContent>
          </Card>
          <Card className={progresso > 80 ? 'bg-green-100 border-green-400' : ''}>
            <CardHeader><CardTitle>Progresso</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{progresso.toFixed(1)}%</p></CardContent>
          </Card>
        </div>

        <div className='mt-6'>
          <Card>
            <CardHeader><CardTitle>Gráfico de Evolução</CardTitle></CardHeader>
            <CardContent>
              {tempoRestante !== null && (
                <div className='text-center mb-4'>
                  <Badge variant='outline'>
                    {tempoRestante >= 0 ? `${tempoRestante} dias restantes` : `Prazo encerrado há ${Math.abs(tempoRestante)} dias`}
                  </Badge>
                </div>
              )}
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="valor" name={metaLabels[meta.tipo]} stroke="#8884d8" activeDot={{ r: 8 }} />
                    <ReferenceLine y={parseFloat(meta.valorAlvo)} label="Meta" stroke="red" strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
