import { Suspense } from "react";
import { UnidadeFormWrapper } from "../_components/UnidadeFormWhapper";
import { Loader2 } from "lucide-react";


export default function UnidadePage() {
  return (
    <div>
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-gray-600" />}>
        <UnidadeFormWrapper />
      </Suspense>
    </div>
  );
}