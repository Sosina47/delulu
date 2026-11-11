interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onNewCase: () => void;
  onOpenHistory: () => void;
}

export default function ErrorScreen({ message, onRetry, onNewCase, onOpenHistory }: ErrorScreenProps) {
  const isRateLimited = /swamped|wait \d+ seconds|too many/i.test(message);

  return (
    <section aria-labelledby="error-title" className="animate-paper-in">
      <article className="overflow-hidden rounded border-2 border-police-charcoal bg-police-paper shadow-card">
        <div className="border-b-2 border-police-charcoal bg-police-red px-4 py-2">
          <p className="font-stamp text-[10px] uppercase tracking-[0.25em] text-white">
            Precinct radio malfunction
          </p>
        </div>
        <div className="p-5 text-center sm:p-7">
          <div className="mx-auto mb-3 text-4xl" aria-hidden="true">
            📻
          </div>
          <h2 id="error-title" className="text-xl uppercase text-police-charcoal sm:text-2xl">
            {isRateLimited ? 'The precinct is swamped' : 'The detective dropped the file'}
          </h2>
          <p className="mx-auto mt-3 max-w-md font-typewriter text-sm leading-relaxed text-police-ink">
            {message}
          </p>
          <p className="mx-auto mt-2 max-w-md font-typewriter text-xs text-police-muted">
            Your case text is still safe on this screen. No charge was filed.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onRetry}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded border-2 border-police-charcoal bg-police-red px-3 font-display text-sm uppercase tracking-wide text-white shadow-button transition hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 active:shadow-none"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onNewCase}
              className="flex min-h-[48px] items-center justify-center rounded border-2 border-police-charcoal bg-police-paper px-3 font-stamp text-[11px] uppercase tracking-widest text-police-charcoal shadow-folder transition hover:-translate-y-0.5 hover:bg-police-cream active:translate-y-0 active:shadow-none"
            >
              Edit case
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenHistory}
            className="mt-3 min-h-[44px] font-stamp text-[10px] uppercase tracking-widest text-police-muted underline decoration-dotted underline-offset-4 hover:text-police-charcoal"
          >
            Open case files
          </button>
        </div>
      </article>
    </section>
  );
}
