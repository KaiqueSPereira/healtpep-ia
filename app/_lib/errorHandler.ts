const LOG_ENDPOINT = '/api/logs';

function formatError(error: any) {
  return {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };
}

async function sendErrorLog(errorData: any) {
  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    });
  } catch (logError) {
    console.error("Falha ao enviar o log de erro para o servidor:", logError);
  }
}

function handleError(error: Error) {
  const formattedError = formatError(error);
  console.error("Erro não tratado capturado:", formattedError);
  sendErrorLog(formattedError);
}

function handleUnhandledRejection(event: PromiseRejectionEvent) {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  const formattedError = formatError(error);
  console.error("Rejeição de promessa não tratada capturada:", formattedError);
  sendErrorLog(formattedError);
}

export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event: ErrorEvent) => {
      handleError(event.error);
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      handleUnhandledRejection(event);
    });
  }
}
