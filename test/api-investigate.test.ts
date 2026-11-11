import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import investigateHandler from '../api/investigate';
import { resetRateLimit } from '../api/_lib/rateLimit';
import { InvestigationReportSchema } from '../src/types';
import {
  geminiHttpError,
  geminiOk,
  geminiRawText,
  makeRequest,
  makeResponse,
  RAW_REPORT,
} from './helpers';

const VALID_BODY = {
  caseDescription: 'He watched my Instagram story within two minutes. I think he loves me.',
  category: 'Crush',
};

describe('POST /api/investigate', () => {
  beforeEach(() => {
    resetRateLimit();
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    vi.stubEnv('GEMINI_MODEL', 'gemini-test');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetRateLimit();
  });

  it('returns a validated, server-derived report for a valid Gemini response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiOk(RAW_REPORT));
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY), res);

    expect(state.statusCode).toBe(200);
    const report = InvestigationReportSchema.parse(state.body);
    expect(report.deluluScore).toBe(82);
    expect(report.verdict).toBe('DELULU PRO MAX');
    expect(report.caseId).toMatch(/^DP-\d{4}-\d{4}$/);
    expect(report.fallback).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
  });

  it('retries once on malformed JSON, then returns the in-character fallback', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiRawText('this is not json'));
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY), res);

    expect(state.statusCode).toBe(200);
    const report = InvestigationReportSchema.parse(state.body);
    expect(report.fallback).toBe(true);
    expect(report.verdict).toBe('GUILTY');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries once on schema-invalid JSON, then falls back', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiOk({ nope: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY), res);

    expect(state.statusCode).toBe(200);
    expect(InvestigationReportSchema.parse(state.body).fallback).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles a Gemini timeout/abort gracefully', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY), res);

    expect(state.statusCode).toBe(200);
    expect(InvestigationReportSchema.parse(state.body).fallback).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns a fallback when Gemini responds with an HTTP error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiHttpError(503, 'Service unavailable'));
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY), res);

    expect(state.statusCode).toBe(200);
    expect(InvestigationReportSchema.parse(state.body).fallback).toBe(true);
  });

  it('returns a fallback when GEMINI_API_KEY is missing (no retry)', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY), res);

    expect(state.statusCode).toBe(200);
    const report = InvestigationReportSchema.parse(state.body);
    expect(report.fallback).toBe(true);
    expect(report.investigatorFindings).toContain('GEMINI_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the calm safety screen when Gemini triggers safety', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      geminiOk({
        ...RAW_REPORT,
        safety: { triggered: true, message: 'Please reach out to someone you trust.' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY), res);

    const report = InvestigationReportSchema.parse(state.body);
    expect(report.safety.triggered).toBe(true);
    expect(report.safety.message).toContain('someone you trust');
    expect(report.roastSummary).toBe('');
  });

  it('uses the safety fallback for obvious safety cases when Gemini is down', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const { res, state } = makeResponse();
    await investigateHandler(
      makeRequest({
        caseDescription: 'My partner threatened me and I am scared to go home tonight.',
        category: 'Relationship',
      }),
      res
    );

    const report = InvestigationReportSchema.parse(state.body);
    expect(report.safety.triggered).toBe(true);
    expect(report.fallback).toBe(true);
  });

  it('rejects an invalid body with 400', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await investigateHandler(makeRequest({ caseDescription: 'short', category: 'Crush' }), res);

    expect(state.statusCode).toBe(400);
    expect((state.body as { code: string }).code).toBe('INVALID_INPUT');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects non-POST methods with 405', async () => {
    const { res, state } = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY, { method: 'GET' }), res);

    expect(state.statusCode).toBe(405);
  });

  it('rate limits repeated requests with a friendly 429', async () => {
    vi.stubEnv('RATE_LIMIT_PER_MIN', '1');
    const fetchMock = vi.fn().mockResolvedValue(geminiOk(RAW_REPORT));
    vi.stubGlobal('fetch', fetchMock);

    const first = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY, { ip: '198.51.100.9' }), first.res);
    expect(first.state.statusCode).toBe(200);

    const second = makeResponse();
    await investigateHandler(makeRequest(VALID_BODY, { ip: '198.51.100.9' }), second.res);
    expect(second.state.statusCode).toBe(429);
    expect((second.state.body as { code: string }).code).toBe('RATE_LIMITED');
  });
});
