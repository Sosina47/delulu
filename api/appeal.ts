import type { IncomingMessage } from 'http';
import { AppealRequestSchema } from '../src/types';
import { generateWithRetry, GeminiConfigError } from './_lib/gemini';
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
import { APPEAL_RESPONSE_SCHEMA, buildAppealPrompt } from './_lib/prompts';
import {
  generateCaseId,
  normalizeAppealReport,
  RawAppealReportSchema,
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
      `The appeals desk is swamped. Please wait ${rate.retryAfterSeconds} seconds and object again.`,
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
    sendError(res, 400, 'Could not read the appeal file.', 'INVALID_BODY');
    return;
  }

  const parsed = AppealRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid appeal.';
    sendError(res, 400, message, 'INVALID_INPUT');
    return;
  }

  const { originalCase, originalReportSummary, originalScore, caseId, newEvidence } = parsed.data;
  const appealCaseId = caseId ?? generateCaseId();

  try {
    const raw = await generateWithRetry({
      prompt: buildAppealPrompt({
        originalCaseDescription: originalCase.caseDescription,
        category: originalCase.category,
        originalReportSummary,
        originalScore,
        newEvidence,
      }),
      responseSchema: APPEAL_RESPONSE_SCHEMA,
      parse: (value) => RawAppealReportSchema.parse(value),
    });

    const report = normalizeAppealReport(raw, {
      caseId: appealCaseId,
      category: originalCase.category,
      originalScore,
    });

    sendJson(res, 200, report);
  } catch (error) {
    console.error(
      '[api/appeal] Gemini unavailable:',
      error instanceof Error ? error.message : error
    );

    const message =
      error instanceof GeminiConfigError
        ? 'The appeals desk needs a Gemini API key before it can review live evidence. Configure GEMINI_API_KEY and try again.'
        : 'The appeals desk lost radio contact with the detective. Your appeal was not used — please try again in a moment.';

    sendError(res, 502, message, 'AI_UNAVAILABLE');
  }
}
