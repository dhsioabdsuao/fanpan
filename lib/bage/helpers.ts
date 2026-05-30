import type { BaziResult } from '@/types/bazi'
import { BRANCH_HIDDEN_STEMS } from '@/lib/strength/conflictHelpers'
import type { HiddenStemEntry } from '@/lib/strength/types'
import { getFiveComboPartner } from '@/lib/yongshen/helpers'

// ── 天干相冲对 ──
// 甲庚冲、乙辛冲、丙壬冲、丁癸冲。戊己属中央土，不参与天干冲。

const STEM_CLASH_PAIRS: ReadonlySet<string> = new Set([
  '甲庚', '庚甲', '乙辛', '辛乙', '丙壬', '壬丙', '丁癸', '癸丁',
])

// ── 1. 月令藏干 ──

/**
 * 获取月支的有序藏干列表（本气→中气→余气）。
 * 使用 BRANCH_HIDDEN_STEMS（含 position 标注的正确顺序），
 * 不用 getHiddenStems()——后者对辰等支顺序有误。
 */
export function getMonthHiddenStems(monthBranch: string): HiddenStemEntry[] {
  const stems = BRANCH_HIDDEN_STEMS[monthBranch]
  if (!stems) {
    throw new Error(`未知月支: ${monthBranch}`)
  }
  return stems
}

// ── 2. 天干池构建 ──

export interface StemEntry {
  stem: string
  pillar: 'year' | 'month' | 'hour'
}

export interface StemPool {
  stems: string[]
  entries: StemEntry[]          // 天干→柱位 完整映射
  byPillar: Record<'year' | 'month' | 'hour', string>
}

/**
 * 收集年/月/时三柱天干，日干排除（日干是日主本身，不参与透干检测）。
 */
export function buildStemPool(bazi: BaziResult): StemPool {
  const { year, month, hour } = bazi.pillars

  const entries: StemEntry[] = [
    { stem: year.stem, pillar: 'year' },
    { stem: month.stem, pillar: 'month' },
    { stem: hour.stem, pillar: 'hour' },
  ]

  return {
    stems: entries.map((e) => e.stem),
    entries,
    byPillar: {
      year: year.stem,
      month: month.stem,
      hour: hour.stem,
    },
  }
}

// ── 3. 透干检测 ──

export interface TransparencyMatch {
  hiddenStem: string            // 藏干
  position: string              // '本气' | '中气' | '余气'
  expressedOn: 'year' | 'month' | 'hour'  // 透在哪柱
  expressedStem: string         // 透出天干（与藏干同名）
}

/**
 * 检测月令藏干是否透出到年/月/时天干。
 * 返回所有透出的藏干（含透出柱位和藏干位置），按藏干顺序排列。
 */
export function detectTransparency(
  hiddenStems: HiddenStemEntry[],
  pool: StemPool,
): TransparencyMatch[] {
  const results: TransparencyMatch[] = []

  for (const hs of hiddenStems) {
    for (const entry of pool.entries) {
      if (entry.stem === hs.stem) {
        results.push({
          hiddenStem: hs.stem,
          position: hs.position,
          expressedOn: entry.pillar,
          expressedStem: entry.stem,
        })
      }
    }
  }

  return results
}

// ── 4. 冲合判定 ──

/**
 * 判定两个天干是否五合（如甲己合土）。
 * 复用 yongshen/helpers 的 FIVE_COMBO_MAP。
 */
export function isStemCombo(a: string, b: string): boolean {
  return getFiveComboPartner(a) === b
}

/**
 * 判定两个天干是否相冲。
 * 甲庚冲、乙辛冲、丙壬冲、丁癸冲。戊己属中央土，不参与冲。
 */
export function isStemClash(a: string, b: string): boolean {
  return STEM_CLASH_PAIRS.has(a + b)
}

// ── 5. 地支冲合 ──

const BRANCH_CLASH_PAIRS: ReadonlySet<string> = new Set([
  '子午', '午子', '丑未', '未丑', '寅申', '申寅',
  '卯酉', '酉卯', '辰戌', '戌辰', '巳亥', '亥巳',
])

const BRANCH_HARM_PAIRS: ReadonlySet<string> = new Set([
  '子未', '未子', '丑午', '午丑', '寅巳', '巳寅',
  '卯辰', '辰卯', '申亥', '亥申', '酉戌', '戌酉',
])

/** 判定两个地支是否六冲（子午冲等） */
export function isBranchClash(a: string, b: string): boolean {
  return BRANCH_CLASH_PAIRS.has(a + b)
}

/** 判定两个地支是否六害（子未害等） */
export function isBranchHarm(a: string, b: string): boolean {
  return BRANCH_HARM_PAIRS.has(a + b)
}
