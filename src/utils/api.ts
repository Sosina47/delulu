import {
  InvestigationReportSchema,
  type AppealRequest,
  type InvestigationReport,
  type InvestigationRequest,
} from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function postJson(url: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      'The precinct radio is down. Check your connection and try again.',
      0,
      'NETWORK_ERROR'
    );
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const payload = (data ?? {}) as { error?: unknown; code?: unknown };
    const message =
      typeof payload.error === 'string' && payload.error.length > 0
        ? payload.error
        : 'The precinct returned an unexpected response. Please try again.';
    const code = typeof payload.code === 'string' ? payload.code : 'UNKNOWN';
    throw new ApiError(message, response.status, code);
  }

  const parsed = InvestigationReportSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      'The detective filed an unreadable report. Please try the investigation again.',
      response.status,
      'INVALID_REPORT'
    );
  }

  return parsed.data;
}

export async function investigateCase(
  request: InvestigationRequest,
  signal?: AbortSignal
): Promise<InvestigationReport> {
  const data = await postJson('/api/investigate', request, signal);
  return InvestigationReportSchema.parse(data);
}

export async function submitAppeal(
  request: AppealRequest,
  signal?: AbortSignal
): Promise<InvestigationReport> {
  const data = await postJson('/api/appeal', request, signal);
  return InvestigationReportSchema.parse(data);
}
