import { describe, expect, it } from 'vitest';
import { clampScore, deriveVerdict, createFallbackReport } from '../src/utils/scoring';
import { InvestigationReportSchema } from '../src/types';

describe('Scoring and Verdict Engine', () => {
  describe('clampScore', () => {
    it('should clamp numbers below 0 to 0', () => {
      expect(clampScore(-15)).toBe(0);
      expect(clampScore(-1)).toBe(0);
    });

    it('should clamp numbers above 100 to 100', () => {
      expect(clampScore(101)).toBe(100);
      expect(clampScore(999)).toBe(100);
    });

    it('should round floating point scores to integers', () => {
      expect(clampScore(42.4)).toBe(42);
      expect(clampScore(42.6)).toBe(43);
    });

    it('should fallback to 50 for NaN or infinite values', () => {
      expect(clampScore(NaN)).toBe(50);
      expect(clampScore(Infinity)).toBe(50);
      expect(clampScore(-Infinity)).toBe(50);
    });

    it('should keep valid scores within 0-100 intact', () => {
      expect(clampScore(0)).toBe(0);
      expect(clampScore(25)).toBe(25);
      expect(clampScore(50)).toBe(50);
      expect(clampScore(75)).toBe(75);
      expect(clampScore(100)).toBe(100);
    });
  });

  describe('deriveVerdict', () => {
    it('should return INNOCENT for scores 0-25', () => {
      expect(deriveVerdict(0)).toBe('INNOCENT');
      expect(deriveVerdict(15)).toBe('INNOCENT');
      expect(deriveVerdict(25)).toBe('INNOCENT');
    });

    it('should return SLIGHTLY DELULU for scores 26-50', () => {
      expect(deriveVerdict(26)).toBe('SLIGHTLY DELULU');
      expect(deriveVerdict(38)).toBe('SLIGHTLY DELULU');
      expect(deriveVerdict(50)).toBe('SLIGHTLY DELULU');
    });

    it('should return GUILTY for scores 51-75', () => {
      expect(deriveVerdict(51)).toBe('GUILTY');
      expect(deriveVerdict(64)).toBe('GUILTY');
      expect(deriveVerdict(75)).toBe('GUILTY');
    });

    it('should return DELULU PRO MAX for scores 76-100', () => {
      expect(deriveVerdict(76)).toBe('DELULU PRO MAX');
      expect(deriveVerdict(85)).toBe('DELULU PRO MAX');
      expect(deriveVerdict(100)).toBe('DELULU PRO MAX');
    });

    it('should clamp out-of-bounds scores before deriving verdict', () => {
      expect(deriveVerdict(-50)).toBe('INNOCENT');
      expect(deriveVerdict(150)).toBe('DELULU PRO MAX');
    });
  });

  describe('createFallbackReport', () => {
    it('should generate a schema-valid fallback report', () => {
      const fallback = createFallbackReport({
        caseDescription: 'He liked my tweet from 2019 at 3 AM.',
        category: 'Crush',
      });

      expect(fallback.fallback).toBe(true);
      expect(fallback.category).toBe('Crush');
      expect(fallback.deluluScore).toBe(65);
      expect(fallback.verdict).toBe('GUILTY');
      expect(fallback.caseId).toMatch(/^DP-\d{4}-\d{4}$/);

      // Validate against the full Zod schema
      const parseResult = InvestigationReportSchema.safeParse(fallback);
      expect(parseResult.success).toBe(true);
    });
  });
});

