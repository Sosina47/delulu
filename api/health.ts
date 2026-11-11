import type { IncomingMessage, ServerResponse } from 'http';

interface HealthResponse {
  status: 'ok';
  service: 'delulu-police-api';
  version: string;
  timestamp: string;
}

export default async function handler(
  _req: IncomingMessage,
  res: ServerResponse & { status?: (code: number) => any; json?: (data: any) => any }
) {
  const data: HealthResponse = {
    status: 'ok',
    service: 'delulu-police-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(data);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

