import { File, Paths } from 'expo-file-system';
import type { MobileBaziInputParams } from '../adapters/bazi-input-adapter';

// ── Types ──

export interface SavedRecord {
  id: string;
  birthParams: MobileBaziInputParams;
  summary: {
    baziBrief: string;
    patternDisplay: string;
    patternOutcome: string;
    patternResult: string;
    dayMaster: string;
  };
  createdAt: string;
}

const MAX_RECORDS = 20;

// ── Helpers ──

function getFilePath(): File {
  return new File(Paths.document, 'readings.json');
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function paramsKey(params: MobileBaziInputParams): string {
  return `${params.calendar}|${params.year}|${params.month}|${params.day}|${params.hour}|${params.minute}|${params.gender}`;
}

// ── Public API ──

export async function loadRecords(): Promise<SavedRecord[]> {
  try {
    const file = getFilePath();
    if (!file.exists) return [];
    const data = await file.text();
    const records: SavedRecord[] = JSON.parse(data);
    return records.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function saveRecord(
  birthParams: MobileBaziInputParams,
  summary: SavedRecord['summary'],
): Promise<void> {
  try {
    const records = await loadRecords();
    const key = paramsKey(birthParams);

    // 去重：相同关键参数覆盖旧记录
    const idx = records.findIndex((r) => paramsKey(r.birthParams) === key);
    const record: SavedRecord = {
      id: idx >= 0 ? records[idx].id : uid(),
      birthParams,
      summary,
      createdAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      records[idx] = record;
    } else {
      records.unshift(record);
    }

    const trimmed = records.slice(0, MAX_RECORDS);
    getFilePath().write(JSON.stringify(trimmed));
  } catch {
    // 静默失败，不影响排盘
  }
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const records = await loadRecords();
    const filtered = records.filter((r) => r.id !== id);
    getFilePath().write(JSON.stringify(filtered));
  } catch {
    // 静默失败
  }
}

export async function clearRecords(): Promise<void> {
  try {
    const file = getFilePath();
    if (file.exists) file.delete();
  } catch {
    // 静默失败
  }
}
