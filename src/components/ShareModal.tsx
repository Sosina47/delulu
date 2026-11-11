import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { InvestigationReport } from '../types';
import ShareCard from './ShareCard';

interface ShareModalProps {
  report: InvestigationReport;
  onClose: () => void;
}

type ShareStatus = 'idle' | 'working' | 'shared' | 'downloaded' | 'error';

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function ShareModal({ report, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  async function renderPng(): Promise<Blob> {
    const node = cardRef.current;
    if (!node) {
      throw new Error('Share card is not ready yet.');
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    let dataUrl: string;
    try {
      dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: '#FAF7EE',
      });
    } catch {
      // Some browsers block cross-origin font embedding. Still produce the
      // image rather than failing the whole share flow.
      dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: '#FAF7EE',
        skipFonts: true,
      });
    }

    const response = await fetch(dataUrl);
    return response.blob();
  }

  async function handleShare() {
    setStatus('working');
    setError(null);
    try {
      const blob = await renderPng();
      const file = new File([blob], `delulu-verdict-${report.caseId}.png`, { type: 'image/png' });
      const shareData: ShareData = {
        files: [file],
        title: 'My Delulu Police verdict',
        text: `Delulu score: ${report.deluluScore}/100 — ${report.verdict}`,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setStatus('shared');
      } else {
        triggerDownload(blob, file.name);
        setStatus('downloaded');
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('error');
      setError('Could not create the share card. You can still download the PNG.');
    }
  }

  async function handleDownload() {
    setStatus('working');
    setError(null);
    try {
      const blob = await renderPng();
      triggerDownload(blob, `delulu-verdict-${report.caseId}.png`);
      setStatus('downloaded');
    } catch {
      setStatus('error');
      setError('Could not create the PNG. Try a different browser or take a screenshot of the card.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-police-charcoal/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-paper-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded border-2 border-police-charcoal bg-police-cream p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <h2 id="share-title" className="text-lg uppercase text-police-charcoal">
            Share the verdict
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded border border-police-charcoal/30 bg-police-paper font-stamp text-xs uppercase tracking-widest text-police-muted hover:border-police-charcoal hover:text-police-charcoal"
            aria-label="Close share dialog"
          >
            ✕
          </button>
        </div>

        <p className="mt-1 font-typewriter text-[11px] text-police-muted">
          The card includes only your score, verdict, category and the roast line. Your case text
          stays private.
        </p>

        <div className="mx-auto mt-3 h-[405px] w-[324px] max-w-full overflow-hidden rounded border-2 border-police-charcoal bg-police-paper">
          <div style={{ width: 1080, height: 1350, transform: 'scale(0.3)', transformOrigin: 'top left' }}>
            <ShareCard report={report} />
          </div>
        </div>

        <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: -12000, pointerEvents: 'none' }}>
          <ShareCard ref={cardRef} report={report} />
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded border border-police-red/40 bg-police-red/10 p-2 font-typewriter text-xs text-police-red">
            {error}
          </p>
        )}
        {(status === 'shared' || status === 'downloaded') && (
          <p role="status" className="mt-3 rounded border border-police-green/40 bg-police-green/10 p-2 font-typewriter text-xs text-police-green">
            {status === 'shared' ? 'Verdict shared. The court is proud.' : 'PNG downloaded. Go make it everyone’s problem.'}
          </p>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={status === 'working'}
            className="flex min-h-[48px] items-center justify-center rounded border-2 border-police-charcoal bg-police-gold px-3 font-stamp text-[11px] uppercase tracking-widest text-police-charcoal shadow-button transition hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 active:shadow-none disabled:opacity-60"
          >
            {status === 'working' ? 'Generating...' : 'Share image'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={status === 'working'}
            className="flex min-h-[48px] items-center justify-center rounded border-2 border-police-charcoal bg-police-paper px-3 font-stamp text-[11px] uppercase tracking-widest text-police-charcoal shadow-folder transition hover:-translate-y-0.5 hover:bg-police-cream active:translate-y-0 active:shadow-none disabled:opacity-60"
          >
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
