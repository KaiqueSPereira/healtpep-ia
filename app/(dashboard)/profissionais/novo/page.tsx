import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ProfissionalFormWrapper } from "../_components/ProfissionalFormWrapper";

export default function ProfissionalPage(){
   return (
    <div>
    <Suspense fallback={<Loader2 className="h-10 w-10animate-spin text-gray-600" />}>
      <ProfissionalFormWrapper />
    </Suspense>
    </div>
   )
}

