import { Skeleton } from "@/app/_components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/app/_components/ui/card";

const ConsultaPageSkeleton = () => {
  return (
    <div>
      {/* Header com botões */}
      <div className="relative w-full px-5 py-6">
        <Skeleton className="h-10 w-10 absolute left-5 top-6" />
        <div className="absolute right-5 top-6 flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <main className="container mx-auto px-5 py-6 space-y-6">
        {/* Card de Detalhes da Consulta */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Skeleton className="h-5 w-24 mr-2" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-5 w-24 mr-2" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-5 w-24 mr-2" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Card de Anexos */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Card de Anotações */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ConsultaPageSkeleton;
