import type { IncomingMessage, ServerResponse } from 'http';

export type ApiResponse = ServerResponse & {
  status?: (code: number) => ApiResponse;
  json?: (data: unknown) => ApiResponse;
};

const MAX_BODY_BYTES = 32 * 1024;

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Reads a JSON body from either the Vercel-provided req.body or the raw stream.
 */
export async function readJsonBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        throw new HttpError(400, 'Request body must be valid JSON.', 'INVALID_JSON');
      }
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Request body is too large.', 'BODY_TOO_LARGE');
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) {
    throw new HttpError(400, 'Request body is required.', 'EMPTY_BODY');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.', 'INVALID_JSON');
  }
}

export function sendJson(res: ApiResponse, statusCode: number, data: unknown): void {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
    return;
  }

  if (!res.headersSent) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
  }
  res.end(JSON.stringify(data));
}

export function sendError(res: ApiResponse, statusCode: number, message: string, code: string): void {
  sendJson(res, statusCode, { error: message, code });
}

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]!.split(',')[0]!.trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.length > 0) {
    return realIp;
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

export function methodNotAllowed(res: ApiResponse): void {
  sendError(res, 405, 'This endpoint only accepts POST requests.', 'METHOD_NOT_ALLOWED');
}
