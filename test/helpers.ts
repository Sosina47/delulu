import type { IncomingMessage } from 'http';
import type { ApiResponse } from '../api/_lib/http';

export const RAW_REPORT = {
  caseTitle: 'The Two-Minute Story View',
  deluluScore: 82,
  evidence: ['He viewed the story within two minutes.'],
  assumptions: ['He is secretly in love with me.'],
  redFlags: ['Tracking view timestamps.'],
  greenFlags: ['He follows me.'],
  alternativeExplanations: ['He happened to open Instagram.'],
  advice: ['Wait for an actual conversation.'],
  investigatorFindings: 'The evidence is thin but the narrative is thick.',
  roastSummary: 'A story view is not a marriage proposal, Your Honor.',
  finalStatement: 'Case closed pending a real conversation.',
  safety: { triggered: false },
};

export interface MockResponseState {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

export function makeResponse(): { res: ApiResponse; state: MockResponseState } {
  const state: MockResponseState = { statusCode: 0, body: null, headers: {} };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(data: unknown) {
      state.body = data;
      return res;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return res;
    },
    end(data?: string) {
      if (data) state.body = JSON.parse(data);
    },
    headersSent: false,
  };

  return { res: res as unknown as ApiResponse, state };
}

export function makeRequest(
  body: unknown,
  options: { ip?: string; method?: string } = {}
): IncomingMessage & { body?: unknown } {
  return {
    method: options.method ?? 'POST',
    body,
    headers: { 'x-forwarded-for': options.ip ?? '203.0.113.7' },
    socket: { remoteAddress: options.ip ?? '203.0.113.7' },
  } as unknown as IncomingMessage & { body?: unknown };
}

export function geminiOk(payload: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] }, finishReason: 'STOP' }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export function geminiRawText(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export function geminiHttpError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
