// app/(dashboard)/admin/logs/page.tsx
import { db } from "@/app/_lib/prisma";
import { LogsTable } from "../_components/logs-table";
import { LogToolbar } from "../_components/log-toolbar";
import { Prisma } from '@prisma/client';
import { ClearLogsButton } from "../_components/clear-logs-button";

const LOGS_PER_PAGE = 20;

// searchParams em Componentes de Servidor Async são objetos.
interface AdminLogsPageProps {
  searchParams: {
    query?: string;
    level?: string;
    component?: string;
    page?: string;
  };
}

export default async function AdminLogsPage({ searchParams }: AdminLogsPageProps) {
  
  const { query, level, component, page } = searchParams;
  const currentPage = Number(page) || 1;

  const skip = (currentPage - 1) * LOGS_PER_PAGE;

  const where: Prisma.ActionLogWhereInput = {};

  if (query) {
    where.OR = [
      { message: { contains: query, mode: 'insensitive' } },
      { stack: { contains: query, mode: 'insensitive' } },
      { action: { contains: query, mode: 'insensitive' } },
      { userId: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (level) {
    where.level = { equals: level, mode: 'insensitive' };
  }

  if (component) {
    where.component = { contains: component, mode: 'insensitive' };
  }

  const [logs, totalLogs, distinctComponents] = await db.$transaction([
    db.actionLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: LOGS_PER_PAGE,
      skip,
    }),
    db.actionLog.count({ where }),
    db.actionLog.findMany({
      distinct: ['component'],
      select: {
        component: true,
      },
      where: {
        component: {
          not: null,
        },
      },
    }),
  ]);

  const componentNames = distinctComponents.map(c => c.component!);

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);
  
  const safeSearchParams = new URLSearchParams();
  if (query) safeSearchParams.set("query", query);
  if (level) safeSearchParams.set("level", level);
  if (component) safeSearchParams.set("component", component);

  return (
    <div className="w-full p-4 md:p-6">
       <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Revise os logs de ações e erros para monitorar a saúde da aplicação.
          </p>
        </div>
      </div>
      <LogToolbar 
        componentNames={componentNames}
        initialFilters={{ query, component }}
        actions={<ClearLogsButton />}
      />
      <div className="mt-4">
        <LogsTable 
          logs={logs} 
          currentPage={currentPage} 
          totalPages={totalPages}
          pathname="/admin/logs"
          searchParams={safeSearchParams}
        />
      </div>
    </div>
  );
}
