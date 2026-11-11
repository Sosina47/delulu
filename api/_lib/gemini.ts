import { SYSTEM_PROMPT } from './prompts';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiConfigError';
  }
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function extractText(data: GeminiApiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    const reason = data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason ?? 'empty response';
    throw new GeminiError(`Gemini returned no usable content (${reason}).`);
  }

  return text;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

async function callGeminiOnce(prompt: string, responseSchema: unknown): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiConfigError('GEMINI_API_KEY is not configured on the server.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        getModel()
      )}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
        signal: controller.signal,
      }
    );

    const raw = await response.text();
    let data: GeminiApiResponse;
    try {
      data = JSON.parse(raw) as GeminiApiResponse;
    } catch {
      throw new GeminiError(`Gemini returned a non-JSON HTTP response (status ${response.status}).`);
    }

    if (!response.ok) {
      throw new GeminiError(
        `Gemini request failed with status ${response.status}: ${data.error?.message ?? 'unknown error'}`
      );
    }

    const text = stripCodeFences(extractText(data));
    try {
      return JSON.parse(text);
    } catch {
      throw new GeminiError('Gemini returned malformed JSON.');
    }
  } catch (error) {
    if (error instanceof GeminiConfigError || error instanceof GeminiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GeminiError('Gemini request timed out after 20 seconds.', error);
    }
    throw new GeminiError('Gemini request failed.', error);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calls Gemini with JSON mode, retrying once when the response is malformed or
 * fails schema validation. Configuration errors are not retried.
 */
export async function generateWithRetry<T>(params: {
  prompt: string;
  responseSchema: unknown;
  parse: (value: unknown) => T;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const json = await callGeminiOnce(params.prompt, params.responseSchema);
      return params.parse(json);
    } catch (error) {
      lastError = error;
      if (error instanceof GeminiConfigError) {
        throw error;
      }
      console.warn(`[gemini] attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiError('Gemini request failed.');
}
