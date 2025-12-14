'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    // Definir o valor inicial
    setValue(result.matches);

    // Adicionar listener para mudanças
    result.addEventListener('change', onChange);

    // Limpar o listener ao desmontar o componente
    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
}
