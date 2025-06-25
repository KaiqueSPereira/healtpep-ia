import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ExameFormWrapper } from "../components/ExameFormWrapper";

export default function NewExamePage() {
  return (
    <div className="pb-20">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-gray-600" />}>
        <ExameFormWrapper />
      </Suspense>
    </div>
  )
}
