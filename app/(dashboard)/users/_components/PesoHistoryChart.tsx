'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/app/_hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { addDays, format, startOfWeek, startOfMonth, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/app/_components/ui/dialog";
import { Calendar } from "@/app/_components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';

const PesoHistoryChartContent = dynamic(() => import('./PesoHistoryChartContent'), {
  loading: () => <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false,
});

const formSchema = z.object({
  data: z.string().nonempty({ message: "Data é obrigatória" }),
  peso: z.string().optional(),
  pescoco: z.string().optional(),
  torax: z.string().optional(),
  cintura: z.string().optional(),
  quadril: z.string().optional(),
  bracoE: z.string().optional(),
  bracoD: z.string().optional(),
  pernaE: z.string().optional(),
  pernaD: z.string().optional(),
  pantE: z.string().optional(),
  pantD: z.string().optional(),
});

interface PesoRegistro {
  id: string;
  userId?: string;
  peso: string;
  data: string;
  cintura?: string | null;
  quadril?: string | null;
  pescoco?: string | null;
  torax?: string | null;
  bracoE?: string | null;
  bracoD?: string | null;
  pernaE?: string | null;
  pernaD?: string | null;
  pantE?: string | null;
  pantD?: string | null;
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
    if (!altura || altura <= 0) return null;
    const alturaEmMetros = altura > 3 ? altura / 100 : altura;
    if (alturaEmMetros <= 0) return null;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { data: format(new Date(), 'yyyy-MM-dd') },
  });

  const handleAddRegistro = async (values: z.infer<typeof formSchema>) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/users/${userId}/medidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar registro');
      }

      onDataChange();
      form.reset({ data: format(new Date(), 'yyyy-MM-dd') });
      setIsDialogOpen(false);
      toast({ title: "Sucesso!", description: "Novo registro adicionado." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível adicionar o registro.";
      toast({ variant: "destructive", title: "Erro", description: message });
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
        case 'today': startDate = addDays(now, -1); break;
        case 'week': startDate = startOfWeek(now, { locale: ptBR }); break;
        case 'month': startDate = startOfMonth(now); break;
        case 'semester': startDate = subMonths(now, 6); break;
        case 'year': startDate = subYears(now, 1); break;
        case 'all':
        default: return safeHistoricoPeso;
    }
    return safeHistoricoPeso.filter(item => new Date(item.data) >= startDate);
  }, [safeHistoricoPeso, filterType, dateRange]);
  
  return (
    <Card className="border-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <CardTitle>Histórico de Medidas</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Adicionar Novo Registro</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddRegistro)} className="space-y-4">
                  <FormField control={form.control} name="data" render={({ field }) => <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="peso" render={({ field }) => <FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="cintura" render={({ field }) => <FormItem><FormLabel>Cintura (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="quadril" render={({ field }) => <FormItem><FormLabel>Quadril (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="pescoco" render={({ field }) => <FormItem><FormLabel>Pescoço (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="torax" render={({ field }) => <FormItem><FormLabel>Tórax (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="bracoD" render={({ field }) => <FormItem><FormLabel>Braço D (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="bracoE" render={({ field }) => <FormItem><FormLabel>Braço E (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="pernaD" render={({ field }) => <FormItem><FormLabel>Perna D (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="pernaE" render={({ field }) => <FormItem><FormLabel>Perna E (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="pantD" render={({ field }) => <FormItem><FormLabel>Panturrilha D (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="pantE" render={({ field }) => <FormItem><FormLabel>Panturrilha E (cm)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
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
                    onClick={() => { setFilterType(preset.value); setDateRange(undefined); }}
                >
                    {preset.label}
                </Button>
            ))}
            <Popover>
                <PopoverTrigger asChild><Button variant={filterType === 'range' ? 'default' : 'outline'} size="icon" aria-label="Customizar período"><PlusCircle className="h-4 w-4" /></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={(range) => { setDateRange(range); if (range?.from) { setFilterType('range'); } else { setFilterType('all'); } }} numberOfMonths={2} />
                </PopoverContent>
            </Popover>
            {filterType === 'range' && dateRange?.from && (
                <div className="text-sm text-muted-foreground font-medium p-2 bg-muted rounded-md">
                    {format(dateRange.from, "dd/MM/yy")} {dateRange.to ? ` - ${format(dateRange.to, "dd/MM/yy")}`: ''}
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
                    <div className="max-h-72 overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Peso</TableHead><TableHead>IMC</TableHead><TableHead>Cintura</TableHead><TableHead>Quadril</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {[...filteredHistorico].sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(registro => {
                                    const pesoNum = parseFloat(registro.peso);
                                    const imc = altura ? calculateIMC(pesoNum, altura) : null;
                                    return (
                                        <TableRow key={registro.id}>
                                            <TableCell>{format(new Date(registro.data), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                            <TableCell>{pesoNum.toFixed(1)} kg</TableCell>
                                            <TableCell>{imc ? imc.toFixed(1) : '-'}</TableCell>
                                            <TableCell>{registro.cintura || '-'} cm</TableCell>
                                            <TableCell>{registro.quadril || '-'} cm</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePeso(registro.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
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
