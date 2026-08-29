// ─────────────────────────────────────────────────────────────
// 历史排盘(Web 端 localStorage,与 App 端 services/storage.ts 同构:
//   上限 20 条、同参数去重覆盖、可删除、可清空)
// ─────────────────────────────────────────────────────────────

export interface HistoryBirthParams {
  calendar: 'solar' | 'lunar'
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: 'male' | 'female'
  isLeapMonth?: string
  province?: string
  city?: string
  district?: string
}

export interface SavedRecord {
  id: string
  birthParams: HistoryBirthParams
  summary: {
    baziBrief: string
    patternDisplay: string
    patternOutcome: string
    patternResult: string
    dayMaster: string
  }
  createdAt: string
}

const STORAGE_KEY = 'bazi-history-v1'
const MAX_RECORDS = 20

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function paramsKey(params: HistoryBirthParams): string {
  return `${params.calendar}|${params.year}|${params.month}|${params.day}|${params.hour}|${params.minute}|${params.gender}`
}

/** 历史条目 → 结果页查询串 */
export function historyParamsToQuery(params: HistoryBirthParams): string {
  const q = new URLSearchParams()
  q.set('calendar', params.calendar)
  q.set('year', String(params.year))
  q.set('month', String(params.month))
  q.set('day', String(params.day))
  q.set('hour', String(params.hour))
  q.set('minute', String(params.minute))
  q.set('gender', params.gender)
  if (params.isLeapMonth) q.set('isLeapMonth', params.isLeapMonth)
  if (params.province) q.set('province', params.province)
  if (params.city) q.set('city', params.city)
  if (params.district) q.set('district', params.district)
  return q.toString()
}

export function loadRecords(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const records: SavedRecord[] = JSON.parse(raw)
    return records.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
  } catch {
    return []
  }
}

export function saveRecord(
  birthParams: HistoryBirthParams,
  summary: SavedRecord['summary'],
): void {
  try {
    const records = loadRecords()
    const key = paramsKey(birthParams)

    // 同参数去重:覆盖旧记录
    const idx = records.findIndex((r) => paramsKey(r.birthParams) === key)
    const record: SavedRecord = {
      id: idx >= 0 ? records[idx].id : uid(),
      birthParams,
      summary,
      createdAt: new Date().toISOString(),
    }

    if (idx >= 0) {
      records[idx] = record
    } else {
      records.unshift(record)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)))
  } catch {
    // 静默失败,不影响排盘
  }
}

export function deleteRecord(id: string): void {
  try {
    const records = loadRecords().filter((r) => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // 静默失败
  }
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 静默失败
  }
}
