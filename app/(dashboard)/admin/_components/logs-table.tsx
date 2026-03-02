'use client';

import { format } from 'date-fns';
import type { ActionLog } from '@prisma/client';
import { Button } from '@/app/_components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/app/_components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/app/_components/ui/pagination';

interface LogsTableProps {
  logs: ActionLog[];
  currentPage: number;
  totalPages: number;
  pathname: string;
  searchParams: URLSearchParams;
}

const truncate = (str: string | null, length: number) => {
  if (!str) return 'N/A';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export function LogsTable({ logs, currentPage, totalPages, pathname, searchParams }: LogsTableProps) {

  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    return `${pathname}?${params.toString()}`;
  };
  
  const renderPaginationItems = () => {
    const items = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        items.push(<PaginationItem key={1}><PaginationLink href={createPageURL(1)}>1</PaginationLink></PaginationItem>);
        if (startPage > 2) {
            items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }
    }

    for (let page = startPage; page <= endPage; page++) {
        items.push(
            <PaginationItem key={page}>
                <PaginationLink href={createPageURL(page)} isActive={page === currentPage}>
                    {page}
                </PaginationLink>
            </PaginationItem>
        );
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }
        items.push(<PaginationItem key={totalPages}><PaginationLink href={createPageURL(totalPages)}>{totalPages}</PaginationLink></PaginationItem>);
    }

    return items;
  };

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          Nenhum log encontrado para os filtros aplicados.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Componente</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Stack</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: ActionLog) => (
                <TableRow key={log.id}>
                  <TableCell suppressHydrationWarning>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                  <TableCell>{truncate(log.component, 40)}</TableCell>
                  <TableCell>{truncate(log.message, 80)}</TableCell>
                  <TableCell>
                    <code className="text-xs whitespace-pre-wrap break-words">
                      {truncate(log.stack, 100)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Ver</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Log</DialogTitle>
                          <DialogDescription asChild className="text-left pt-4">
                           <div>
                            <div><strong>ID:</strong> {log.id}</div>
                            <div suppressHydrationWarning><strong>Horário:</strong> {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</div>
                             <div><strong>Componente:</strong> {log.component || 'N/A'}</div>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Mensagem</h4>
                            <p className="text-sm text-muted-foreground break-words">{log.message}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold">Stack Trace</h4>
                            <code className="block bg-muted p-2 rounded-md text-xs whitespace-pre-wrap break-words">
                              {log.stack || 'N/A'}
                            </code>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href={createPageURL(currentPage - 1)}
                            className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
                        />
                    </PaginationItem>
                    {renderPaginationItems()}
                    <PaginationItem>
                        <PaginationNext
                            href={createPageURL(currentPage + 1)}
                            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
      )}
    </div>
  );
}
