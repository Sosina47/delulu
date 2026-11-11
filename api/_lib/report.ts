import { z } from 'zod';
import {
  APPEAL_OUTCOMES,
  type Category,
  type InvestigationReport,
} from '../../src/types';
import { clampScore, createFallbackReport, deriveVerdict } from '../../src/utils/scoring';
import { sanitizeHtml } from '../../src/utils/sanitize';

export const DEFAULT_SAFETY_MESSAGE =
  'This sounds like it might be more than a delulu moment, and you deserve real support. Please talk to someone you trust or contact a local support service. You are not alone.';

const RawSafetySchema = z.object({
  triggered: z.boolean(),
  message: z.string().optional(),
});

export const RawReportSchema = z.object({
  caseTitle: z.string(),
  deluluScore: z.coerce.number(),
  evidence: z.array(z.string()),
  assumptions: z.array(z.string()),
  redFlags: z.array(z.string()),
  greenFlags: z.array(z.string()),
  alternativeExplanations: z.array(z.string()),
  advice: z.array(z.string()),
  investigatorFindings: z.string(),
  roastSummary: z.string(),
  finalStatement: z.string(),
  safety: RawSafetySchema.optional(),
});

export type RawReport = z.infer<typeof RawReportSchema>;

export const RawAppealReportSchema = RawReportSchema.extend({
  appealOutcome: z.enum(APPEAL_OUTCOMES),
  appealExplanation: z.string(),
});

export type RawAppealReport = z.infer<typeof RawAppealReportSchema>;

function cleanText(value: unknown, maxLength: number, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = sanitizeHtml(value).replace(/\s+/g, ' ').trim();
  return (cleaned || fallback).slice(0, maxLength).trim();
}

function cleanList(values: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = cleanText(value, maxLength);
    if (!cleaned || seen.has(cleaned.toLowerCase())) {
      continue;
    }
    seen.add(cleaned.toLowerCase());
    result.push(cleaned);
    if (result.length >= maxItems) {
      break;
    }
  }
  return result;
}

export function generateCaseId(now = new Date()): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `DP-${now.getFullYear()}-${digits}`;
}

interface NormalizeParams {
  caseId: string;
  category: Category;
  createdAt?: string;
  fallback?: boolean;
}

/**
 * Converts untrusted model output into a safe, schema-valid report:
 * clamps the score, derives the verdict, trims/caps every field and strips HTML.
 */
export function normalizeReport(raw: RawReport, params: NormalizeParams): InvestigationReport {
  const createdAt = params.createdAt ?? new Date().toISOString();
  const safetyTriggered = raw.safety?.triggered === true;

  if (safetyTriggered) {
    return createSafetyReport({
      caseId: params.caseId,
      category: params.category,
      message: raw.safety?.message,
      createdAt,
      fallback: params.fallback,
    });
  }

  const deluluScore = clampScore(raw.deluluScore);

  return {
    caseId: params.caseId,
    caseTitle: cleanText(raw.caseTitle, 100, `The ${params.category} Case`),
    category: params.category,
    deluluScore,
    verdict: deriveVerdict(deluluScore),
    evidence: cleanList(raw.evidence, 5, 240),
    assumptions: cleanList(raw.assumptions, 5, 240),
    redFlags: cleanList(raw.redFlags, 5, 240),
    greenFlags: cleanList(raw.greenFlags, 5, 240),
    alternativeExplanations: cleanList(raw.alternativeExplanations, 4, 240),
    advice: cleanList(raw.advice, 4, 280),
    investigatorFindings: cleanText(
      raw.investigatorFindings,
      700,
      'The investigation is complete. The evidence has been filed under "vibes".'
    ),
    roastSummary: cleanText(
      raw.roastSummary,
      180,
      'Your Honor, the evidence is doing an enormous amount of heavy lifting today.'
    ),
    finalStatement: cleanText(
      raw.finalStatement,
      280,
      'Case closed pending further non-delusional evidence.'
    ),
    safety: { triggered: false },
    fallback: params.fallback ?? false,
    createdAt,
  };
}

export function normalizeAppealReport(
  raw: RawAppealReport,
  params: NormalizeParams & { originalScore: number }
): InvestigationReport {
  const base = normalizeReport(raw, params);

  return {
    ...base,
    appealOutcome: raw.appealOutcome,
    appealExplanation: cleanText(
      raw.appealExplanation,
      500,
      'The court reviewed the new evidence and reached its conclusion.'
    ),
    scoreChange: base.deluluScore - params.originalScore,
  };
}

export function createSafetyReport(params: {
  caseId: string;
  category: Category;
  message?: string;
  createdAt?: string;
  fallback?: boolean;
}): InvestigationReport {
  return {
    caseId: params.caseId,
    caseTitle: 'Officer Stepping Out of Character',
    category: params.category,
    deluluScore: 0,
    verdict: deriveVerdict(0),
    evidence: [],
    assumptions: [],
    redFlags: [],
    greenFlags: [],
    alternativeExplanations: [],
    advice: [],
    investigatorFindings: '',
    roastSummary: '',
    finalStatement: '',
    safety: {
      triggered: true,
      message: cleanText(params.message, 400, DEFAULT_SAFETY_MESSAGE),
    },
    fallback: params.fallback,
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}

const SAFETY_PATTERNS: RegExp[] = [
  /\b(abuse|abusive|abusing)\b/i,
  /\b(hit|hits|hitting|beat|beats|beating|punch|punched|choke|choked)\s+(me|her|him|them)\b/i,
  /\b(domestic violence|physical violence|sexual assault|rape|molest)\b/i,
  /\b(self[- ]?harm|suicid|kill myself|kill herself|kill himself|end my life|want to die)\b/i,
  /\b(threaten|threatened|threatening|blackmail|coerc)\b/i,
  /\b(stalk|stalking|harass|harassing)\b/i,
  /\b(underage|i am a minor|he is a minor|she is a minor|they are a minor)\b/i,
];

/**
 * Lightweight safeguard used ONLY when Gemini is unavailable. It prevents the
 * canned comedy fallback from being shown for obvious safety-sensitive cases.
 */
export function detectSafetyConcern(text: string): boolean {
  return SAFETY_PATTERNS.some((pattern) => pattern.test(text));
}

export function createFallbackForCase(params: {
  caseDescription: string;
  category: Category;
  caseId: string;
  reason?: string;
}): InvestigationReport {
  const sanitizedDescription = cleanText(params.caseDescription, 600);

  if (detectSafetyConcern(sanitizedDescription)) {
    return createSafetyReport({
      caseId: params.caseId,
      category: params.category,
      fallback: true,
    });
  }

  return createFallbackReport({
    caseDescription: sanitizedDescription,
    category: params.category,
    caseId: params.caseId,
    reason: params.reason,
  });
}
