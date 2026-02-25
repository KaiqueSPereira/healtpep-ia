'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_components/ui/popover';
import { Button } from '@/app/_components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/app/_components/ui/command';
import { cn } from '@/app/_lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

interface ComboboxFormProps {
  form: UseFormReturn<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  name: string;
  label: string;
  placeholder: string;
  options: string[];
}

export function ComboboxForm({ form, name, label, placeholder, options }: ComboboxFormProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value
                    ? options.find((option) => option === field.value)
                    : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
              <Command>
                <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
                <CommandEmpty>Nenhum resultado.</CommandEmpty>
                <CommandGroup>
                    <div className="overflow-y-auto max-h-60">
                        {options.map((option) => (
                        <CommandItem
                            value={option}
                            key={option}
                            onSelect={() => {
                            form.setValue(name, option);
                            }}
                        >
                            <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                option === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                            />
                            {option}
                        </CommandItem>
                        ))}
                    </div>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
