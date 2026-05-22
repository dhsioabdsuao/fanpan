import { getTenGod } from '@/lib/bazi-utils'

const SUPPORT_GODS = new Set(['比肩', '劫财', '偏印', '正印'])
const DRAIN_GODS = new Set(['七杀', '正官', '偏财', '正财', '伤官', '食神'])

export function isSupportGod(tenGod: string): boolean {
  return SUPPORT_GODS.has(tenGod)
}

export function isDrainGod(tenGod: string): boolean {
  return DRAIN_GODS.has(tenGod)
}

const MONTHLY_ORDER_CATEGORY: Record<string, number> = {
  比肩: 40, 劫财: 40,
  偏印: 30, 正印: 30,
  食神: 15, 伤官: 15,
  偏财: 10, 正财: 10,
  七杀: 5, 正官: 5,
}

export function getMonthlyOrderScore(tenGod: string): number {
  return MONTHLY_ORDER_CATEGORY[tenGod] ?? 0
}

const SUPPORT_BASE_SCORES: Record<string, number> = {
  比肩: 4, 劫财: 4, 偏印: 3.5, 正印: 3,
}

export function getSupportBaseScore(tenGod: string): number {
  return SUPPORT_BASE_SCORES[tenGod] ?? 0
}

const DRAIN_BASE_SCORES: Record<string, number> = {
  七杀: 4, 正官: 3.5, 偏财: 3, 正财: 2.5, 伤官: 2.5, 食神: 2,
}

export function getDrainBaseScore(tenGod: string): number {
  return DRAIN_BASE_SCORES[tenGod] ?? 0
}

export function getTenGodCategory(dayMaster: string, otherStem: string): string {
  return getTenGod(dayMaster, otherStem)
}
