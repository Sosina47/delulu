import type { InvestigationReport } from '../types';

interface SafetyScreenProps {
  report: InvestigationReport;
  onNewCase: () => void;
  onOpenHistory: () => void;
}

export default function SafetyScreen({ report, onNewCase, onOpenHistory }: SafetyScreenProps) {
  return (
    <section aria-labelledby="safety-title" className="animate-paper-in">
      <article className="overflow-hidden rounded border-2 border-police-charcoal bg-police-paper shadow-card">
        <div className="border-b-2 border-police-charcoal bg-police-charcoal px-4 py-2">
          <p className="font-stamp text-[10px] uppercase tracking-[0.25em] text-police-tape">
            Officer stepping out of character
          </p>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-police-charcoal/30 bg-police-cream text-3xl">
            <span role="img" aria-label="A calm, supportive hand">
              🤝
            </span>
          </div>
          <h2 id="safety-title" className="text-center text-xl uppercase leading-tight text-police-charcoal sm:text-2xl">
            This one deserves a real person, not a roast.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center font-typewriter text-sm leading-relaxed text-police-ink">
            {report.safety.message}
          </p>

          <div className="mx-auto mt-5 max-w-lg rounded border border-police-charcoal/20 bg-police-cream p-4">
            <p className="font-stamp text-[10px] uppercase tracking-widest text-police-muted">
              A few grounded next steps
            </p>
            <ul className="mt-2 space-y-2 font-typewriter text-xs leading-relaxed text-police-ink">
              <li>• Talk to someone you trust — a friend, family member, counsellor, or doctor.</li>
              <li>• If you are in immediate danger, contact your local emergency number.</li>
              <li>• A local support service or helpline can help you think through what to do next.</li>
            </ul>
          </div>

          <p className="mt-4 text-center font-typewriter text-[10px] uppercase tracking-widest text-police-muted">
            No score, no stamp, no share. Just support.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onNewCase}
              className="flex min-h-[48px] items-center justify-center rounded border-2 border-police-charcoal bg-police-paper px-3 font-stamp text-[11px] uppercase tracking-widest text-police-charcoal shadow-folder transition hover:-translate-y-0.5 hover:bg-police-cream active:translate-y-0 active:shadow-none"
            >
              Back to case intake
            </button>
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex min-h-[48px] items-center justify-center rounded border border-police-charcoal/30 bg-police-cream px-3 font-stamp text-[11px] uppercase tracking-widest text-police-muted transition hover:border-police-charcoal hover:text-police-charcoal"
            >
              Case files
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
