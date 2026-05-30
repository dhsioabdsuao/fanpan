import type { BaziResult } from '@/types/bazi'
import type { TenGodName } from '@/lib/yongshen/types'
import type { PatternName } from './types'
import { getTenGod, getGanIndex } from '@/lib/bazi-utils'
import { getMonthHiddenStems, buildStemPool, detectTransparency } from './helpers'

const PATTERN_MAP: Record<TenGodName, PatternName> = {
  '正官': '正官格', '七杀': '七杀格',
  '正印': '正印格', '偏印': '偏印格',
  '正财': '正财格', '偏财': '偏财格',
  '食神': '食神格', '伤官': '伤官格',
  '比肩': '建禄格', '劫财': '月刃格',
}

export function extractPattern(bazi: BaziResult): {
  patternName: PatternName
  patternGod: string
  patternGodType: TenGodName
  patternOrigin: '透干' | '本气不透' | '禄刃借透'
  patternGodSource: string
} {
  const monthBranch = bazi.pillars.month.branch
  const dayMaster = bazi.dayMaster
  const hiddenStems = getMonthHiddenStems(monthBranch)
  const pool = buildStemPool(bazi)
  const transparency = detectTransparency(hiddenStems, pool)

  const benQi = hiddenStems[0]
  const benQiTenGod = getTenGod(dayMaster, benQi.stem) as TenGodName

  // ── 禄刃月：月令本气为比劫 ──
  if (benQiTenGod === '比肩' || benQiTenGod === '劫财') {
    // 方案2：先看中余气是否有非比劫透出（借透立格）
    for (let i = 1; i < hiddenStems.length; i++) {
      const hs = hiddenStems[i]
      const tenGod = getTenGod(dayMaster, hs.stem) as TenGodName
      if (tenGod === '比肩' || tenGod === '劫财') continue

      const match = transparency.find(t => t.hiddenStem === hs.stem)
      if (match) {
        return {
          patternName: PATTERN_MAP[tenGod],
          patternGod: hs.stem,
          patternGodType: tenGod,
          patternOrigin: '禄刃借透',
          patternGodSource: `（月令${monthBranch}本气为比劫，借${hs.position}${hs.stem}透于${match.expressedOn}干立格）`,
        }
      }
    }

    // 无借透 → 建禄格 / 月刃格
    const isYangMaster = getGanIndex(dayMaster) % 2 === 0
    const patternName: PatternName = isYangMaster ? '建禄格' : '月刃格'
    return {
      patternName,
      patternGod: benQi.stem,
      patternGodType: benQiTenGod,
      patternOrigin: '本气不透',
      patternGodSource: `（月令${monthBranch}本气${benQi.stem}为${benQiTenGod}，立${patternName}）`,
    }
  }

  // ── 非禄刃月：透干优先（本气 → 中气 → 余气） ──
  for (const hs of hiddenStems) {
    const match = transparency.find(t => t.hiddenStem === hs.stem)
    if (match) {
      const tenGod = getTenGod(dayMaster, hs.stem) as TenGodName
      return {
        patternName: PATTERN_MAP[tenGod],
        patternGod: hs.stem,
        patternGodType: tenGod,
        patternOrigin: '透干',
        patternGodSource: `透于${match.expressedOn}干`,
      }
    }
  }

  // 都不透 → 取本气
  const tenGod = getTenGod(dayMaster, benQi.stem) as TenGodName
  return {
    patternName: PATTERN_MAP[tenGod],
    patternGod: benQi.stem,
    patternGodType: tenGod,
    patternOrigin: '本气不透',
    patternGodSource: `（月令${monthBranch}本气${benQi.stem}不透，取本气）`,
  }
}
