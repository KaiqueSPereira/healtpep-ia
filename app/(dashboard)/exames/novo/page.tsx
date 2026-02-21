import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ExameFormWrapper } from "../components/ExameFormWrapper";

export default function NewExamePage() {
  return (
    <div className="h-full overflow-y-auto bg-muted/20 px-4 py-8 md:px-10 lg:px-20">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-gray-600" />}>
        <ExameFormWrapper />
      </Suspense>
    </div>
  )
}
