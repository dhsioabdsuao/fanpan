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

type AssessResult = Outcome & {
  helperTenGod: TenGodName | null
  helperRole: string
}

export function assessOutcome(bazi: BaziResult, pattern: PatternInfo): Outcome {
  const result = assessInternal(bazi, pattern)
  const { helperTenGod: _, helperRole: __, ...outcome } = result
  return outcome
}

/** 暴露给 deriveXiangShen：返回帮助格局成立的十神类型及作用说明 */
export function getHelperInfo(
  bazi: BaziResult,
  pattern: PatternInfo,
): { tenGod: TenGodName; role: string } | null {
  const result = assessInternal(bazi, pattern)
  if (result.helperTenGod === null) return null
  return { tenGod: result.helperTenGod, role: result.helperRole }
}

// ── 内部分发 ──

function assessInternal(bazi: BaziResult, pattern: PatternInfo): AssessResult {
  const monthBranch = bazi.pillars.month.branch
  const otherBranches = [
    { pillar: 'year' as const, branch: bazi.pillars.year.branch },
    { pillar: 'day' as const, branch: bazi.pillars.day.branch },
    { pillar: 'hour' as const, branch: bazi.pillars.hour.branch },
  ]

  // 分支 A：建禄格 / 月刃格
  if (pattern.patternName === '建禄格' || pattern.patternName === '月刃格') {
    for (const ob of otherBranches) {
      if (isBranchClash(monthBranch, ob.branch)) {
        return {
          success: null, successDetail: '禄刃格，月令逢冲，结构有动荡，中立未判',
          failureReasons: [],
          helperTenGod: null, helperRole: '',
        }
      }
    }
    return { success: true, successDetail: '禄刃格，月令无冲，自成格局', failureReasons: [], helperTenGod: null, helperRole: '' }
  }

  // 分支 D：本气不透
  if (pattern.patternOrigin === '本气不透') {
    for (const ob of otherBranches) {
      if (isBranchClash(monthBranch, ob.branch)) {
        return { success: null, successDetail: '月令本气不透且逢冲，根基有动荡，中立未判', failureReasons: [], helperTenGod: null, helperRole: '' }
      }
      if (isBranchHarm(monthBranch, ob.branch)) {
        return { success: null, successDetail: '月令本气不透且逢害，根基有动荡，中立未判', failureReasons: [], helperTenGod: null, helperRole: '' }
      }
    }
    return { success: true, successDetail: '月令本气不透，但月支无冲害，格仍成立', failureReasons: [], helperTenGod: null, helperRole: '' }
  }

  // 分支 B/C：透干 / 禄刃借透 → 十神生克
  return assessByTenGod(bazi, pattern)
}

// ── 十神池构建 ──

interface StemTenGod {
  stem: string
  pillar: 'year' | 'month' | 'hour'
  tenGod: TenGodName
}

function buildTenGodSet(bazi: BaziResult): { entries: StemTenGod[]; set: Set<TenGodName> } {
  const pool = buildStemPool(bazi)
  const entries: StemTenGod[] = pool.entries.map(e => ({
    stem: e.stem,
    pillar: e.pillar,
    tenGod: getTenGod(bazi.dayMaster, e.stem) as TenGodName,
  }))
  return { entries, set: new Set(entries.map(e => e.tenGod)) }
}

function noHelper(): Pick<AssessResult, 'helperTenGod' | 'helperRole'> {
  return { helperTenGod: null, helperRole: '' }
}

function pickYin(s: Set<TenGodName>): TenGodName { return s.has('正印') ? '正印' : '偏印' }
function pickCai(s: Set<TenGodName>): TenGodName { return s.has('正财') ? '正财' : '偏财' }
function pickGuanSha(s: Set<TenGodName>): TenGodName { return s.has('正官') ? '正官' : '七杀' }
function pickBiJie(s: Set<TenGodName>): TenGodName { return s.has('比肩') ? '比肩' : '劫财' }

function assessByTenGod(bazi: BaziResult, pattern: PatternInfo): AssessResult {
  const { set: tenGods } = buildTenGodSet(bazi)

  switch (pattern.patternName) {
    case '正官格': return assessZhengGuan(tenGods)
    case '七杀格': return assessQiSha(tenGods)
    case '正印格': return assessZhengYin(tenGods)
    case '偏印格': return assessPianYin(tenGods)
    case '正财格': return assessZhengCai(tenGods)
    case '偏财格': return assessPianCai(tenGods)
    case '食神格': return assessShiShen(tenGods)
    case '伤官格': return assessShangGuan(tenGods)
    default:   return { success: null, successDetail: '未知格名，无法判定', failureReasons: [], ...noHelper() }
  }
}

// ── 正官格 ──
function assessZhengGuan(s: Set<TenGodName>): AssessResult {
  const hasShangGuan = s.has('伤官')
  const hasZhengYin = s.has('正印')
  const hasZhengCai = s.has('正财')
  const hasQiSha = s.has('七杀')

  if (hasQiSha) {
    return { success: null, successDetail: '官杀混杂（正官与七杀同现），难以判定', failureReasons: [], ...noHelper() }
  }

  if (hasShangGuan) {
    if (hasZhengYin) {
      return { success: true, successDetail: '伤官见官，有正印制伤护官', failureReasons: [], helperTenGod: '正印', helperRole: '印制伤护官' }
    }
    if (hasZhengCai) {
      return { success: true, successDetail: '伤官见官，有正财通关（伤生财→财生官）', failureReasons: [], helperTenGod: '正财', helperRole: '财通关（伤生财→财生官）' }
    }
    return { success: false, successDetail: '', failureReasons: ['伤官见官，无印无财化解'], ...noHelper() }
  }

  if (hasZhengCai) {
    return { success: true, successDetail: '格神透干，正财生官，成格', failureReasons: [], helperTenGod: '正财', helperRole: '财生官' }
  }
  if (hasZhengYin) {
    return { success: true, successDetail: '格神透干，正印护官，成格', failureReasons: [], helperTenGod: '正印', helperRole: '印护官' }
  }

  return { success: null, successDetail: '正官透干，无伤官破亦无财印助，中立', failureReasons: [], ...noHelper() }
}

// ── 七杀格 ──
function assessQiSha(s: Set<TenGodName>): AssessResult {
  const hasShiShen = s.has('食神')
  const hasYin = s.has('正印') || s.has('偏印')
  const hasCai = s.has('正财') || s.has('偏财')

  if (hasShiShen && hasYin) {
    if (hasCai) {
      return { success: true, successDetail: '食神制杀与印化杀同现，有财通关调和，成格', failureReasons: [], helperTenGod: pickCai(s), helperRole: '财通关调和' }
    }
    return { success: null, successDetail: '食神制杀与印化杀同现（制化两立），无财调和，难以判定', failureReasons: [], ...noHelper() }
  }

  if (hasShiShen) {
    return { success: true, successDetail: '食神制杀，成格', failureReasons: [], helperTenGod: '食神', helperRole: '食神制杀' }
  }

  if (hasYin) {
    const yin = pickYin(s)
    return { success: true, successDetail: '印星化杀，成格', failureReasons: [], helperTenGod: yin, helperRole: '印星化杀' }
  }

  return { success: false, successDetail: '', failureReasons: ['七杀无制（无食神制杀、无印星化杀）'], ...noHelper() }
}

// ── 正印格 ──
function assessZhengYin(s: Set<TenGodName>): AssessResult {
  const hasCai = s.has('正财') || s.has('偏财')
  const hasBiJie = s.has('比肩') || s.has('劫财')
  const hasGuanSha = s.has('正官') || s.has('七杀')

  if (hasCai) {
    if (hasBiJie) {
      return { success: true, successDetail: '财破印，有比劫制财护印', failureReasons: [], helperTenGod: pickBiJie(s), helperRole: '比劫制财护印' }
    }
    return { success: null, successDetail: '财印并见，无比劫调和，中立未判', failureReasons: [], ...noHelper() }
  }

  if (hasGuanSha) {
    return { success: true, successDetail: '官杀生印，成格', failureReasons: [], helperTenGod: pickGuanSha(s), helperRole: '官杀生印' }
  }

  return { success: null, successDetail: '正印透干，无财破亦无官杀生助，中立', failureReasons: [], ...noHelper() }
}

// ── 偏印格 ──
function assessPianYin(s: Set<TenGodName>): AssessResult {
  const hasShiShen = s.has('食神')
  const hasCai = s.has('正财') || s.has('偏财')

  if (hasShiShen) {
    if (hasCai) {
      return { success: true, successDetail: '枭神夺食，有财制枭护食', failureReasons: [], helperTenGod: pickCai(s), helperRole: '财制枭护食' }
    }
    return { success: false, successDetail: '', failureReasons: ['枭神夺食，无财制枭'], ...noHelper() }
  }

  if (hasCai) {
    return { success: true, successDetail: '财星制偏印，成格', failureReasons: [], helperTenGod: pickCai(s), helperRole: '财制偏印' }
  }

  return { success: null, successDetail: '偏印透干，无食神破亦无财制，中立', failureReasons: [], ...noHelper() }
}

// ── 正财格 ──
function assessZhengCai(s: Set<TenGodName>): AssessResult {
  const hasBiJie = s.has('比肩') || s.has('劫财')
  const hasGuanSha = s.has('正官') || s.has('七杀')
  const hasShiShang = s.has('食神') || s.has('伤官')

  if (hasBiJie) {
    if (hasGuanSha) {
      return { success: true, successDetail: '比劫夺财，有官杀制比劫护财', failureReasons: [], helperTenGod: pickGuanSha(s), helperRole: '官杀制比劫护财' }
    }
    return { success: null, successDetail: '比劫透干，无官杀护卫，中立未判', failureReasons: [], ...noHelper() }
  }

  if (hasShiShang) {
    return { success: true, successDetail: '食伤生财，成格', failureReasons: [], helperTenGod: s.has('食神') ? '食神' : '伤官', helperRole: '食伤生财' }
  }

  return { success: null, successDetail: '正财透干，无比劫破亦无食伤生助，中立', failureReasons: [], ...noHelper() }
}

// ── 偏财格（规则同正财格） ──
function assessPianCai(s: Set<TenGodName>): AssessResult {
  const hasBiJie = s.has('比肩') || s.has('劫财')
  const hasGuanSha = s.has('正官') || s.has('七杀')
  const hasShiShang = s.has('食神') || s.has('伤官')

  if (hasBiJie) {
    if (hasGuanSha) {
      return { success: true, successDetail: '比劫夺财，有官杀制比劫护财', failureReasons: [], helperTenGod: pickGuanSha(s), helperRole: '官杀制比劫护财' }
    }
    return { success: null, successDetail: '比劫透干，无官杀护卫，中立未判', failureReasons: [], ...noHelper() }
  }

  if (hasShiShang) {
    return { success: true, successDetail: '食伤生财，成格', failureReasons: [], helperTenGod: s.has('食神') ? '食神' : '伤官', helperRole: '食伤生财' }
  }

  return { success: null, successDetail: '偏财透干，无比劫破亦无食伤生助，中立', failureReasons: [], ...noHelper() }
}

// ── 食神格 ──
function assessShiShen(s: Set<TenGodName>): AssessResult {
  const hasPianYin = s.has('偏印')
  const hasCai = s.has('正财') || s.has('偏财')
  const hasQiSha = s.has('七杀')

  if (hasPianYin) {
    if (hasCai) {
      return { success: true, successDetail: '枭神夺食，有财制枭护食', failureReasons: [], helperTenGod: pickCai(s), helperRole: '财制枭护食' }
    }
    return { success: false, successDetail: '', failureReasons: ['枭神夺食，无财制枭'], ...noHelper() }
  }

  if (hasCai) {
    return { success: true, successDetail: '食神生财，成格', failureReasons: [], helperTenGod: pickCai(s), helperRole: '食神生财' }
  }

  if (hasQiSha) {
    // 食神制杀：相神取食神（子平真诠正脉），格神兼任相神
    return { success: true, successDetail: '食神制杀，成格', failureReasons: [], helperTenGod: '食神', helperRole: '食神制杀（兼任相神）' }
  }

  return { success: null, successDetail: '食神透干，无偏印破亦无财/杀助，中立', failureReasons: [], ...noHelper() }
}

// ── 伤官格 ──
function assessShangGuan(s: Set<TenGodName>): AssessResult {
  const hasZhengGuan = s.has('正官')
  const hasZhengYin = s.has('正印')
  const hasCai = s.has('正财') || s.has('偏财')

  if (hasZhengGuan) {
    if (hasZhengYin) {
      return { success: true, successDetail: '伤官见官，有正印制伤护官', failureReasons: [], helperTenGod: '正印', helperRole: '印制伤护官' }
    }
    if (hasCai) {
      return { success: true, successDetail: '伤官见官，有财通关（伤生财→财生官）', failureReasons: [], helperTenGod: pickCai(s), helperRole: '财通关（伤生财→财生官）' }
    }
    return { success: false, successDetail: '', failureReasons: ['伤官见官，无印无财化解'], ...noHelper() }
  }

  if (hasCai) {
    return { success: true, successDetail: '伤官生财，成格', failureReasons: [], helperTenGod: pickCai(s), helperRole: '伤官生财' }
  }

  if (hasZhengYin) {
    return { success: true, successDetail: '伤官配印，成格', failureReasons: [], helperTenGod: '正印', helperRole: '伤官配印' }
  }

  return { success: null, successDetail: '伤官透干，无正官破亦无财/印助，中立', failureReasons: [], ...noHelper() }
}
