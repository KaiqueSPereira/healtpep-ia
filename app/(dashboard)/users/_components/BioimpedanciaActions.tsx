'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2, Edit, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/_components/ui/alert-dialog";
import { toast } from '@/app/_hooks/use-toast';
import EditBioimpedanciaDialog from '@/app/(dashboard)/users/_components/EditBioimpedanciaDialog';

interface BioimpedanceRecord {
  id: string;
  data: string;
  gorduraCorporal?: number | null;
  gorduraVisceral?: number | null;
  massaMuscular?: number | null;
  aguaCorporal?: number | null;
  massaOssea?: number | null;
  taxaMetabolica?: number | null;
  idadeCorporal?: number | null;
  anexos: { id: string; nomeArquivo: string; }[];
}

interface BioimpedanciaActionsProps {
  record: BioimpedanceRecord;
  onSuccess: () => void;
}

const BioimpedanciaActions = ({ record, onSuccess }: BioimpedanciaActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/users/userid/bioimpedancias?id=${record.id}`, { // userid is a placeholder
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao apagar o registro.');
      }

      toast({ title: "Registro de bioimpedância apagado com sucesso!" });
      onSuccess();
    } catch (error) {
      toast({ title: "Erro", description: (error instanceof Error) ? error.message : 'Ocorreu um erro desconhecido', variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {record.anexos && record.anexos.length > 0 && (
            <DropdownMenuItem asChild>
              <a href={`/api/bioimpedancias/anexos/${record.anexos[0].id}`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Anexo
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Apagar</span>
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Isso irá apagar permanentemente o registro de bioimpedância.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Apagar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
      {isEditDialogOpen && <EditBioimpedanciaDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        record={record}
        onSuccess={() => {
          onSuccess();
          setIsEditDialogOpen(false);
        }}
      />}
    </>
  );
};

export default BioimpedanciaActions;
