'use client';

import { useState, useEffect } from 'react';

// Hook customizado para "atrasar" a atualização de um valor.
// Isto é útil para evitar fazer pedidos a uma API a cada tecla pressionada.
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura um temporizador para atualizar o valor "atrasado" após o delay especificado
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay || 500); // 500ms como padrão

    // Limpa o temporizador se o valor mudar antes do delay ter passado
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
