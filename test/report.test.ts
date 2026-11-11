import { describe, expect, it } from 'vitest';
import {
  createFallbackForCase,
  createSafetyReport,
  detectSafetyConcern,
  generateCaseId,
  normalizeAppealReport,
  normalizeReport,
  RawAppealReportSchema,
  RawReportSchema,
} from '../api/_lib/report';
import { InvestigationReportSchema } from '../src/types';
import { buildOriginalReportSummary, formatCaseDate } from '../src/utils/report';
import { RAW_REPORT } from './helpers';

describe('Report normalization and post-processing', () => {
  it('clamps the score and derives the verdict server-side', () => {
    const raw = RawReportSchema.parse({ ...RAW_REPORT, deluluScore: 999 });
    const report = normalizeReport(raw, { caseId: 'DP-2026-1234', category: 'Crush' });

    expect(report.deluluScore).toBe(100);
    expect(report.verdict).toBe('DELULU PRO MAX');
    expect(InvestigationReportSchema.safeParse(report).success).toBe(true);
  });

  it('derives INNOCENT for low scores even if the model implied otherwise', () => {
    const raw = RawReportSchema.parse({ ...RAW_REPORT, deluluScore: -20 });
    const report = normalizeReport(raw, { caseId: 'DP-2026-1234', category: 'Crush' });

    expect(report.deluluScore).toBe(0);
    expect(report.verdict).toBe('INNOCENT');
  });

  it('strips HTML and caps oversized arrays and strings', () => {
    const raw = RawReportSchema.parse({
      ...RAW_REPORT,
      caseTitle: '<script>alert(1)</script>Safe title',
      evidence: ['<b>Fact one</b>', 'x'.repeat(400), 'Fact one', '', 'Extra 1', 'Extra 2', 'Extra 3'],
      advice: Array.from({ length: 10 }, (_, index) => `Advice ${index}`),
    });
    const report = normalizeReport(raw, { caseId: 'DP-2026-1234', category: 'Life' });

    expect(report.caseTitle).toBe('Safe title');
    expect(report.evidence).toHaveLength(5);
    expect(report.evidence[0]).toBe('Fact one');
    expect(report.evidence[1]!.length).toBeLessThanOrEqual(240);
    expect(report.advice).toHaveLength(4);
    expect(report.evidence.filter((item) => item === 'Fact one')).toHaveLength(1);
  });

  it('turns a triggered safety response into a calm, score-free report', () => {
    const raw = RawReportSchema.parse({
      ...RAW_REPORT,
      safety: { triggered: true, message: 'Please talk to someone you trust.' },
    });
    const report = normalizeReport(raw, { caseId: 'DP-2026-1234', category: 'Relationship' });

    expect(report.safety.triggered).toBe(true);
    expect(report.safety.message).toBe('Please talk to someone you trust.');
    expect(report.caseTitle).toBe('Officer Stepping Out of Character');
    expect(report.roastSummary).toBe('');
    expect(report.evidence).toHaveLength(0);
  });

  it('falls back to a kind message when the model triggers safety without a message', () => {
    const raw = RawReportSchema.parse({
      ...RAW_REPORT,
      safety: { triggered: true },
    });
    const report = normalizeReport(raw, { caseId: 'DP-2026-1234', category: 'Other' });

    expect(report.safety.triggered).toBe(true);
    expect(report.safety.message).toMatch(/support/i);
  });

  it('computes appeal score change and preserves the appeal outcome', () => {
    const raw = RawAppealReportSchema.parse({
      ...RAW_REPORT,
      deluluScore: 70,
      appealOutcome: 'APPEAL GRANTED',
      appealExplanation: 'The new screenshot actually supports the claim.',
    });
    const report = normalizeAppealReport(raw, {
      caseId: 'DP-2026-1234',
      category: 'Crush',
      originalScore: 40,
    });

    expect(report.appealOutcome).toBe('APPEAL GRANTED');
    expect(report.scoreChange).toBe(30);
    expect(report.appealExplanation).toContain('new screenshot');
    expect(InvestigationReportSchema.safeParse(report).success).toBe(true);
  });

  it('generates case IDs in the documented format', () => {
    expect(generateCaseId(new Date('2026-11-11T00:00:00Z'))).toMatch(/^DP-2026-\d{4}$/);
  });

  it('detects obvious safety-sensitive language for the fallback path', () => {
    expect(detectSafetyConcern('He threatened me and I am scared.')).toBe(true);
    expect(detectSafetyConcern('I want to end my life.')).toBe(true);
    expect(detectSafetyConcern('He viewed my story in two minutes.')).toBe(false);
  });

  it('never uses comedy for an obvious safety case when the AI is unavailable', () => {
    const report = createFallbackForCase({
      caseDescription: 'My partner hit me last night and I am scared to go home.',
      category: 'Relationship',
      caseId: 'DP-2026-1234',
    });

    expect(report.safety.triggered).toBe(true);
    expect(report.roastSummary).toBe('');
    expect(report.fallback).toBe(true);
  });

  it('produces a schema-valid safety report', () => {
    const report = createSafetyReport({ caseId: 'DP-2026-1234', category: 'Life' });
    expect(InvestigationReportSchema.safeParse(report).success).toBe(true);
  });

  it('builds a bounded appeal summary from the original report', () => {
    const raw = RawReportSchema.parse(RAW_REPORT);
    const report = normalizeReport(raw, { caseId: 'DP-2026-1234', category: 'Crush' });
    const summary = buildOriginalReportSummary(report);

    expect(summary).toContain('The Two-Minute Story View');
    expect(summary).toContain('82/100');
    expect(summary.length).toBeLessThanOrEqual(1200);
  });

  it('formats dates defensively', () => {
    expect(formatCaseDate(undefined)).toBe('Unknown date');
    expect(formatCaseDate('not-a-date')).toBe('Unknown date');
    expect(formatCaseDate('2026-11-11T10:00:00.000Z')).not.toBe('Unknown date');
  });
});
