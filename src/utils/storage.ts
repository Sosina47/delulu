import {
  CaseRecordListSchema,
  MAX_HISTORY_ITEMS,
  type CaseRecord,
} from '../types';

const STORAGE_KEY = 'delulu:v1:cases';

let memoryCases: CaseRecord[] = [];
let memoryOnly = false;

function getStorage(): Storage | null {
  if (memoryOnly) {
    return null;
  }
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      memoryOnly = true;
      return null;
    }
    // Probe: Safari private mode can throw on write.
    const probeKey = '__delulu_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    memoryOnly = true;
    return null;
  }
}

function normalizeList(cases: CaseRecord[]): CaseRecord[] {
  return cases.slice(0, MAX_HISTORY_ITEMS);
}

export function loadCases(): CaseRecord[] {
  const storage = getStorage();
  if (!storage) {
    return [...memoryCases];
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...memoryCases];
    }
    const parsed = CaseRecordListSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return [...memoryCases];
    }
    memoryCases = normalizeList(parsed.data);
    return [...memoryCases];
  } catch {
    return [...memoryCases];
  }
}

function persist(cases: CaseRecord[]): CaseRecord[] {
  const next = normalizeList(cases);
  memoryCases = next;
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded or storage disabled: keep the in-memory copy.
      memoryOnly = false;
    }
  }
  return [...next];
}

export function saveCase(record: CaseRecord): CaseRecord[] {
  const existing = loadCases().filter((item) => item.id !== record.id);
  return persist([record, ...existing]);
}

export function deleteCase(id: string): CaseRecord[] {
  return persist(loadCases().filter((item) => item.id !== id));
}

export function clearCases(): CaseRecord[] {
  return persist([]);
}

/** Test helper. */
export function resetStorageFallback(): void {
  memoryCases = [];
  memoryOnly = false;
}
