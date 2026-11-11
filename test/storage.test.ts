import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CaseRecord } from '../src/types';
import {
  clearCases,
  deleteCase,
  loadCases,
  resetStorageFallback,
  saveCase,
} from '../src/utils/storage';
import { RAW_REPORT } from './helpers';

function makeRecord(index: number): CaseRecord {
  return {
    id: `DP-2026-${1000 + index}`,
    createdAt: new Date(2026, 10, 11, 10, index).toISOString(),
    caseDescription: `Case number ${index} about a very suspicious good morning text.`,
    category: 'Crush',
    report: {
      ...RAW_REPORT,
      caseId: `DP-2026-${1000 + index}`,
      category: 'Crush',
      verdict: 'DELULU PRO MAX',
      safety: { triggered: false },
    },
  };
}

function createLocalStorage(overrides: Partial<Storage> = {}): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    ...overrides,
  } as Storage;
}

function stubWindow(localStorage: Storage): void {
  vi.stubGlobal('window', { localStorage } as unknown as Window & typeof globalThis);
}

describe('Case file storage', () => {
  beforeEach(() => {
    resetStorageFallback();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetStorageFallback();
  });

  it('works with an in-memory fallback when localStorage is unavailable', () => {
    expect(loadCases()).toEqual([]);

    const history = saveCase(makeRecord(1));
    expect(history).toHaveLength(1);
    expect(loadCases()[0]!.id).toBe('DP-2026-1001');

    deleteCase('DP-2026-1001');
    expect(loadCases()).toEqual([]);
  });

  it('upserts by case id instead of duplicating', () => {
    saveCase(makeRecord(1));
    const updated = { ...makeRecord(1), caseDescription: 'Updated evidence about the text.' };
    saveCase(updated);

    expect(loadCases()).toHaveLength(1);
    expect(loadCases()[0]!.caseDescription).toContain('Updated evidence');
  });

  it('caps history at 20 cases', () => {
    for (let index = 0; index < 25; index += 1) {
      saveCase(makeRecord(index));
    }
    const cases = loadCases();
    expect(cases).toHaveLength(20);
    expect(cases[0]!.id).toBe('DP-2026-1024');
  });

  it('clears all cases', () => {
    saveCase(makeRecord(1));
    saveCase(makeRecord(2));
    clearCases();
    expect(loadCases()).toEqual([]);
  });

  it('survives corrupt localStorage data', () => {
    const storage = createLocalStorage();
    storage.setItem('delulu:v1:cases', '{not valid json');
    stubWindow(storage);

    expect(() => loadCases()).not.toThrow();
    expect(loadCases()).toEqual([]);

    saveCase(makeRecord(3));
    expect(loadCases()).toHaveLength(1);
  });

  it('survives localStorage quota errors and keeps an in-memory copy', () => {
    const storage = createLocalStorage({
      setItem: (key: string, value: string) => {
        if (key === 'delulu:v1:cases') {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        void value;
      },
    });
    stubWindow(storage);

    const history = saveCase(makeRecord(4));
    expect(history).toHaveLength(1);
    expect(loadCases()).toHaveLength(1);
  });

  it('ignores schema-invalid stored records', () => {
    const storage = createLocalStorage();
    storage.setItem(
      'delulu:v1:cases',
      JSON.stringify([{ id: 'bad', report: { nope: true } }])
    );
    stubWindow(storage);

    expect(loadCases()).toEqual([]);
  });
});
