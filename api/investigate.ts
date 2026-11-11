import type { IncomingMessage } from 'http';
import { InvestigationRequestSchema } from '../src/types';
import { generateWithRetry, GeminiConfigError, GeminiError } from './_lib/gemini';
import {
  getClientIp,
  HttpError,
  methodNotAllowed,
  readJsonBody,
  sendError,
  sendJson,
  type ApiResponse,
} from './_lib/http';
import { checkRateLimit, getRateLimit } from './_lib/rateLimit';
import { buildInvestigationPrompt, INVESTIGATION_RESPONSE_SCHEMA } from './_lib/prompts';
import {
  createFallbackForCase,
  generateCaseId,
  normalizeReport,
  RawReportSchema,
} from './_lib/report';

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ApiResponse
): Promise<void> {
  if (req.method && req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  const rate = checkRateLimit(getClientIp(req), getRateLimit());
  if (!rate.allowed) {
    res.setHeader?.('Retry-After', String(rate.retryAfterSeconds));
    sendError(
      res,
      429,
      `The precinct is swamped. Please wait ${rate.retryAfterSeconds} seconds and file again.`,
      'RATE_LIMITED'
    );
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    if (error instanceof HttpError) {
      sendError(res, error.statusCode, error.message, error.code);
      return;
    }
    sendError(res, 400, 'Could not read the case file.', 'INVALID_BODY');
    return;
  }

  const parsed = InvestigationRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid case file.';
    sendError(res, 400, message, 'INVALID_INPUT');
    return;
  }

  const { caseDescription, category } = parsed.data;
  const caseId = generateCaseId();

  try {
    const raw = await generateWithRetry({
      prompt: buildInvestigationPrompt(caseDescription, category),
      responseSchema: INVESTIGATION_RESPONSE_SCHEMA,
      parse: (value) => RawReportSchema.parse(value),
    });

    const report = normalizeReport(raw, { caseId, category });
    sendJson(res, 200, report);
  } catch (error) {
    // A missing key or Gemini outage must not break the demo: return the
    // in-character canned verdict instead, flagged as a fallback.
    console.error(
      '[api/investigate] Gemini unavailable, using fallback:',
      error instanceof Error ? error.message : error
    );

    const reason =
      error instanceof GeminiConfigError
        ? 'Radio dispatch reports no Gemini credentials at precinct HQ, so Lead Detective Spark completed this report manually. Add GEMINI_API_KEY for a live investigation.'
        : error instanceof GeminiError
          ? 'Radio interference cut the live Gemini feed, so Lead Detective Spark completed this report manually.'
          : undefined;

    const fallback = createFallbackForCase({
      caseDescription,
      category,
      caseId,
      reason,
    });
    sendJson(res, 200, fallback);
  }
}
