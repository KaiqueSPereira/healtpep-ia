
'use client';

import { useState, useTransition } from 'react';

import { Check, ChevronsUpDown } from "lucide-react";
import { getUsersAndRoles, updateUserRole } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/_components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/_components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/_components/ui/avatar';
import { Button } from '@/app/_components/ui/button';
import { toast } from '@/app/_hooks/use-toast';
import { cn } from '@/lib/utils';

// Tipos para os dados que o componente recebe
type User = Awaited<ReturnType<typeof getUsersAndRoles>>['users'][0];
type Role = Awaited<ReturnType<typeof getUsersAndRoles>>['roles'][0];

interface UserTableProps {
  initialUsers: User[];
  initialRoles: Role[];
}

export function UserTable({ initialUsers, initialRoles }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, newRoleId: string) => {
    const currentUser = users.find(u => u.id === userId);
    if (currentUser?.role?.id === newRoleId) {
      return;
    }

    startTransition(async () => {
      try {
        await updateUserRole(userId, newRoleId);
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId
              ? { ...u, role: initialRoles.find(r => r.id === newRoleId) || null }
              : u
          )
        );
        toast({
            title: 'Sucesso',
            description: 'Perfil atualizado com sucesso!',
        })
      } catch (error) {
        // Extrai a mensagem de erro específica vinda da Server Action
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";

        toast({
            title: 'Operação Falhou',
            description: errorMessage, // Exibe a mensagem de erro específica
            variant: 'destructive'
        })
      }
    });
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
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
                    <Button variant="outline" className="w-48 justify-between">
                      {user.role?.name || 'Sem perfil'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {initialRoles.map((role) => (
                      <DropdownMenuItem
                        key={role.id}
                        onSelect={() => handleRoleChange(user.id, role.id)}
                        disabled={isPending}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            user.role?.id === role.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {role.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
