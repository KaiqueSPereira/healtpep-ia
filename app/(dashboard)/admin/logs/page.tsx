import { prisma } from '@/app/_lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { LogsTable } from '@/app/(dashboard)/admin/_components/logs-table';
import { LogToolbar } from '@/app/(dashboard)/admin/_components/log-toolbar';
import { ClearLogsButton } from '@/app/(dashboard)/admin/_components/clear-logs-button';
import type { Prisma } from '@prisma/client';

const LOGS_PER_PAGE = 20;

interface SearchParams {
  page?: string;
  query?: string;
  component?: string;
  startDate?: string;
  endDate?: string;
}

async function getErrorLogs(searchParams: SearchParams) {
  const { 
    page = '1',
    query,
    component,
    startDate,
    endDate
  } = searchParams;

  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * LOGS_PER_PAGE;

  const where: Prisma.ErrorLogWhereInput = {};

  if (query) {
    where.OR = [
      { message: { contains: query, mode: 'insensitive' } },
      { stack: { contains: query, mode: 'insensitive' } },
      { component: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (component) {
    where.component = component;
  }

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      where.timestamp.gte = new Date(startDate);
    }
    if (endDate) {
      where.timestamp.lte = new Date(endDate);
    }
  }

  const [logs, totalLogs, componentNames] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: LOGS_PER_PAGE,
    }),
    prisma.errorLog.count({ where }),
    prisma.errorLog.findMany({
        distinct: ['component'],
        select: {
            component: true,
        },
        where: {
            component: {
                not: null,
            }
        }
    }).then(results => results.map(r => r.component!))
  ]);

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  return { logs, totalLogs, totalPages, componentNames, currentPage };
}

const AdminLogsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { logs, totalPages, componentNames, currentPage } = await getErrorLogs(searchParams);
  const pathname = '/admin/logs'; 
  
  const initialFilters = {
      query: searchParams.query || '',
      component: searchParams.component || '',
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Painel de Logs do Sistema</CardTitle>
          <CardDescription>
            Analise os logs de erro e eventos capturados pelo sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogToolbar 
            componentNames={componentNames} 
            initialFilters={initialFilters}
            actions={<ClearLogsButton />}
          />
          <LogsTable 
            logs={logs} 
            currentPage={currentPage} 
            totalPages={totalPages} 
            pathname={pathname}
            searchParams={new URLSearchParams(searchParams as any)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogsPage;
