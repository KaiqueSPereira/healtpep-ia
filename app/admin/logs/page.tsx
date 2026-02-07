import { format } from 'date-fns';
import type { ErrorLog } from '@prisma/client';
import { prisma } from '@/app/_lib/prisma';

async function getErrorLogs(): Promise<ErrorLog[]> {
  const logs = await prisma.errorLog.findMany({
    orderBy: {
      timestamp: 'desc',
    },
  });
  return logs;
}

const AdminLogsPage = async () => {
  const logs = await getErrorLogs();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
        Painel de Logs de Erro
      </h1>
      <p>Aqui estão os erros mais recentes capturados pelo sistema.</p>
      <div style={{ marginTop: '2rem' }}>
        {logs.length === 0 ? (
          <p>Nenhum log de erro encontrado.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Horário</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>URL</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Mensagem</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Stack</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: ErrorLog, index: number) => (
                <tr key={log.id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' }}>
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' }}>{log.url || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' }}>{log.message}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', verticalAlign: 'top' }}>
                    <code style={{ fontSize: '0.85em' }}>{log.stack || 'N/A'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminLogsPage;
