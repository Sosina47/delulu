import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { SoundName } from '../hooks/useSound';
import { MAX_CASE_LENGTH, MIN_CASE_LENGTH, type CaseRecord, type FlowState, type InvestigationReport } from '../types';
import { formatCaseDate } from '../utils/report';

interface ReportViewProps {
  report: InvestigationReport;
  activeCase: CaseRecord;
  status: FlowState;
  appealError: string | null;
  appealSubmitting: boolean;
  onStartAppeal: () => void;
  onCancelAppeal: () => void;
  onAppeal: (newEvidence: string) => void;
  onNewCase: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
  play: (name: SoundName) => void;
}

const VERDICT_STYLES: Record<
  InvestigationReport['verdict'],
  { color: string; border: string; bg: string; label: string }
> = {
  INNOCENT: {
    color: 'text-police-green',
    border: 'border-police-green',
    bg: 'bg-police-green/10',
    label: 'Case dismissed. Mildly grounded behaviour detected.',
  },
  'SLIGHTLY DELULU': {
    color: 'text-police-gold',
    border: 'border-police-gold',
    bg: 'bg-police-gold/15',
    label: 'A few assumptions slipped past security.',
  },
  GUILTY: {
    color: 'text-police-red',
    border: 'border-police-red',
    bg: 'bg-police-red/10',
    label: 'The evidence is not supporting the narrative.',
  },
  'DELULU PRO MAX': {
    color: 'text-police-stamp',
    border: 'border-police-stamp',
    bg: 'bg-police-stamp/10',
    label: 'A cinematic universe built on one (1) data point.',
  },
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener?.('change', listener);
    return () => query.removeEventListener?.('change', listener);
  }, []);

  return reduced;
}

function ReportSection({
  title,
  subtitle,
  items,
  emptyText,
  icon,
  delay,
  accent = 'border-police-charcoal/20',
}: {
  title: string;
  subtitle?: string;
  items: string[];
  emptyText: string;
  icon: string;
  delay: number;
  accent?: string;
}) {
  return (
    <section
      className={`reveal-item rounded border ${accent} bg-police-paper/70 p-3.5`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="flex items-center gap-1.5 font-stamp text-[11px] uppercase tracking-widest text-police-charcoal">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 font-typewriter text-[10px] uppercase tracking-wide text-police-muted">
          {subtitle}
        </p>
      )}
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="flex gap-2 font-typewriter text-xs leading-relaxed text-police-ink sm:text-[13px]"
            >
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-police-charcoal/40" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 font-typewriter text-xs italic text-police-muted">{emptyText}</p>
      )}
    </section>
  );
}

export default function ReportView({
  report,
  activeCase,
  status,
  appealError,
  appealSubmitting,
  onStartAppeal,
  onCancelAppeal,
  onAppeal,
  onNewCase,
  onOpenShare,
  onOpenHistory,
  play,
}: ReportViewProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [newEvidence, setNewEvidence] = useState('');
  const [appealInputError, setAppealInputError] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const stampSoundRef = useRef(false);

  const reportKey = `${report.caseId}-${report.deluluScore}-${report.appealOutcome ?? 'original'}`;
  const style = VERDICT_STYLES[report.verdict];
  const appealUsed = Boolean(activeCase.appeal);
  const originalScore =
    typeof report.scoreChange === 'number' ? report.deluluScore - report.scoreChange : undefined;

  useEffect(() => {
    if (reducedMotion) {
      setDisplayScore(report.deluluScore);
      return;
    }
    setDisplayScore(0);
    let frame = 0;
    const started = performance.now();
    const duration = 1150;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(report.deluluScore * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [report.deluluScore, reportKey, reducedMotion]);

  useEffect(() => {
    stampSoundRef.current = false;
    if (reducedMotion) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!stampSoundRef.current) {
        stampSoundRef.current = true;
        play('stamp');
      }
    }, 1200);
    return () => window.clearTimeout(timer);
    // Intentionally keyed by the report so muting does not replay the stamp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey, reducedMotion]);

  function handleAppealSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (appealSubmitting) return;
    const trimmed = newEvidence.trim();
    if (trimmed.length < MIN_CASE_LENGTH) {
      setAppealInputError(`The appeals desk needs at least ${MIN_CASE_LENGTH} characters.`);
      return;
    }
    setAppealInputError(null);
    onAppeal(trimmed);
  }

  const sectionBase = reducedMotion ? 0 : 1450;

  return (
    <section aria-labelledby="verdict-title" className="animate-paper-in">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onNewCase}
          className="min-h-[44px] rounded border border-police-charcoal/30 bg-police-paper px-3 py-1.5 font-stamp text-[10px] uppercase tracking-widest text-police-charcoal transition hover:border-police-charcoal hover:bg-police-cream"
        >
          ← New case
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenHistory}
            className="min-h-[44px] rounded border border-police-charcoal/30 bg-police-paper px-3 py-1.5 font-stamp text-[10px] uppercase tracking-widest text-police-charcoal transition hover:border-police-charcoal hover:bg-police-cream"
          >
            Case files
          </button>
          <button
            type="button"
            onClick={onOpenShare}
            className="min-h-[44px] rounded border-2 border-police-charcoal bg-police-gold px-3 py-1.5 font-stamp text-[10px] uppercase tracking-widest text-police-charcoal shadow-button transition hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 active:shadow-none"
          >
            Share verdict
          </button>
        </div>
      </div>

      <article
        key={reportKey}
        className="report-paper relative overflow-hidden rounded border-2 border-police-charcoal bg-police-paper shadow-card"
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-3 rotate-3 border-y-2 border-police-charcoal/30 bg-police-tape/70 px-12 py-1 font-stamp text-[9px] uppercase tracking-[0.3em] text-police-charcoal/70"
        >
          Confidential
        </div>

        <header className="border-b-2 border-dashed border-police-charcoal/40 px-4 pb-3 pt-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-typewriter text-[10px] uppercase tracking-widest text-police-muted">
            <span>Delulu Police Department • Official Verdict</span>
            <span>{formatCaseDate(report.createdAt ?? activeCase.createdAt)}</span>
          </div>
          <h2
            id="verdict-title"
            className="mt-2 text-2xl uppercase leading-tight text-police-charcoal sm:text-3xl"
          >
            {report.caseTitle}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-typewriter text-[10px] text-police-muted">
            <span className="rounded border border-police-charcoal/30 bg-police-cream px-2 py-0.5 uppercase tracking-widest">
              Case {report.caseId}
            </span>
            <span className="rounded border border-police-charcoal/30 bg-police-cream px-2 py-0.5 uppercase tracking-widest">
              {report.category}
            </span>
            {report.fallback && (
              <span className="rounded border border-police-gold bg-police-gold/20 px-2 py-0.5 font-bold uppercase tracking-widest text-police-charcoal">
                Manual field report
              </span>
            )}
          </div>
        </header>

        <div className="px-4 pb-5 pt-5 sm:px-6">
          <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="font-stamp text-[10px] uppercase tracking-[0.25em] text-police-muted">
                Delulu score
              </p>
              <div className="mt-1 flex items-end gap-2">
                <span
                  className={`font-display text-6xl leading-none sm:text-7xl ${style.color}`}
                  aria-label={`Delulu score ${report.deluluScore} out of 100`}
                >
                  {displayScore}
                </span>
                <span className="mb-1 font-typewriter text-xs text-police-muted">/ 100</span>
              </div>
              <div className="mt-3 h-3 w-full max-w-sm overflow-hidden rounded-full border border-police-charcoal/30 bg-police-cream">
                <div
                  className={`h-full transition-[width] duration-300 ${
                    report.verdict === 'INNOCENT'
                      ? 'bg-police-green'
                      : report.verdict === 'SLIGHTLY DELULU'
                        ? 'bg-police-gold'
                        : report.verdict === 'GUILTY'
                          ? 'bg-police-red'
                          : 'bg-police-stamp'
                  }`}
                  style={{ width: `${displayScore}%` }}
                />
              </div>
              <div className="mt-1 flex max-w-sm justify-between font-typewriter text-[9px] uppercase tracking-wider text-police-muted">
                <span>Innocent</span>
                <span>Delulu</span>
              </div>
            </div>

            <div
              className={`stamp-slam mx-auto flex h-28 w-28 rotate-[-8deg] flex-col items-center justify-center rounded-full border-4 sm:h-32 sm:w-32 ${style.border} ${style.bg} ${style.color}`}
              style={{ animationDelay: reducedMotion ? '0ms' : '1150ms' }}
            >
              <span className="font-stamp text-[8px] uppercase tracking-[0.2em]">Verdict</span>
              <span className="mt-0.5 px-1 text-center font-display text-sm uppercase leading-tight sm:text-base">
                {report.verdict}
              </span>
              <span className="mt-1 font-stamp text-[7px] uppercase tracking-[0.2em]">Certified</span>
            </div>
          </div>

          <p className="mt-4 border-l-4 border-police-stamp bg-police-cream/70 px-3 py-2 font-typewriter text-sm italic leading-relaxed text-police-charcoal">
            “{report.roastSummary}”
          </p>

          {report.appealOutcome && (
            <div className="mt-4 rounded border-2 border-police-charcoal bg-police-cream p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="stamp-badge -rotate-1 border-police-stamp text-[10px] text-police-stamp">
                  {report.appealOutcome}
                </span>
                {typeof report.scoreChange === 'number' && (
                  <span
                    className={`font-typewriter text-xs font-bold ${
                      report.scoreChange > 0
                        ? 'text-police-red'
                        : report.scoreChange < 0
                          ? 'text-police-green'
                          : 'text-police-muted'
                    }`}
                  >
                    {report.scoreChange > 0 ? '+' : ''}
                    {report.scoreChange} points
                    {typeof originalScore === 'number' && (
                      <span className="ml-1 font-normal text-police-muted">
                        (was {originalScore})
                      </span>
                    )}
                  </span>
                )}
              </div>
              {report.appealExplanation && (
                <p className="mt-2 font-typewriter text-xs leading-relaxed text-police-ink">
                  {report.appealExplanation}
                </p>
              )}
            </div>
          )}

          <div className="mt-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <ReportSection
                title="Evidence"
                subtitle="Facts you actually stated"
                items={report.evidence}
                emptyText="No concrete facts were submitted. The vibes were doing all the work."
                icon="📎"
                delay={sectionBase}
              />
              <ReportSection
                title="Assumptions"
                subtitle="Leaps the court could not verify"
                items={report.assumptions}
                emptyText="Suspiciously grounded. No major assumptions detected."
                icon="🌀"
                delay={sectionBase + 120}
                accent="border-police-stamp/30"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ReportSection
                title="Red flags"
                subtitle="Risky reasoning, not a diagnosis"
                items={report.redFlags}
                emptyText="No major red flags. The court is pleasantly surprised."
                icon="🚩"
                delay={sectionBase + 240}
                accent="border-police-red/30"
              />
              <ReportSection
                title="Green flags"
                subtitle="Grounded observations"
                items={report.greenFlags}
                emptyText="No green flags submitted. Consider touching grass."
                icon="🟢"
                delay={sectionBase + 360}
                accent="border-police-green/30"
              />
            </div>

            <ReportSection
              title="Alternative explanations"
              subtitle="Reality's boring but plausible version"
              items={report.alternativeExplanations}
              emptyText="The court could not find a calmer explanation, which is unusual."
              icon="🔎"
              delay={sectionBase + 480}
            />

            <ReportSection
              title="Investigator findings"
              subtitle="Lead Detective Spark, reporting"
              items={[report.investigatorFindings]}
              emptyText="The detective filed a blank page. Suspicious."
              icon="🗒️"
              delay={sectionBase + 600}
              accent="border-police-charcoal/40"
            />

            <ReportSection
              title="Advice"
              subtitle="Court-ordered reality checks"
              items={report.advice}
              emptyText="No advice required. The court is as shocked as you are."
              icon="⚖️"
              delay={sectionBase + 720}
            />

            <div
              className="reveal-item rounded border-2 border-police-charcoal bg-police-cream p-3.5"
              style={{ animationDelay: `${sectionBase + 840}ms` }}
            >
              <h3 className="font-stamp text-[11px] uppercase tracking-widest text-police-charcoal">
                Final statement
              </h3>
              <p className="mt-1.5 font-typewriter text-sm font-bold leading-relaxed text-police-charcoal">
                {report.finalStatement}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-police-charcoal/30 pt-2 font-typewriter text-[9px] uppercase tracking-widest text-police-muted">
                <span>Signed, Lead Detective Spark</span>
                <span>{report.verdict}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded border border-dashed border-police-charcoal/40 bg-police-cream/50 p-3">
            <p className="font-stamp text-[10px] uppercase tracking-widest text-police-muted">
              Case file (your words)
            </p>
            <p className="mt-1 line-clamp-3 font-typewriter text-xs leading-relaxed text-police-ink">
              {activeCase.caseDescription}
            </p>
          </div>
        </div>
      </article>

      <div className="mt-4 space-y-3">
        {status === 'appealing' ? (
          <form
            onSubmit={handleAppealSubmit}
            className="animate-paper-in rounded border-2 border-police-stamp bg-police-paper p-4 shadow-folder"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg uppercase text-police-stamp">
                Your Honor, I OBJECT
              </h3>
              <button
                type="button"
                onClick={onCancelAppeal}
                disabled={appealSubmitting}
                className="min-h-[44px] rounded border border-police-charcoal/30 px-3 font-stamp text-[10px] uppercase tracking-widest text-police-muted hover:border-police-charcoal hover:text-police-charcoal disabled:opacity-50"
              >
                Withdraw
              </button>
            </div>
            <p className="mt-1 font-typewriter text-xs text-police-muted">
              Present new evidence or a legal argument. One appeal per case. The original case
              file stays attached.
            </p>
            <label htmlFor="appeal-evidence" className="mt-3 block font-stamp text-[10px] uppercase tracking-widest">
              New evidence
            </label>
            <textarea
              id="appeal-evidence"
              value={newEvidence}
              onChange={(event) => {
                setNewEvidence(event.target.value);
                if (appealInputError) setAppealInputError(null);
              }}
              rows={3}
              maxLength={MAX_CASE_LENGTH}
              disabled={appealSubmitting}
              placeholder="He also replied with three fire emojis. This changes everything."
              className="mt-1 w-full resize-none rounded border-2 border-police-charcoal/60 bg-police-paper px-3 py-2 font-typewriter text-sm focus:border-police-charcoal focus:outline-none focus:ring-2 focus:ring-police-stamp/30 disabled:opacity-60"
            />
            <div className="mt-1 flex items-start justify-between gap-2">
              <p className="font-typewriter text-xs text-police-red">
                {appealInputError ?? appealError ?? ''}
              </p>
              <span className="shrink-0 font-typewriter text-xs text-police-muted">
                {newEvidence.length}/{MAX_CASE_LENGTH}
              </span>
            </div>
            <button
              type="submit"
              disabled={appealSubmitting}
              className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded border-2 border-police-charcoal bg-police-stamp px-4 font-display text-sm uppercase tracking-wide text-white shadow-button transition hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {appealSubmitting ? 'Reviewing appeal...' : 'Submit appeal'}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={onStartAppeal}
            disabled={appealUsed}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded border-2 border-police-stamp bg-police-paper px-4 py-2 font-display text-sm uppercase tracking-wide text-police-stamp shadow-folder transition hover:-translate-y-0.5 hover:bg-police-stamp hover:text-white active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:border-police-charcoal/30 disabled:text-police-muted disabled:shadow-none"
          >
            {appealUsed ? 'Appeal already filed' : 'Your Honor, I OBJECT'}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenShare}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded border-2 border-police-charcoal bg-police-gold px-3 py-2 font-stamp text-[11px] uppercase tracking-widest text-police-charcoal shadow-button transition hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 active:shadow-none"
          >
            Share verdict
          </button>
          <button
            type="button"
            onClick={onNewCase}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded border-2 border-police-charcoal bg-police-paper px-3 py-2 font-stamp text-[11px] uppercase tracking-widest text-police-charcoal shadow-folder transition hover:-translate-y-0.5 hover:bg-police-cream active:translate-y-0 active:shadow-none"
          >
            File another
          </button>
        </div>

        <p className="text-center font-typewriter text-[10px] text-police-muted">
          {style.label}
        </p>
      </div>
    </section>
  );
}
