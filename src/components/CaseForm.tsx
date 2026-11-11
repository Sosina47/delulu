import { useMemo, useState } from 'react';
import {
  CATEGORIES,
  EXAMPLE_CASES,
  MAX_CASE_LENGTH,
  MIN_CASE_LENGTH,
  type Category,
} from '../types';

interface CaseFormProps {
  onSubmit: (description: string, category: Category) => void;
  disabled: boolean;
}

export default function CaseForm({ onSubmit, disabled }: CaseFormProps) {
  const [category, setCategory] = useState<Category>('Crush');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = description.trim().length;
  const remaining = MAX_CASE_LENGTH - description.length;
  const nearLimit = remaining <= 60;

  const counterClass = useMemo(() => {
    if (description.length > MAX_CASE_LENGTH) return 'text-police-red font-bold';
    if (nearLimit) return 'text-police-stamp font-bold';
    return 'text-police-muted';
  }, [description.length, nearLimit]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    if (trimmedLength < MIN_CASE_LENGTH) {
      setError(`The court needs at least ${MIN_CASE_LENGTH} characters of evidence, detective.`);
      return;
    }
    if (description.length > MAX_CASE_LENGTH) {
      setError(`The court cannot read more than ${MAX_CASE_LENGTH} characters.`);
      return;
    }

    setError(null);
    onSubmit(description.trim(), category);
  }

  function applyExample(index: number) {
    const example = EXAMPLE_CASES[index];
    if (!example) return;
    setDescription(example.text);
    setCategory(example.category);
    setError(null);
  }

  return (
    <section aria-labelledby="case-intake-title" className="animate-paper-in">
      <div className="mb-4 sm:mb-5">
        <p className="font-stamp text-[10px] sm:text-xs uppercase tracking-[0.2em] text-police-stamp">
          Case intake • open 24/7 • no evidence too small
        </p>
        <h2
          id="case-intake-title"
          className="mt-1 text-2xl sm:text-4xl uppercase leading-none text-police-charcoal"
        >
          Something feels suspicious?
        </h2>
        <p className="mt-2 font-typewriter text-xs sm:text-sm text-police-muted leading-snug">
          File your questionable assumption. Our detectives separate facts from delusions and
          stamp an official verdict.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <fieldset>
          <legend className="font-stamp text-[11px] uppercase tracking-widest text-police-charcoal mb-2">
            01 · Choose a department
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Case category">
            {CATEGORIES.map((item) => {
              const selected = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(item)}
                  className={`min-h-[44px] rounded border-2 px-3 py-1.5 font-stamp text-xs uppercase tracking-wide transition-all duration-150 ${
                    selected
                      ? 'border-police-charcoal bg-police-charcoal text-police-cream shadow-button'
                      : 'border-police-charcoal/40 bg-police-paper text-police-charcoal hover:border-police-charcoal hover:-translate-y-0.5'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="case-description"
            className="mb-2 block font-stamp text-[11px] uppercase tracking-widest text-police-charcoal"
          >
            02 · State the facts (and the vibes)
          </label>
          <textarea
            id="case-description"
            name="case-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              if (error) setError(null);
            }}
            rows={4}
            maxLength={MAX_CASE_LENGTH}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'case-error' : 'case-counter'}
            placeholder="He watched my story in 2 minutes. I think we are getting married..."
            className="w-full resize-none rounded border-2 border-police-charcoal/60 bg-police-paper px-3 py-3 font-typewriter text-sm text-police-charcoal placeholder:text-police-muted/60 focus:border-police-charcoal focus:outline-none focus:ring-2 focus:ring-police-stamp/30 disabled:opacity-60"
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p
              id="case-error"
              role={error ? 'alert' : undefined}
              className={`font-typewriter text-xs leading-snug ${error ? 'text-police-red' : 'text-police-muted'}`}
            >
              {error ?? (trimmedLength > 0 && trimmedLength < MIN_CASE_LENGTH
                ? `${MIN_CASE_LENGTH - trimmedLength} more characters needed.`
                : 'Plain text only. The court reads everything as evidence.')}
            </p>
            <span id="case-counter" className={`shrink-0 font-typewriter text-xs ${counterClass}`}>
              {description.length}/{MAX_CASE_LENGTH}
            </span>
          </div>
        </div>

        <div className="rounded border border-dashed border-police-charcoal/30 bg-police-cream/60 p-2.5">
          <p className="mb-1.5 font-stamp text-[10px] uppercase tracking-widest text-police-muted">
            Need inspiration? Tap a case file:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_CASES.map((example, index) => (
              <button
                key={example.category}
                type="button"
                onClick={() => applyExample(index)}
                className="min-h-[44px] rounded-full border border-police-charcoal/30 bg-police-paper px-3 py-1 font-typewriter text-[11px] text-police-ink transition hover:border-police-stamp hover:text-police-stamp"
              >
                {example.category}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded border-2 border-police-charcoal bg-police-red px-4 py-3 font-display text-base uppercase tracking-wide text-white shadow-button transition-all duration-150 hover:-translate-y-0.5 hover:bg-police-stamp hover:shadow-card active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">🚨</span>
          File Case
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
      </form>
    </section>
  );
}
