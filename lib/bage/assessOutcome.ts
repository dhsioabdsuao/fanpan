import type { BaziResult } from '@/types/bazi'
import type { TenGodName } from '@/lib/yongshen/types'
import { getTenGod } from '@/lib/bazi-utils'
import { buildStemPool, isStemClash, isBranchClash, isBranchHarm } from './helpers'
import type { PatternName } from './types'

type PatternInfo = {
  patternName: PatternName
  patternGod: string
  patternGodType: TenGodName
  patternOrigin: '透干' | '本气不透' | '禄刃借透'
  patternGodSource: string
}

type Outcome = { success: boolean | null; successDetail: string; failureReasons: string[] }

const PILLAR_LABEL: Record<string, string> = {
  year: '年支', month: '月支', day: '日支', hour: '时支',
}

export function assessOutcome(bazi: BaziResult, pattern: PatternInfo): Outcome {
  const monthBranch = bazi.pillars.month.branch
  const otherBranches = [
    { pillar: 'year' as const, branch: bazi.pillars.year.branch },
    { pillar: 'day' as const, branch: bazi.pillars.day.branch },
    { pillar: 'hour' as const, branch: bazi.pillars.hour.branch },
  ]

  // ── 分支 A：建禄格 / 月刃格 ──
  if (pattern.patternName === '建禄格' || pattern.patternName === '月刃格') {
    for (const ob of otherBranches) {
      if (isBranchClash(monthBranch, ob.branch)) {
        return {
          success: false,
          successDetail: '',
          failureReasons: [`月令${monthBranch}被${PILLAR_LABEL[ob.pillar]}${ob.branch}冲，禄刃格破`],
        }
      }
    }
    return { success: true, successDetail: '禄刃格，月令无冲，自成格局', failureReasons: [] }
  }

  // ── 分支 D：本气不透 → 看月支冲害 ──
  if (pattern.patternOrigin === '本气不透') {
    const failures: string[] = []
    for (const ob of otherBranches) {
      if (isBranchClash(monthBranch, ob.branch)) {
        failures.push(`月令${monthBranch}被${PILLAR_LABEL[ob.pillar]}${ob.branch}冲，根基动摇`)
      }
      if (isBranchHarm(monthBranch, ob.branch)) {
        failures.push(`月令${monthBranch}被${PILLAR_LABEL[ob.pillar]}${ob.branch}害，根基动摇`)
      }
    }
    if (failures.length > 0) {
      return { success: false, successDetail: '', failureReasons: failures }
    }
    return { success: true, successDetail: '月令本气不透，但月支无冲害，格仍成立', failureReasons: [] }
  }

  // ── 分支 B/C：透干 / 禄刃借透 → 十神生克成败 ──
  return assessByTenGod(bazi, pattern)
}

// ── 十神生克成败判定 ──

interface StemTenGod {
  stem: string
  pillar: 'year' | 'month' | 'hour'
  tenGod: TenGodName
}

function assessByTenGod(bazi: BaziResult, pattern: PatternInfo): Outcome {
  const pool = buildStemPool(bazi)
  const dayMaster = bazi.dayMaster

  const entries: StemTenGod[] = pool.entries.map(e => ({
    stem: e.stem,
    pillar: e.pillar,
    tenGod: getTenGod(dayMaster, e.stem) as TenGodName,
  }))

  const tenGods = new Set(entries.map(e => e.tenGod))

  // 天干相冲作为辅助信号：格神是否被冲
  const clashStems = pool.entries
    .filter(e => isStemClash(e.stem, pattern.patternGod))
    .map(e => e.stem)

  switch (pattern.patternName) {
    case '正官格': return assessZhengGuan(tenGods, pattern, entries)
    case '七杀格': return assessQiSha(tenGods, pattern)
    case '正印格': return assessZhengYin(tenGods, pattern)
    case '偏印格': return assessPianYin(tenGods, pattern)
    case '正财格': return assessZhengCai(tenGods, pattern)
    case '偏财格': return assessPianCai(tenGods, pattern)
    case '食神格': return assessShiShen(tenGods, pattern)
    case '伤官格': return assessShangGuan(tenGods, pattern)
    default:   return { success: null, successDetail: '未知格名，无法判定', failureReasons: [] }
  }
}

// ── 正官格 ──
// 破：伤官克官；救：正印（印制伤）、正财（伤生财→财生官）
// 官杀混杂（同时有七杀）→ null
function assessZhengGuan(tenGods: Set<string>, _pattern: PatternInfo, _entries: StemTenGod[]): Outcome {
  const hasShangGuan = tenGods.has('伤官')
  const hasZhengYin = tenGods.has('正印')
  const hasZhengCai = tenGods.has('正财')
  const hasQiSha = tenGods.has('七杀')

  if (hasQiSha) {
    return { success: null, successDetail: '官杀混杂（正官与七杀同现），难以判定', failureReasons: [] }
  }

  if (hasShangGuan) {
    if (hasZhengYin) {
      return { success: true, successDetail: '伤官见官，有正印制伤护官', failureReasons: [] }
    }
    if (hasZhengCai) {
      return { success: true, successDetail: '伤官见官，有正财通关（伤生财→财生官）', failureReasons: [] }
    }
    return { success: false, successDetail: '', failureReasons: ['伤官见官，无印无财化解'] }
  }

  if (hasZhengCai || hasZhengYin) {
    const helper = hasZhengCai ? '正财生官' : '正印护官'
    return { success: true, successDetail: `格神透干，${helper}，成格`, failureReasons: [] }
  }

  return { success: null, successDetail: '正官透干，无伤官破亦无财印助，中立', failureReasons: [] }
}

// ── 七杀格 ──
// 成：食神制杀 / 印化杀；破：无制无化
// 食印同现（制化两立）：有财通关→成，无财→null
function assessQiSha(tenGods: Set<string>, _pattern: PatternInfo): Outcome {
  const hasShiShen = tenGods.has('食神')
  const hasZhengYin = tenGods.has('正印')
  const hasPianYin = tenGods.has('偏印')
  const hasCai = tenGods.has('正财') || tenGods.has('偏财')
  const hasYin = hasZhengYin || hasPianYin

  // 食印同现（制化两立）
  if (hasShiShen && hasYin) {
    if (hasCai) {
      return { success: true, successDetail: '食神制杀与印化杀同现，有财通关调和，成格', failureReasons: [] }
    }
    return { success: null, successDetail: '食神制杀与印化杀同现（制化两立），无财调和，难以判定', failureReasons: [] }
  }

  if (hasShiShen) {
    return { success: true, successDetail: '食神制杀，成格', failureReasons: [] }
  }

  if (hasYin) {
    return { success: true, successDetail: '印星化杀，成格', failureReasons: [] }
  }

  return { success: false, successDetail: '', failureReasons: ['七杀无制（无食神制杀、无印星化杀）'] }
}

// ── 正印格 ──
// 破：财破印；救：比劫制财护印；成：官杀生印
function assessZhengYin(tenGods: Set<string>, _pattern: PatternInfo): Outcome {
  const hasCai = tenGods.has('正财') || tenGods.has('偏财')
  const hasBiJie = tenGods.has('比肩') || tenGods.has('劫财')
  const hasGuanSha = tenGods.has('正官') || tenGods.has('七杀')

  if (hasCai) {
    if (hasBiJie) {
      return { success: true, successDetail: '财破印，有比劫制财护印', failureReasons: [] }
    }
    return { success: false, successDetail: '', failureReasons: ['财破印，无比劫制财护印'] }
  }

  if (hasGuanSha) {
    return { success: true, successDetail: '官杀生印，成格', failureReasons: [] }
  }

  return { success: null, successDetail: '正印透干，无财破亦无官杀生助，中立', failureReasons: [] }
}

// ── 偏印格 ──
// 破：食神（枭神夺食）；救：财制枭
function assessPianYin(tenGods: Set<string>, _pattern: PatternInfo): Outcome {
  const hasShiShen = tenGods.has('食神')
  const hasCai = tenGods.has('正财') || tenGods.has('偏财')

  if (hasShiShen) {
    if (hasCai) {
      return { success: true, successDetail: '枭神夺食，有财制枭护食', failureReasons: [] }
    }
    return { success: false, successDetail: '', failureReasons: ['枭神夺食，无财制枭'] }
  }

  if (hasCai) {
    return { success: true, successDetail: '财星制偏印，成格', failureReasons: [] }
  }

  return { success: null, successDetail: '偏印透干，无食神破亦无财制，中立', failureReasons: [] }
}

// ── 正财格 ──
// 破：比劫夺财；救：官杀制比劫护财；成：食伤生财
function assessZhengCai(tenGods: Set<string>, _pattern: PatternInfo): Outcome {
  const hasBiJie = tenGods.has('比肩') || tenGods.has('劫财')
  const hasGuanSha = tenGods.has('正官') || tenGods.has('七杀')
  const hasShiShang = tenGods.has('食神') || tenGods.has('伤官')

  if (hasBiJie) {
    if (hasGuanSha) {
      return { success: true, successDetail: '比劫夺财，有官杀制比劫护财', failureReasons: [] }
    }
    return { success: false, successDetail: '', failureReasons: ['比劫夺财，无官杀制比劫护财'] }
  }

  if (hasShiShang) {
    return { success: true, successDetail: '食伤生财，成格', failureReasons: [] }
  }

  return { success: null, successDetail: '正财透干，无比劫破亦无食伤生助，中立', failureReasons: [] }
}

// ── 偏财格（规则同正财格） ──
function assessPianCai(tenGods: Set<string>, _pattern: PatternInfo): Outcome {
  const hasBiJie = tenGods.has('比肩') || tenGods.has('劫财')
  const hasGuanSha = tenGods.has('正官') || tenGods.has('七杀')
  const hasShiShang = tenGods.has('食神') || tenGods.has('伤官')

  if (hasBiJie) {
    if (hasGuanSha) {
      return { success: true, successDetail: '比劫夺财，有官杀制比劫护财', failureReasons: [] }
    }
    return { success: false, successDetail: '', failureReasons: ['比劫夺财，无官杀制比劫护财'] }
  }

  if (hasShiShang) {
    return { success: true, successDetail: '食伤生财，成格', failureReasons: [] }
  }

  return { success: null, successDetail: '偏财透干，无比劫破亦无食伤生助，中立', failureReasons: [] }
}

// ── 食神格 ──
// 破：偏印（枭神夺食）；救：财制枭；成：财（食神生财）/ 七杀（食神制杀）
function assessShiShen(tenGods: Set<string>, _pattern: PatternInfo): Outcome {
  const hasPianYin = tenGods.has('偏印')
  const hasCai = tenGods.has('正财') || tenGods.has('偏财')
  const hasQiSha = tenGods.has('七杀')

  if (hasPianYin) {
    if (hasCai) {
      return { success: true, successDetail: '枭神夺食，有财制枭护食', failureReasons: [] }
    }
    return { success: false, successDetail: '', failureReasons: ['枭神夺食，无财制枭'] }
  }

  if (hasCai) {
    return { success: true, successDetail: '食神生财，成格', failureReasons: [] }
  }

  if (hasQiSha) {
    return { success: true, successDetail: '食神制杀，成格', failureReasons: [] }
  }

  return { success: null, successDetail: '食神透干，无偏印破亦无财/杀助，中立', failureReasons: [] }
}

// ── 伤官格 ──
// 破：正官（伤官见官）；救：正印（印制伤）、财（通关）；成：财（伤官生财）/ 正印（伤官配印）
function assessShangGuan(tenGods: Set<string>, _pattern: PatternInfo): Outcome {
  const hasZhengGuan = tenGods.has('正官')
  const hasZhengYin = tenGods.has('正印')
  const hasCai = tenGods.has('正财') || tenGods.has('偏财')

  if (hasZhengGuan) {
    if (hasZhengYin) {
      return { success: true, successDetail: '伤官见官，有正印制伤护官', failureReasons: [] }
    }
    if (hasCai) {
      return { success: true, successDetail: '伤官见官，有财通关（伤生财→财生官）', failureReasons: [] }
    }
    return { success: false, successDetail: '', failureReasons: ['伤官见官，无印无财化解'] }
  }

  if (hasCai) {
    return { success: true, successDetail: '伤官生财，成格', failureReasons: [] }
  }

  if (hasZhengYin) {
    return { success: true, successDetail: '伤官配印，成格', failureReasons: [] }
  }

  return { success: null, successDetail: '伤官透干，无正官破亦无财/印助，中立', failureReasons: [] }
}
