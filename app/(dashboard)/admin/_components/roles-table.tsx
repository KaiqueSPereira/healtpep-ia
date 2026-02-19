'use client';

import { useState } from 'react';
import type { Role, Permission, ResourceLimit } from '@prisma/client';
import { Button } from '@/app/_components/ui/button';
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
} from '@/app/_components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Badge } from '@/app/_components/ui/badge';
import { Loader2, MoreHorizontal, Infinity } from 'lucide-react';
import { RoleForm } from './role-form';
import { deleteRole } from '@/app/(dashboard)/admin/_actions/roles';
import { useToast } from '@/app/_hooks/use-toast';
import { permissionFlags } from '@/app/(dashboard)/admin/_config/resources';

// Tipagem atualizada para incluir os detalhes que precisamos
export type RoleWithDetails = Role & {
  permissions: { permission: Permission }[];
  resourceLimits: ResourceLimit[];
  _count: { users: number };
};

interface RolesTableProps {
  roles: RoleWithDetails[];
  permissions: Permission[];
}

// Componente para renderizar os limites de forma bonita
const renderLimit = (role: RoleWithDetails, resource: string) => {
  const limit = role.resourceLimits.find(l => l.resource === resource);
  if (!limit) return <Badge variant="outline">0</Badge>;
  if (limit.limit === -1) return <Badge variant="secondary"><Infinity className="h-3 w-3 mr-1"/> Ilimitado</Badge>;
  return <Badge variant="default">{limit.limit}</Badge>;
};

export function RolesTable({ roles, permissions }: RolesTableProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithDetails | null>(null);
  const { toast } = useToast();

  const handleEdit = (role: RoleWithDetails) => {
    setSelectedRole(role);
    setIsFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setIsFormModalOpen(true);
  };
  
  const handleDeleteRequest = (role: RoleWithDetails) => {
    setSelectedRole(role);
    setIsDeleteAlertOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedRole) return;
    setIsDeleting(true);
    const result = await deleteRole(selectedRole.id);

    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setIsDeleteAlertOpen(false);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
    setIsDeleting(false);
  };

  const handleFormFinished = () => {
    setIsFormModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreateNew}>Criar Novo Perfil</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perfil</TableHead>
              <TableHead>Usuários</TableHead>
              {/* Cabeçalhos dinâmicos para os recursos mais importantes */}
              <TableHead>Exames</TableHead>
              <TableHead>Consultas</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead className="w-[64px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div>{role.name}</div>
                  <div className="text-xs text-muted-foreground">{role.description || '-'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{role._count.users}</Badge>
                </TableCell>
                {/* Células que mostram os limites */}
                <TableCell>{renderLimit(role, 'exams')}</TableCell>
                <TableCell>{renderLimit(role, 'consultas')}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {/* Mostra apenas as permissões de flag como badges */}
                  {role.permissions
                    .filter(({ permission }) => permissionFlags.includes(permission.name))
                    .map(({ permission }) => (
                      <Badge key={permission.id} variant='secondary'>{permission.description || permission.name}</Badge>
                  ))}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(role)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteRequest(role)} className="text-red-600">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? 'Editar Perfil' : 'Criar Novo Perfil'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-1 pr-4">
            <RoleForm 
              role={selectedRole} 
              permissions={permissions} 
              onFinished={handleFormFinished} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o perfil
              <strong> &quot;{selectedRole?.name}&quot;</strong> e removerá a associação de todos os usuários vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
