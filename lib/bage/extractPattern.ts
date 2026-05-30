import type { BaziResult } from '@/types/bazi'
import type { TenGodName } from '@/lib/yongshen/types'
import type { PatternName } from './types'
import { getTenGod } from '@/lib/bazi-utils'
import { getMonthHiddenStems, buildStemPool, detectTransparency } from './helpers'

// 十二长生禄位（临官）
const LU_POSITION: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
  '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
  '壬': '亥', '癸': '子',
}

// 阳干刃位（帝旺），阴干不立羊刃
const YANG_REN_POSITION: Record<string, string> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
}

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
  isLuRen: boolean
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
          isLuRen: false,
        }
      }
    }

    // 无借透 → 按十二长生禄刃表判定
    const luBranch = LU_POSITION[dayMaster]
    const renBranch = YANG_REN_POSITION[dayMaster]
    let patternName: PatternName
    let isLuRen: boolean
    if (monthBranch === luBranch) {
      patternName = '建禄格'
      isLuRen = true
    } else if (monthBranch === renBranch) {
      patternName = '月刃格'
      isLuRen = true
    } else {
      // 杂气比劫月：月令本气为比劫，但既非禄也非阳干刃 → 兜底建禄格
      patternName = '建禄格'
      isLuRen = false
    }
    return {
      patternName,
      patternGod: benQi.stem,
      patternGodType: benQiTenGod,
      patternOrigin: '本气不透',
      patternGodSource: `（月令${monthBranch}本气${benQi.stem}为${benQiTenGod}，立${patternName}）`,
      isLuRen,
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
        isLuRen: false,
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
    isLuRen: false,
  }
}
