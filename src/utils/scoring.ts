import type { Category, InvestigationReport, Verdict } from '../types';

/**
 * Clamps a score to an integer between 0 and 100.
 */
export function clampScore(score: number): number {
  if (Number.isNaN(score) || !Number.isFinite(score)) {
    return 50;
  }
  const rounded = Math.round(score);
  return Math.max(0, Math.min(100, rounded));
}

/**
 * Derives the official verdict strictly based on the score band.
 * - 0-25: INNOCENT
 * - 26-50: SLIGHTLY DELULU
 * - 51-75: GUILTY
 * - 76-100: DELULU PRO MAX
 */
export function deriveVerdict(score: number): Verdict {
  const clamped = clampScore(score);
  if (clamped <= 25) return 'INNOCENT';
  if (clamped <= 50) return 'SLIGHTLY DELULU';
  if (clamped <= 75) return 'GUILTY';
  return 'DELULU PRO MAX';
}

/**
 * Generates an in-character fallback report when AI services are unreachable or invalid.
 */
export function createFallbackReport(params: {
  caseDescription: string;
  category: Category;
  reason?: string;
  caseId?: string;
  createdAt?: string;
}): InvestigationReport {
  const score = 65;
  const now = new Date();
  const caseId = params.caseId ?? `DP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    caseId,
    caseTitle: `The Curious Incident of the ${params.category} Case`,
    category: params.category,
    deluluScore: score,
    verdict: deriveVerdict(score),
    evidence: [
      params.caseDescription.length > 150
        ? `${params.caseDescription.slice(0, 147)}...`
        : params.caseDescription,
    ],
    assumptions: [
      'Assumed that coincidences carry cosmic significance.',
      'Extrapolated minimal evidence into a full romantic drama.',
    ],
    redFlags: [
      'Over-analyzing micro-behaviors.',
      'Consulting friends until someone agreed with the delusion.',
    ],
    greenFlags: [
      'Self-awareness to file a report at Delulu Precinct.',
    ],
    alternativeExplanations: [
      'They were just being polite or distracted.',
      'The algorithm shows stories in random order, detective.',
    ],
    advice: [
      'Step away from social media forensics for at least 48 hours.',
      'Touch grass and accept that some actions mean absolutely nothing.',
    ],
    investigatorFindings:
      params.reason ||
      'Due to radio interference at precinct headquarters, Lead Detective Spark deployed manual field assessment protocol.',
    roastSummary:
      'Your Honor, the defendant has mistook polite behavior for a legally binding proclamation of eternal devotion.',
    finalStatement: 'Case placed on informal probation pending further non-delusional evidence.',
    safety: {
      triggered: false,
    },
    fallback: true,
    createdAt: params.createdAt ?? now.toISOString(),
  };
}

