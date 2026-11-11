import type { InvestigationReport } from '../types';

/**
 * Builds a compact summary of the original report for the stateless appeal
 * endpoint. The backend re-validates the original case and this summary.
 */
export function buildOriginalReportSummary(report: InvestigationReport): string {
  const parts = [
    `Case: ${report.caseTitle}`,
    `Score: ${report.deluluScore}/100 (${report.verdict})`,
    report.evidence.length > 0 ? `Facts: ${report.evidence.join('; ')}` : '',
    report.assumptions.length > 0 ? `Assumptions: ${report.assumptions.join('; ')}` : '',
    `Findings: ${report.investigatorFindings}`,
    `Final statement: ${report.finalStatement}`,
  ].filter(Boolean);

  return parts.join('\n').slice(0, 1200);
}

export function formatCaseDate(iso: string | undefined): string {
  if (!iso) {
    return 'Unknown date';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCaseDateTime(iso: string | undefined): string {
  if (!iso) {
    return 'Unknown time';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
