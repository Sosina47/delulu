import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import appealHandler from '../api/appeal';
import { resetRateLimit } from '../api/_lib/rateLimit';
import { InvestigationReportSchema } from '../src/types';
import { geminiOk, makeRequest, makeResponse, RAW_REPORT } from './helpers';

const VALID_APPEAL = {
  originalCase: {
    caseDescription: 'He watched my Instagram story within two minutes. I think he loves me.',
    category: 'Crush',
  },
  originalReportSummary: 'Case: The Story View. Score: 40/100. He is probably just online.',
  originalScore: 40,
  caseId: 'DP-2026-4242',
  newEvidence: 'He actually replied to my message and asked me out for coffee.',
};

const RAW_APPEAL = {
  ...RAW_REPORT,
  deluluScore: 70,
  appealOutcome: 'APPEAL GRANTED',
  appealExplanation: 'The coffee invitation is a real, stated fact that changes the conclusion.',
};

describe('POST /api/appeal', () => {
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

  it('returns the appealed report with outcome and server-computed score change', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiOk(RAW_APPEAL));
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await appealHandler(makeRequest(VALID_APPEAL), res);

    expect(state.statusCode).toBe(200);
    const report = InvestigationReportSchema.parse(state.body);
    expect(report.caseId).toBe('DP-2026-4242');
    expect(report.appealOutcome).toBe('APPEAL GRANTED');
    expect(report.scoreChange).toBe(30);
    expect(report.appealExplanation).toContain('coffee');
  });

  it('preserves the original case context in the Gemini prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiOk(RAW_APPEAL));
    vi.stubGlobal('fetch', fetchMock);

    const { res } = makeResponse();
    await appealHandler(makeRequest(VALID_APPEAL), res);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    const prompt = payload.contents[0]!.parts[0]!.text;
    expect(prompt).toContain(VALID_APPEAL.originalCase.caseDescription);
    expect(prompt).toContain(VALID_APPEAL.newEvidence);
    expect(prompt).toContain('40');
  });

  it('rejects an invalid appeal with 400', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await appealHandler(
      makeRequest({ ...VALID_APPEAL, newEvidence: 'too short', originalScore: 500 }),
      res
    );

    expect(state.statusCode).toBe(400);
    expect((state.body as { code: string }).code).toBe('INVALID_INPUT');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 502 without consuming the appeal when Gemini fails twice', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await appealHandler(makeRequest(VALID_APPEAL), res);

    expect(state.statusCode).toBe(502);
    expect((state.body as { code: string }).code).toBe('AI_UNAVAILABLE');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('explains a missing API key instead of crashing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeResponse();
    await appealHandler(makeRequest(VALID_APPEAL), res);

    expect(state.statusCode).toBe(502);
    expect((state.body as { error: string }).error).toContain('GEMINI_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
