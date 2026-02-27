"use client";

import { useState, useMemo } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Label } from '@/app/_components/ui/label';
import { Input } from '@/app/_components/ui/input';
import { Button } from '@/app/_components/ui/button';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { addDays, format, startOfWeek, startOfMonth, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/_components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/app/_components/ui/dialog";
import { Calendar } from "@/app/_components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover"

const PesoHistoryChartContent = dynamic(() => import('./PesoHistoryChartContent'), {
  loading: () => <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false,
});

interface PesoRegistro {
  id: string;
  userId?: string;
  peso: string;
  data: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PesoHistoryChartProps {
  userId?: string;
  historicoPeso?: PesoRegistro[] | null;
  altura?: number | null;
  loading?: boolean;
  error?: string | null;
  onDataChange?: () => void;
}

const filterPresets = [
    { label: '1D', value: 'today' },
    { label: '1S', value: 'week' },
    { label: '1M', value: 'month' },
    { label: '6M', value: 'semester' },
    { label: '1A', value: 'year' },
    { label: 'Tudo', value: 'all' },
];

const calculateIMC = (peso: number, altura: number): number | null => {
    if (!altura || altura <= 0) {
      return null;
    }
    
    const alturaEmMetros = altura > 3 ? altura / 100 : altura;
    
    if (alturaEmMetros <= 0) {
        return null;
    }

    return peso / (alturaEmMetros * alturaEmMetros);
  };

export default function PesoHistoryChart({ 
  userId, 
  historicoPeso, 
  altura,
  loading = false, 
  error = null, 
  onDataChange = () => {}
}: PesoHistoryChartProps) {
  const [novoPeso, setNovoPeso] = useState('');
  const [novaDataPeso, setNovaDataPeso] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();
  
  const handleAddPeso = async () => {
    if (!novoPeso || !novaDataPeso || !userId || isSaving) {
      toast({ variant: "destructive", title: "Atenção", description: "Preencha o peso e a data corretamente." });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ peso: novoPeso, data: novaDataPeso }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erro ao adicionar peso'); }
      onDataChange();
      setNovoPeso('');
      setNovaDataPeso(format(new Date(), 'yyyy-MM-dd'));
      setIsDialogOpen(false);
      toast({ title: "Sucesso!", description: "Registro de peso adicionado." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível adicionar o registro.";
      toast({ variant: "destructive", title: "Erro", description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePeso = async (registroId: string) => {
    if (!userId) return;
    try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: registroId }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erro ao deletar peso'); }
        onDataChange();
        toast({ title: "Sucesso!", description: "Registro de peso deletado." });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível deletar o registro.";
        toast({ variant: "destructive", title: "Erro", description: message });
    }
  };

  const safeHistoricoPeso = useMemo(() => Array.isArray(historicoPeso) ? historicoPeso : [], [historicoPeso]);

  const filteredHistorico = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (filterType === 'range' && dateRange?.from) {
        const endDate = dateRange.to ? dateRange.to : addDays(dateRange.from, 1);
        return safeHistoricoPeso.filter(item => {
            const itemDate = new Date(item.data);
            return itemDate >= dateRange.from! && itemDate < endDate;
        });
    }

    switch (filterType) {
        case 'today':
            startDate = addDays(now, -1);
            break;
        case 'week':
            startDate = startOfWeek(now, { locale: ptBR });
            break;
        case 'month':
            startDate = startOfMonth(now);
            break;
        case 'semester':
            startDate = subMonths(now, 6);
            break;
        case 'year':
            startDate = subYears(now, 1);
            break;
        case 'all':
        default:
            return safeHistoricoPeso;
    }

    return safeHistoricoPeso.filter(item => new Date(item.data) >= startDate);

  }, [safeHistoricoPeso, filterType, dateRange]);
  
  return (
    <Card className="border-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>Histórico de Peso</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Peso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Adicionar Novo Registro de Peso</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="novoPeso" className="text-right">Peso (kg)</Label>
                  <Input id="novoPeso" type="number" step="0.1" placeholder="Ex: 75.5" value={novoPeso} onChange={(e) => setNovoPeso(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="novaDataPeso" className="text-right">Data</Label>
                  <Input id="novaDataPeso" type="date" value={novaDataPeso} onChange={(e) => setNovaDataPeso(e.target.value)} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPeso} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex flex-wrap items-center gap-2">
            {filterPresets.map(preset => (
                <Button
                    key={preset.value}
                    variant={filterType === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                        setFilterType(preset.value);
                        setDateRange(undefined);
                    }}
                >
                    {preset.label}
                </Button>
            ))}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={filterType === 'range' ? 'default' : 'outline'}
                        size="icon"
                        aria-label="Customizar período"
                    >
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                            setDateRange(range);
                            if (range?.from) {
                                setFilterType('range');
                            } else {
                                setFilterType('all');
                            }
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            {filterType === 'range' && dateRange?.from && (
                <div className="text-sm text-muted-foreground font-medium p-2 bg-muted rounded-md">
                    {format(dateRange.from, "dd/MM/yy")} 
                    {dateRange.to ? ` - ${format(dateRange.to, "dd/MM/yy")}`: ''}
                </div>
            )}
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredHistorico.length === 0 ? (
          <p className="text-center text-muted-foreground pt-4">Nenhum registro de peso encontrado para o período.</p>
        ) : (
            <>
                <PesoHistoryChartContent historicoPeso={filteredHistorico} />
                <div className="mt-6">
                    <h3 className="font-semibold mb-2">Registros Detalhados</h3>
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Peso (kg)</TableHead>
                                <TableHead>IMC</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...filteredHistorico].sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(registro => {
                                    const pesoNum = parseFloat(registro.peso);
                                    const imc = altura ? calculateIMC(pesoNum, altura) : null;

                                    return (
                                        <TableRow key={registro.id}>
                                            <TableCell>{format(new Date(registro.data), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                            <TableCell>{pesoNum.toFixed(1)}</TableCell>
                                            <TableCell>{imc ? imc.toFixed(1) : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePeso(registro.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}
