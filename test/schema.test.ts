import { describe, expect, it } from 'vitest';
import { InvestigationRequestSchema, InvestigationReportSchema } from '../src/types';

describe('Zod Validation Schemas', () => {
  describe('InvestigationRequestSchema', () => {
    it('should validate a correct request', () => {
      const valid = {
        caseDescription: 'He watched my Instagram story within two minutes of posting.',
        category: 'Crush',
      };
      const result = InvestigationRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject descriptions under 15 characters', () => {
      const invalid = {
        caseDescription: 'Too short',
        category: 'Crush',
      };
      const result = InvestigationRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 15 characters');
      }
    });

    it('should reject descriptions over 600 characters', () => {
      const invalid = {
        caseDescription: 'a'.repeat(601),
        category: 'Crush',
      };
      const result = InvestigationRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('not exceed 600 characters');
      }
    });

    it('should reject invalid categories', () => {
      const invalid = {
        caseDescription: 'Valid description length here for test.',
        category: 'Astrology',
      };
      const result = InvestigationRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('InvestigationReportSchema', () => {
    it('should reject deluluScore outside 0-100', () => {
      const invalidReport = {
        caseId: 'DP-2026-1234',
        caseTitle: 'Test Case',
        category: 'Crush',
        deluluScore: 120, // out of range
        verdict: 'DELULU PRO MAX',
        evidence: ['He smiled'],
        assumptions: ['He wants to marry me'],
        redFlags: ['Stalking his LinkedIn'],
        greenFlags: ['He exists'],
        alternativeExplanations: ['He was just looking at the clock behind me'],
        advice: ['Touch grass'],
        investigatorFindings: 'Classic over-interpretation.',
        roastSummary: 'A smile is not a legal contract.',
        finalStatement: 'Case closed.',
        safety: { triggered: false },
      };
      const result = InvestigationReportSchema.safeParse(invalidReport);
      expect(result.success).toBe(false);
    });

    it('should reject invalid verdict string', () => {
      const invalidReport = {
        caseId: 'DP-2026-1234',
        caseTitle: 'Test Case',
        category: 'Crush',
        deluluScore: 50,
        verdict: 'SOMEWHAT_CRAZY', // invalid verdict
        evidence: ['He smiled'],
        assumptions: ['He wants to marry me'],
        redFlags: ['Stalking his LinkedIn'],
        greenFlags: ['He exists'],
        alternativeExplanations: ['He was just looking at the clock behind me'],
        advice: ['Touch grass'],
        investigatorFindings: 'Classic over-interpretation.',
        roastSummary: 'A smile is not a legal contract.',
        finalStatement: 'Case closed.',
        safety: { triggered: false },
      };
      const result = InvestigationReportSchema.safeParse(invalidReport);
      expect(result.success).toBe(false);
    });
  });
});

