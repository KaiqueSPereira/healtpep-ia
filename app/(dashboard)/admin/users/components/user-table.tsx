'use client';

import { useState, useTransition, useMemo } from 'react';
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { deleteUser, getUsersAndRoles, updateUserRole } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/_components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/_components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/_components/ui/avatar';
import { Button } from '@/app/_components/ui/button';
import { toast } from '@/app/_hooks/use-toast';
import { cn } from '@/app/_lib/utils';
import { Input } from '@/app/_components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/_components/ui/alert-dialog';

// Tipos para os dados
type User = Awaited<ReturnType<typeof getUsersAndRoles>>['users'][0];
type Role = Awaited<ReturnType<typeof getUsersAndRoles>>['roles'][0];

interface UserTableProps {
  initialUsers: User[];
  initialRoles: Role[];
}

export function UserTable({ initialUsers, initialRoles }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Filtra os usuários com base na barra de pesquisa
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const lowercasedQuery = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name?.toLowerCase().includes(lowercasedQuery) || 
      user.email?.toLowerCase().includes(lowercasedQuery)
    );
  }, [users, searchQuery]);

  const handleRoleChange = (userId: string, newRoleId: string) => {
    if (users.find(u => u.id === userId)?.role?.id === newRoleId) return;

    startTransition(async () => {
      try {
        await updateUserRole(userId, newRoleId);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: initialRoles.find(r => r.id === newRoleId) || null } : u));
        toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso!' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        toast({ title: 'Operação Falhou', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    startTransition(async () => {
      try {
        await deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId)); // Remove o usuário da lista local
        toast({ title: 'Sucesso', description: 'Usuário apagado com sucesso!' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        toast({ title: 'Operação Falhou', description: errorMessage, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Input 
          placeholder="Pesquisar por nome ou e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.image || ''} alt={user.name || ''} />
                      <AvatarFallback>{user.name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-48 justify-between" disabled={isPending}>
                        {user.role?.name || 'Sem perfil'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {initialRoles.map((role) => (
                        <DropdownMenuItem key={role.id} onSelect={() => handleRoleChange(user.id, role.id)}>
                          <Check className={cn('mr-2 h-4 w-4', user.role?.id === role.id ? 'opacity-100' : 'opacity-0')}/>
                          {role.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" disabled={isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso irá apagar permanentemente o usuário <span className="font-bold">{user.name}</span> do sistema.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                          Apagar Usuário
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredUsers.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                Nenhum usuário encontrado.
            </div>
        )}
      </div>
    </div>
  );
}
