import { prisma } from '@/app/_lib/prisma';
import type { ErrorLog } from '@prisma/client';
import Header from '@/app/_components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { LogsTable } from '@/app/admin/_components/logs-table';

const LOGS_PER_PAGE = 15;

async function getErrorLogs({ page }: { page: number }) {
  const skip = (page - 1) * LOGS_PER_PAGE;
  const [logs, totalLogs] = await Promise.all([
    prisma.errorLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: LOGS_PER_PAGE,
    }),
    prisma.errorLog.count(),
  ]);
  return { logs, totalLogs };
}

const AdminLogsPage = async ({ searchParams }: { searchParams: { page?: string } }) => {
  const currentPage = Number(searchParams.page) || 1;
  const { logs, totalLogs } = await getErrorLogs({ page: currentPage });
  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);
  const pathname = '/admin/logs'; // Definindo o pathname no servidor

  return (
    <div>
      <Header />
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Painel de Logs de Erro</CardTitle>
            <CardDescription>
              Aqui estão os erros mais recentes capturados pelo sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogsTable 
              initialLogs={logs} 
              currentPage={currentPage} 
              totalPages={totalPages} 
              pathname={pathname} // Passando o pathname como prop
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogsPage;
