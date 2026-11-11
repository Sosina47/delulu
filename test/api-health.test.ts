import { describe, expect, it } from 'vitest';
import healthHandler from '../api/health';
import type { IncomingMessage, ServerResponse } from 'http';

describe('Health Check API Endpoint', () => {
  it('should return status 200 with service metadata', async () => {
    let capturedCode = 0;
    let capturedData: any = null;

    const mockReq = {} as IncomingMessage;
    const mockRes = {
      status(code: number) {
        capturedCode = code;
        return this;
      },
      json(data: any) {
        capturedData = data;
        return this;
      },
    } as unknown as ServerResponse & { status: (c: number) => any; json: (d: any) => any };

    await healthHandler(mockReq, mockRes);

    expect(capturedCode).toBe(200);
    expect(capturedData).toBeDefined();
    expect(capturedData.status).toBe('ok');
    expect(capturedData.service).toBe('delulu-police-api');
    expect(capturedData.version).toBe('0.1.0');
    expect(capturedData.timestamp).toBeDefined();
  });
});

