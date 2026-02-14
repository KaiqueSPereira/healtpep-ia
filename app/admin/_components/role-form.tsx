'use client';

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/app/_hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { Separator } from "@/app/_components/ui/separator";
import { createOrUpdateRole } from "@/app/admin/_actions/roles";
import type { Role, Permission, ResourceLimit } from "@prisma/client";
import {
  manageableResources,
  tieredResources,
  permissionFlags
} from '@/app/admin/_config/resources';

// Tipagem expandida para incluir os novos limites de recursos
type RoleWithDetails = Role & {
  permissions: { permission: Permission }[];
  resourceLimits: ResourceLimit[];
};

interface RoleFormProps {
  role: RoleWithDetails | null;
  permissions: Permission[];
  onFinished: () => void;
}

// Schema do formulário atualizado
const formSchema = z.object({
  name: z.string().min(2, { message: "O nome do perfil deve ter pelo menos 2 caracteres." }),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
  resourceLimits: z.record(z.string()).optional(),
});

export function RoleForm({ role, permissions, onFinished }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Filtra as permissões que são apenas flags, usando a configuração
  const flagPermissions = permissions.filter(p => permissionFlags.includes(p.name));

  // Transforma os limites de recursos do perfil (se existir) em um objeto fácil de usar
  const initialResourceLimits = role?.resourceLimits.reduce((acc, limit) => {
    acc[limit.resource] = String(limit.limit);
    return acc;
  }, {} as Record<string, string>) || {};

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissionIds: role?.permissions.map(p => p.permission.id) || [],
      resourceLimits: initialResourceLimits,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const dataToSend = {
      id: role?.id,
      ...values,
    };

    const result = await createOrUpdateRole(dataToSend);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message || "Perfil salvo com sucesso!",
      });
      onFinished();
    } else {
      toast({
        title: "Erro ao Salvar",
        description: result.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Perfil</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Plano Básico" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Acesso limitado para novos clientes" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Seção para Limites de Recursos */}
        <div>
          <h3 className="text-lg font-medium">Limites de Recursos</h3>
          <p className="text-sm text-muted-foreground">Defina as quantidades para cada recurso. Use -1 para ilimitado.</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Object.entries(manageableResources).map(([key, label]) => (
              <FormField
                key={key}
                control={form.control}
                name={`resourceLimits.${key}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => form.setValue(`resourceLimits.${key}`, '-1')}
                        disabled={isSubmitting || field.value === '-1'}
                      >
                        Ilimitado
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Seção para Permissões de Acesso (Flags) */}
        <div>
          <h3 className="text-lg font-medium">Permissões de Acesso</h3>
          <p className="text-sm text-muted-foreground">Defina o que este perfil pode ou não pode fazer.</p>
          <div className="grid grid-cols-2 gap-y-3 mt-4">
            {flagPermissions.map((permission) => (
              <FormField
                key={permission.id}
                control={form.control}
                name="permissionIds"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        disabled={isSubmitting}
                        checked={field.value?.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          const newValue = field.value || [];
                          if (checked) {
                            field.onChange([...newValue, permission.id]);
                          } else {
                            field.onChange(newValue.filter((value) => value !== permission.id));
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{permission.description || permission.name}</FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}
