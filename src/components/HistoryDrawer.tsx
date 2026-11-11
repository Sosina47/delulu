import { useEffect, useState } from 'react';
import type { CaseRecord } from '../types';
import { formatCaseDateTime } from '../utils/report';

interface HistoryDrawerProps {
  open: boolean;
  cases: CaseRecord[];
  onClose: () => void;
  onOpenCase: (record: CaseRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const VERDICT_COLOR: Record<CaseRecord['report']['verdict'], string> = {
  INNOCENT: 'border-police-green text-police-green',
  'SLIGHTLY DELULU': 'border-police-gold text-police-charcoal',
  GUILTY: 'border-police-red text-police-red',
  'DELULU PRO MAX': 'border-police-stamp text-police-stamp',
};

export default function HistoryDrawer({
  open,
  cases,
  onClose,
  onOpenCase,
  onDelete,
  onClearAll,
}: HistoryDrawerProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-police-charcoal/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="animate-drawer-in absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l-4 border-police-charcoal bg-police-cream shadow-card">
        <header className="flex items-center justify-between gap-2 border-b-2 border-police-charcoal bg-police-paper px-4 py-3">
          <div>
            <h2 id="history-title" className="text-lg uppercase text-police-charcoal">
              Case files
            </h2>
            <p className="font-typewriter text-[10px] uppercase tracking-widest text-police-muted">
              {cases.length} archived {cases.length === 1 ? 'case' : 'cases'} • stored on this device
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded border border-police-charcoal/30 bg-police-cream font-stamp text-xs uppercase tracking-widest text-police-muted hover:border-police-charcoal hover:text-police-charcoal"
            aria-label="Close case files"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3">
          {cases.length === 0 ? (
            <div className="mt-10 rounded border border-dashed border-police-charcoal/40 p-5 text-center">
              <p className="text-3xl" aria-hidden="true">
                🗂️
              </p>
              <p className="mt-2 font-display text-sm uppercase text-police-charcoal">The archive is empty</p>
              <p className="mt-1 font-typewriter text-xs text-police-muted">
                File a case and it will be stored here on this device. No accounts, no cloud, no
                judgment (well, some judgment).
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cases.map((record) => {
                const report = record.appeal?.report ?? record.report;
                return (
                  <li key={record.id} className="relative">
                    <button
                      type="button"
                      onClick={() => onOpenCase(record)}
                      className="w-full rounded border border-police-charcoal/25 bg-police-paper p-3 pr-12 text-left transition hover:border-police-charcoal hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-typewriter text-[10px] uppercase tracking-widest text-police-muted">
                          {record.category} • {formatCaseDateTime(record.createdAt)}
                        </p>
                        <span
                          className={`shrink-0 rounded border-2 px-1.5 py-0.5 font-stamp text-[9px] uppercase tracking-wider ${VERDICT_COLOR[report.verdict]}`}
                        >
                          {report.deluluScore}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 font-display text-sm uppercase leading-snug text-police-charcoal">
                        {report.caseTitle}
                      </p>
                      <p className="mt-1 font-typewriter text-[10px] uppercase tracking-wider text-police-muted">
                        {report.verdict}
                        {record.appeal ? ' • appealed' : ''}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(record.id)}
                      aria-label={`Delete case ${report.caseTitle}`}
                      className="absolute right-2 top-2 flex min-h-[36px] min-w-[36px] items-center justify-center rounded border border-transparent text-sm text-police-muted transition hover:border-police-red/40 hover:bg-police-red/10 hover:text-police-red"
                    >
                      🗑
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cases.length > 0 && (
          <footer className="border-t border-police-charcoal/20 p-3">
            <button
              type="button"
              onClick={() => {
                if (confirmClear) {
                  onClearAll();
                  setConfirmClear(false);
                } else {
                  setConfirmClear(true);
                }
              }}
              className={`min-h-[44px] w-full rounded border-2 px-3 font-stamp text-[10px] uppercase tracking-widest transition ${
                confirmClear
                  ? 'border-police-red bg-police-red text-white'
                  : 'border-police-charcoal/30 text-police-muted hover:border-police-red hover:text-police-red'
              }`}
            >
              {confirmClear ? 'Tap again to burn the archive' : 'Clear all case files'}
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
