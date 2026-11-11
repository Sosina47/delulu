import { useCallback, useEffect, useReducer, useRef } from 'react';
import CaseForm from './components/CaseForm';
import ErrorScreen from './components/ErrorScreen';
import HistoryDrawer from './components/HistoryDrawer';
import InvestigationSequence from './components/InvestigationSequence';
import ReportView from './components/ReportView';
import SafetyScreen from './components/SafetyScreen';
import ShareModal from './components/ShareModal';
import { useSound } from './hooks/useSound';
import {
  type CaseRecord,
  type Category,
  type FlowState,
  type InvestigationReport,
} from './types';
import { ApiError, investigateCase, submitAppeal } from './utils/api';
import { buildOriginalReportSummary } from './utils/report';
import { clearCases, deleteCase, loadCases, saveCase } from './utils/storage';

const MIN_INVESTIGATION_MS = 2800;
const MIN_ERROR_MS = 1600;

interface LastSubmission {
  description: string;
  category: Category;
}

interface AppState {
  status: FlowState;
  activeCase: CaseRecord | null;
  lastSubmission: LastSubmission | null;
  error: string | null;
  appealError: string | null;
  appealSubmitting: boolean;
  history: CaseRecord[];
  historyOpen: boolean;
  shareOpen: boolean;
}

type Action =
  | { type: 'SUBMIT'; submission: LastSubmission }
  | { type: 'INVESTIGATION_SUCCESS'; record: CaseRecord; history: CaseRecord[] }
  | { type: 'INVESTIGATION_ERROR'; message: string }
  | { type: 'RETRY' }
  | { type: 'START_APPEAL' }
  | { type: 'CANCEL_APPEAL' }
  | { type: 'APPEAL_START' }
  | { type: 'APPEAL_SUCCESS'; record: CaseRecord; history: CaseRecord[] }
  | { type: 'APPEAL_ERROR'; message: string }
  | { type: 'OPEN_CASE'; record: CaseRecord }
  | { type: 'NEW_CASE' }
  | { type: 'OPEN_HISTORY' }
  | { type: 'CLOSE_HISTORY' }
  | { type: 'SET_HISTORY'; history: CaseRecord[] }
  | { type: 'DELETE_CASE'; id: string; history: CaseRecord[] }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'OPEN_SHARE' }
  | { type: 'CLOSE_SHARE' };

function createInitialState(): AppState {
  return {
    status: 'idle',
    activeCase: null,
    lastSubmission: null,
    error: null,
    appealError: null,
    appealSubmitting: false,
    history: loadCases(),
    historyOpen: false,
    shareOpen: false,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SUBMIT':
      return {
        ...state,
        status: 'investigating',
        lastSubmission: action.submission,
        activeCase: null,
        error: null,
        appealError: null,
        appealSubmitting: false,
        historyOpen: false,
        shareOpen: false,
      };
    case 'INVESTIGATION_SUCCESS':
      return {
        ...state,
        status: 'verdict',
        activeCase: action.record,
        error: null,
        history: action.history,
      };
    case 'INVESTIGATION_ERROR':
      return { ...state, status: 'error', error: action.message };
    case 'RETRY':
      return { ...state, status: 'investigating', error: null };
    case 'START_APPEAL':
      return { ...state, status: 'appealing', appealError: null };
    case 'CANCEL_APPEAL':
      return { ...state, status: 'verdict', appealError: null, appealSubmitting: false };
    case 'APPEAL_START':
      return { ...state, appealSubmitting: true, appealError: null };
    case 'APPEAL_SUCCESS':
      return {
        ...state,
        status: 'verdict',
        activeCase: action.record,
        appealSubmitting: false,
        appealError: null,
        history: action.history,
      };
    case 'APPEAL_ERROR':
      return { ...state, appealSubmitting: false, appealError: action.message };
    case 'OPEN_CASE':
      return {
        ...state,
        status: 'verdict',
        activeCase: action.record,
        historyOpen: false,
        shareOpen: false,
        error: null,
        appealError: null,
        appealSubmitting: false,
      };
    case 'NEW_CASE':
      return {
        ...state,
        status: 'idle',
        activeCase: null,
        lastSubmission: null,
        error: null,
        appealError: null,
        appealSubmitting: false,
        historyOpen: false,
        shareOpen: false,
      };
    case 'OPEN_HISTORY':
      return { ...state, historyOpen: true };
    case 'CLOSE_HISTORY':
      return { ...state, historyOpen: false };
    case 'SET_HISTORY':
      return { ...state, history: action.history };
    case 'DELETE_CASE': {
      const activeRemoved = state.activeCase?.id === action.id;
      return {
        ...state,
        history: action.history,
        activeCase: activeRemoved ? null : state.activeCase,
        status: activeRemoved ? 'idle' : state.status,
      };
    }
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
        activeCase: null,
        status: 'idle',
        historyOpen: false,
        shareOpen: false,
      };
    case 'OPEN_SHARE':
      return { ...state, shareOpen: true };
    case 'CLOSE_SHARE':
      return { ...state, shareOpen: false };
    default:
      return state;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'The precinct radio is down. Check your connection and try again.';
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const { muted, toggleMuted, play, ensureAudio } = useSound();
  const investigationAbort = useRef<AbortController | null>(null);
  const appealAbort = useRef<AbortController | null>(null);
  const investigationInFlight = useRef(false);

  useEffect(() => {
    return () => {
      investigationAbort.current?.abort();
      appealAbort.current?.abort();
    };
  }, []);

  const runInvestigation = useCallback(
    async (submission: LastSubmission) => {
      if (investigationInFlight.current) {
        return;
      }
      investigationInFlight.current = true;
      investigationAbort.current?.abort();
      const controller = new AbortController();
      investigationAbort.current = controller;

      ensureAudio();
      play('siren');
      dispatch({ type: 'SUBMIT', submission });
      const started = performance.now();

      try {
        const report = await investigateCase(
          { caseDescription: submission.description, category: submission.category },
          controller.signal
        );

        const elapsed = performance.now() - started;
        if (elapsed < MIN_INVESTIGATION_MS) {
          await delay(MIN_INVESTIGATION_MS - elapsed);
        }
        if (controller.signal.aborted) {
          return;
        }

        const record: CaseRecord = {
          id: report.caseId,
          createdAt: report.createdAt ?? new Date().toISOString(),
          caseDescription: submission.description,
          category: submission.category,
          report,
        };
        const history = saveCase(record);
        dispatch({ type: 'INVESTIGATION_SUCCESS', record, history });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const elapsed = performance.now() - started;
        if (elapsed < MIN_ERROR_MS) {
          await delay(MIN_ERROR_MS - elapsed);
        }
        play('error');
        dispatch({ type: 'INVESTIGATION_ERROR', message: getErrorMessage(error) });
      } finally {
        investigationInFlight.current = false;
      }
    },
    [ensureAudio, play]
  );

  const runAppeal = useCallback(
    async (newEvidence: string) => {
      const activeCase = state.activeCase;
      if (!activeCase || activeCase.appeal) {
        return;
      }

      appealAbort.current?.abort();
      const controller = new AbortController();
      appealAbort.current = controller;
      dispatch({ type: 'APPEAL_START' });

      try {
        const report = await submitAppeal(
          {
            originalCase: {
              caseDescription: activeCase.caseDescription,
              category: activeCase.category,
            },
            originalReportSummary: buildOriginalReportSummary(activeCase.report),
            originalScore: activeCase.report.deluluScore,
            caseId: activeCase.report.caseId,
            newEvidence,
          },
          controller.signal
        );

        if (controller.signal.aborted) {
          return;
        }

        const updated: CaseRecord = {
          ...activeCase,
          appeal: {
            newEvidence,
            report,
            createdAt: new Date().toISOString(),
          },
        };
        const history = saveCase(updated);
        dispatch({ type: 'APPEAL_SUCCESS', record: updated, history });
        play(report.safety.triggered ? 'error' : 'success');
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        dispatch({ type: 'APPEAL_ERROR', message: getErrorMessage(error) });
      }
    },
    [play, state.activeCase]
  );

  const handleSubmit = useCallback(
    (description: string, category: Category) => {
      void runInvestigation({ description, category });
    },
    [runInvestigation]
  );

  const handleRetry = useCallback(() => {
    if (state.lastSubmission) {
      void runInvestigation(state.lastSubmission);
    }
  }, [runInvestigation, state.lastSubmission]);

  const handleNewCase = useCallback(() => {
    investigationAbort.current?.abort();
    appealAbort.current?.abort();
    investigationInFlight.current = false;
    dispatch({ type: 'NEW_CASE' });
  }, []);

  const handleOpenCase = useCallback((record: CaseRecord) => {
    investigationAbort.current?.abort();
    appealAbort.current?.abort();
    investigationInFlight.current = false;
    dispatch({ type: 'OPEN_CASE', record });
  }, []);

  const handleDeleteCase = useCallback((id: string) => {
    const history = deleteCase(id);
    dispatch({ type: 'DELETE_CASE', id, history });
  }, []);

  const handleClearHistory = useCallback(() => {
    clearCases();
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const handleTick = useCallback(() => play('tick'), [play]);

  const activeReport: InvestigationReport | null = state.activeCase
    ? (state.activeCase.appeal?.report ?? state.activeCase.report)
    : null;

  const showSafety = Boolean(activeReport?.safety.triggered);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-police-charcoal/20 bg-police-cream/80">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
          <button
            type="button"
            onClick={handleNewCase}
            className="group flex items-center gap-2 text-left"
            aria-label="Delulu Police home"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-police-charcoal bg-police-gold text-lg shadow-folder transition group-hover:rotate-6"
              aria-hidden="true"
            >
              🚨
            </span>
            <span>
              <span className="block font-display text-base uppercase leading-none tracking-tight text-police-charcoal sm:text-lg">
                Delulu Police
              </span>
              <span className="mt-0.5 block font-typewriter text-[8px] uppercase tracking-[0.18em] text-police-muted sm:text-[9px]">
                Dept. of Questionable Assumptions
              </span>
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMuted}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              title={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-police-charcoal/30 bg-police-paper text-base transition hover:border-police-charcoal"
            >
              <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_HISTORY' })}
              className="relative flex min-h-[44px] items-center gap-1.5 rounded border border-police-charcoal/30 bg-police-paper px-2.5 font-stamp text-[10px] uppercase tracking-widest text-police-charcoal transition hover:border-police-charcoal hover:bg-white sm:px-3"
            >
              <span aria-hidden="true">🗂️</span>
              <span className="hidden sm:inline">Case files</span>
              {state.history.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-police-charcoal bg-police-stamp px-1 font-typewriter text-[9px] font-bold text-white">
                  {state.history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-5 sm:py-6">
        {state.status === 'idle' && <CaseForm onSubmit={handleSubmit} disabled={false} />}

        {state.status === 'investigating' && state.lastSubmission && (
          <InvestigationSequence category={state.lastSubmission.category} onTick={handleTick} />
        )}

        {(state.status === 'verdict' || state.status === 'appealing') && state.activeCase && activeReport && (
          showSafety ? (
            <SafetyScreen
              report={activeReport}
              onNewCase={handleNewCase}
              onOpenHistory={() => dispatch({ type: 'OPEN_HISTORY' })}
            />
          ) : (
            <ReportView
              report={activeReport}
              activeCase={state.activeCase}
              status={state.status}
              appealError={state.appealError}
              appealSubmitting={state.appealSubmitting}
              onStartAppeal={() => dispatch({ type: 'START_APPEAL' })}
              onCancelAppeal={() => dispatch({ type: 'CANCEL_APPEAL' })}
              onAppeal={(newEvidence) => void runAppeal(newEvidence)}
              onNewCase={handleNewCase}
              onOpenShare={() => dispatch({ type: 'OPEN_SHARE' })}
              onOpenHistory={() => dispatch({ type: 'OPEN_HISTORY' })}
              play={play}
            />
          )
        )}

        {state.status === 'error' && (
          <ErrorScreen
            message={state.error ?? 'Something went wrong at the precinct.'}
            onRetry={handleRetry}
            onNewCase={handleNewCase}
            onOpenHistory={() => dispatch({ type: 'OPEN_HISTORY' })}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-4 text-center">
        <p className="border-t border-police-charcoal/20 pt-3 font-typewriter text-[9px] uppercase tracking-[0.16em] text-police-muted">
          Entertainment only • not real police • not therapy • be kind to yourself
        </p>
      </footer>

      <HistoryDrawer
        open={state.historyOpen}
        cases={state.history}
        onClose={() => dispatch({ type: 'CLOSE_HISTORY' })}
        onOpenCase={handleOpenCase}
        onDelete={handleDeleteCase}
        onClearAll={handleClearHistory}
      />

      {state.shareOpen && activeReport && !showSafety && (
        <ShareModal report={activeReport} onClose={() => dispatch({ type: 'CLOSE_SHARE' })} />
      )}
    </div>
  );
}
