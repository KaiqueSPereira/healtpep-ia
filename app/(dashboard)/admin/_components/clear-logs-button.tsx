'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/_components/ui/alert-dialog';
import { useToast } from '@/app/_hooks/use-toast'; // Corrigido com a sua ajuda!
import { Trash as TrashIcon } from 'lucide-react';

export function ClearLogsButton() {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/logs/clear', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Falha ao limpar os logs.');
      }

      toast({
        title: 'Sucesso!',
        description: 'Todos os logs foram excluídos.',
      });
      
      router.refresh();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      console.error(error);
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <TrashIcon className="mr-2 h-4 w-4" />
          Limpar Logs
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível e excluirá permanentemente todos os registros de log do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearLogs} disabled={isClearing}>
            {isClearing ? 'Limpando...' : 'Sim, limpar tudo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
