import { Suspense } from 'react';
import ConfiguracoesClient from './ConfiguracoesClient';
import { Loader2 } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
      <ConfiguracoesClient />
    </Suspense>
  );
}
