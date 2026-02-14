'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { ErrorLog } from '@prisma/client';
import { Input } from '@/app/_components/ui/input';
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
  DialogTrigger,
  DialogDescription,
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
  initialLogs: ErrorLog[];
  currentPage: number;
  totalPages: number;
  pathname: string; // Recebendo o pathname como prop
}

const truncate = (str: string | null, length: number) => {
  if (!str) return 'N/A';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export function LogsTable({ initialLogs, currentPage, totalPages, pathname }: LogsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return initialLogs;
    const lowercasedQuery = searchQuery.toLowerCase();
    return initialLogs.filter(log =>
      log.message.toLowerCase().includes(lowercasedQuery) ||
      (log.url && log.url.toLowerCase().includes(lowercasedQuery))
    );
  }, [initialLogs, searchQuery]);

  const createPageURL = (page: number) => {
    return `${pathname}?page=${page}`;
  };
  
  const renderPaginationItems = () => {
    const items = [];
    // Show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink href={createPageURL(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Ellipsis after first page
    if (currentPage > 3) {
      items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
    }

    // Pages around current page
    for (let page = currentPage - 1; page <= currentPage + 1; page++) {
      if (page > 1 && page < totalPages) {
        items.push(
          <PaginationItem key={page}>
            <PaginationLink href={createPageURL(page)} isActive={page === currentPage}>
              {page}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    // Ellipsis before last page
    if (currentPage < totalPages - 2) {
      items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
    }

    // Show last page
    if (totalPages > 1) {
        items.push(
            <PaginationItem key={totalPages}>
            <PaginationLink href={createPageURL(totalPages)} isActive={currentPage === totalPages}>
                {totalPages}
            </PaginationLink>
            </PaginationItem>
        );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Input
          placeholder="Filtrar logs na página atual..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          Nenhum log encontrado para a busca atual.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Stack</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log: ErrorLog) => (
                <TableRow key={log.id}>
                  <TableCell suppressHydrationWarning>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                  <TableCell>{truncate(log.url, 40)}</TableCell>
                  <TableCell>{truncate(log.message, 100)}</TableCell>
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
                          <DialogDescription className="text-left pt-4">
                            <p><strong>ID:</strong> {log.id}</p>
                            <p suppressHydrationWarning><strong>Horário:</strong> {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</p>
                            <p><strong>URL:</strong> {log.url || 'N/A'}</p>
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
    </div>
  );
}
