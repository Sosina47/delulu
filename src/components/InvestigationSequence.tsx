import { useEffect, useState } from 'react';
import type { Category } from '../types';

const STATUS_LINES = [
  'Dusting the Instagram story for fingerprints...',
  'Interviewing your delusions (they lawyered up)...',
  'Consulting the Chief of Vibes...',
  'Separating facts from fan fiction...',
  'Checking whether that smile was legally binding...',
  'Running the evidence through the delusion detector...',
  'Cross-examining the group chat...',
  'Measuring the emotional reach of a "good morning" text...',
  'Requesting backup from the Reality Forensics unit...',
];

interface InvestigationSequenceProps {
  category: Category;
  onTick?: () => void;
}

export default function InvestigationSequence({ category, onTick }: InvestigationSequenceProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % STATUS_LINES.length);
      onTick?.();
    }, 1700);
    return () => window.clearInterval(interval);
  }, [onTick]);

  return (
    <section
      aria-labelledby="investigation-title"
      aria-busy="true"
      className="animate-paper-in overflow-hidden rounded border-2 border-police-charcoal bg-police-paper shadow-card"
    >
      <div className="flex items-center justify-between border-b-2 border-police-charcoal bg-police-charcoal px-4 py-2">
        <span className="font-stamp text-[10px] uppercase tracking-[0.25em] text-police-tape">
          Investigation in progress
        </span>
        <span className="font-typewriter text-[10px] text-police-cream/70">DO NOT DISTURB</span>
      </div>

      <div className="relative px-5 py-8 text-center sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
          <div className="scan-line absolute inset-x-0 h-24 bg-police-stamp" />
        </div>

        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
          <span className="pulse-ring absolute inset-0 rounded-full border-4 border-police-stamp/30" />
          <span className="pulse-ring pulse-ring-delay absolute inset-2 rounded-full border-2 border-police-gold/40" />
          <div className="magnifier-wobble relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-police-charcoal bg-police-cream text-4xl shadow-folder sm:h-24 sm:w-24 sm:text-5xl">
            <span role="img" aria-label="Detective inspecting evidence">
              🔍
            </span>
          </div>
          <span className="absolute -bottom-1 -right-1 rotate-6 rounded border-2 border-police-stamp bg-police-paper px-2 py-0.5 font-stamp text-[9px] uppercase tracking-widest text-police-stamp">
            {category}
          </span>
        </div>

        <p className="font-stamp text-[10px] uppercase tracking-[0.25em] text-police-muted">
          Lead Detective Spark is on the case
        </p>
        <h2 id="investigation-title" className="mt-2 text-xl uppercase sm:text-2xl">
          Collecting questionable evidence
        </h2>

        <p
          aria-live="polite"
          className="mx-auto mt-4 min-h-[48px] max-w-md font-typewriter text-sm text-police-ink sm:text-base"
        >
          {STATUS_LINES[index]}
        </p>

        <div className="mx-auto mt-5 h-3 max-w-sm overflow-hidden rounded-full border border-police-charcoal/30 bg-police-cream">
          <div className="progress-indeterminate h-full bg-police-red" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 font-typewriter text-[10px] uppercase tracking-widest text-police-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-police-green" />
            Evidence sealed
          </span>
          <span aria-hidden="true">•</span>
          <span>Verdict pending</span>
        </div>
      </div>
    </section>
  );
}
