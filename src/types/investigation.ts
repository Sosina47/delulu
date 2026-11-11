import { z } from 'zod';

export const MIN_CASE_LENGTH = 15;
export const MAX_CASE_LENGTH = 600;
export const MAX_HISTORY_ITEMS = 20;

export const CATEGORIES = [
  'Crush',
  'Relationship',
  'Friendship',
  'Career',
  'Life',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const VERDICTS = [
  'INNOCENT',
  'SLIGHTLY DELULU',
  'GUILTY',
  'DELULU PRO MAX',
] as const;

export type Verdict = (typeof VERDICTS)[number];

export const APPEAL_OUTCOMES = [
  'APPEAL GRANTED',
  'APPEAL PARTIALLY GRANTED',
  'APPEAL DENIED',
] as const;

export type AppealOutcome = (typeof APPEAL_OUTCOMES)[number];

export const SafetySchema = z.object({
  triggered: z.boolean(),
  message: z.string().max(400).optional(),
});

export type Safety = z.infer<typeof SafetySchema>;

export const InvestigationRequestSchema = z.object({
  caseDescription: z
    .string()
    .trim()
    .min(MIN_CASE_LENGTH, `Case description must be at least ${MIN_CASE_LENGTH} characters.`)
    .max(MAX_CASE_LENGTH, `Case description must not exceed ${MAX_CASE_LENGTH} characters.`),
  category: z.enum(CATEGORIES),
});

export type InvestigationRequest = z.infer<typeof InvestigationRequestSchema>;

export const InvestigationReportSchema = z.object({
  caseId: z.string().min(1).max(40),
  caseTitle: z.string().min(1).max(100),
  category: z.enum(CATEGORIES),
  deluluScore: z.number().int().min(0).max(100),
  verdict: z.enum(VERDICTS),
  evidence: z.array(z.string().max(240)).max(5),
  assumptions: z.array(z.string().max(240)).max(5),
  redFlags: z.array(z.string().max(240)).max(5),
  greenFlags: z.array(z.string().max(240)).max(5),
  alternativeExplanations: z.array(z.string().max(240)).max(4),
  advice: z.array(z.string().max(280)).max(4),
  investigatorFindings: z.string().max(700),
  roastSummary: z.string().max(180),
  finalStatement: z.string().max(280),
  safety: SafetySchema,
  appealOutcome: z.enum(APPEAL_OUTCOMES).optional(),
  appealExplanation: z.string().max(500).optional(),
  scoreChange: z.number().int().min(-100).max(100).optional(),
  fallback: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export type InvestigationReport = z.infer<typeof InvestigationReportSchema>;

export const AppealRequestSchema = z.object({
  originalCase: InvestigationRequestSchema,
  originalReportSummary: z.string().trim().min(1).max(1200),
  originalScore: z.number().int().min(0).max(100),
  caseId: z.string().min(1).max(40).optional(),
  newEvidence: z
    .string()
    .trim()
    .min(MIN_CASE_LENGTH, `New evidence must be at least ${MIN_CASE_LENGTH} characters.`)
    .max(MAX_CASE_LENGTH, `New evidence must not exceed ${MAX_CASE_LENGTH} characters.`),
});

export type AppealRequest = z.infer<typeof AppealRequestSchema>;

export const CaseRecordSchema = z.object({
  id: z.string().min(1).max(40),
  createdAt: z.string(),
  caseDescription: z.string().max(MAX_CASE_LENGTH),
  category: z.enum(CATEGORIES),
  report: InvestigationReportSchema,
  appeal: z
    .object({
      newEvidence: z.string().max(MAX_CASE_LENGTH),
      report: InvestigationReportSchema,
      createdAt: z.string(),
    })
    .optional(),
});

export type CaseRecord = z.infer<typeof CaseRecordSchema>;

export const CaseRecordListSchema = z.array(CaseRecordSchema);

export type FlowState = 'idle' | 'investigating' | 'verdict' | 'appealing' | 'error';

export const EXAMPLE_CASES: Array<{ category: Category; text: string }> = [
  {
    category: 'Crush',
    text: 'He watched my Instagram story within two minutes. I think he is secretly in love with me and we are basically engaged.',
  },
  {
    category: 'Relationship',
    text: 'My partner liked an old photo of their ex from 2019. I am now convinced they are secretly planning to leave me.',
  },
  {
    category: 'Career',
    text: 'My manager said "good job" in the team chat. I have already planned my acceptance speech for CEO.',
  },
];
