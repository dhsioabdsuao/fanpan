// ── 从格判定（《滴天髓》原文·任铁樵注）──
//
// 从得真者只论从，从神又有吉和凶。
// 日主无根，全局气势偏于一方，无破格之神，方为真从。

import type { BaziResult, ElementType } from '@/types/bazi'
import { getTenGod, getStemElement, getBranchElement } from '@/lib/bazi-utils'
import { getHiddenStemsSpec, detectAllHe } from './helpers'
import { determineStrength } from '@/lib/strength/determineStrength'

// ── 五行生克关系 ──

/** 克我者（官杀） */
function getControllingElement(el: ElementType): ElementType {
  const map: Record<ElementType, ElementType> = {
    '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
  }
  return map[el]
}

/** 我克者（财） */
function getControlledElement(el: ElementType): ElementType {
  const map: Record<ElementType, ElementType> = {
    '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
  }
  return map[el]
}

/** 生我者（印星） */
function getGeneratingElement(el: ElementType): ElementType {
  const map: Record<ElementType, ElementType> = {
    '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
  }
  return map[el]
}

/** 我生者（食伤） */
function getGeneratedElement(el: ElementType): ElementType {
  const map: Record<ElementType, ElementType> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  }
  return map[el]
}

// ── 日主无根 ──

function isRootless(bazi: BaziResult): boolean {
  const { dayMaster, pillars } = bazi

  // 天干（年/月/时）无比劫
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  if (touStems.some((s) => {
    const tg = getTenGod(dayMaster, s)
    return tg === '比肩' || tg === '劫财'
  })) return false

  // 四支藏干无比劫
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  for (const b of branches) {
    const hidden = getHiddenStemsSpec(b)
    if (hidden.some((s) => {
      const tg = getTenGod(dayMaster, s)
      return tg === '比肩' || tg === '劫财'
    })) return false
  }

  return true
}

// ── 地支会局 ──

/** 地支是否成目标元素的三合/三会局 */
function branchesFormElement(branches: string[], element: ElementType): boolean {
  const allHe = detectAllHe(branches)
  return allHe.some((h) => h.element === element && (h.type === '三合' || h.type === '三会'))
}

/** 地支本气中属于目标元素的个数 */
function branchesMainQiCount(branches: string[], element: ElementType): number {
  return branches.filter((b) => {
    const hidden = getHiddenStemsSpec(b)
    return hidden.length > 0 && getStemElement(hidden[0]) === element
  }).length
}

// ── 十神透干检查 ──

function hasStemGod(dayMaster: string, stems: string[], gods: string[]): boolean {
  return stems.some((s) => gods.includes(getTenGod(dayMaster, s)))
}

// ── 从神月令支持：月支必须扶从神（旺月或生扶之月）──
// 与化格同源：《滴天髓》"从神要旺，须得月令之气"
const CONG_MONTH_SUPPORT: Record<ElementType, string[]> = {
  '金': ['申', '酉', '辰', '戌', '丑', '未'],  // 金旺月 + 土月生金
  '木': ['寅', '卯', '亥', '子'],              // 木旺月 + 水月生木
  '水': ['亥', '子', '申', '酉'],              // 水旺月 + 金月生水
  '火': ['巳', '午', '寅', '卯'],              // 火旺月 + 木月生火
  '土': ['辰', '戌', '丑', '未', '巳', '午'],  // 土旺月 + 火月生土
}

// 从神强根（禄旺之地 + 土四季）
const CONG_ROOT_BRANCHES: Record<ElementType, string[]> = {
  '土': ['辰', '戌', '丑', '未', '午'],
  '金': ['申', '酉'],
  '水': ['亥', '子'],
  '木': ['寅', '卯'],
  '火': ['巳', '午'],
}

/** 地支是否参与目标元素的三合/三会局（四支视角） */
function isBranchInElementHe(branch: string, allBranches: string[], element: ElementType): boolean {
  const allHe = detectAllHe(allBranches)
  return allHe.some(
    (h) => h.element === element && h.members.includes(branch) && (h.type === '三合' || h.type === '三会'),
  )
}

// ═══════════════════════════════════════════
// 从杀格
// ═══════════════════════════════════════════

export function isCongSha(bazi: BaziResult): { name: string; reason: string } | null {
  const { dayMaster, pillars } = bazi
  const dayElement = getStemElement(dayMaster)
  const shaElement = getControllingElement(dayElement)

  // 1. 身弱
  const strength = determineStrength(bazi)
  if (strength.level !== '身弱') return null

  // 2. 日主无根
  if (!isRootless(bazi)) return null

  // 3. 天干透官杀
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  if (!hasStemGod(dayMaster, touStems, ['正官', '七杀'])) return null

  // 4. 月令支持从神：月支必须扶官杀
  //    《滴天髓》"从神要旺，须得月令之气"
  const monthBranch = pillars.month.branch
  const supportedMonths = CONG_MONTH_SUPPORT[shaElement]
  if (!supportedMonths.includes(monthBranch)) return null

  // 5. 地支会官杀局（三合/三会，或本气达标）
  //    月令支持时 ≥2 本气即可，否则 ≥3
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const mainQiCount = branchesMainQiCount(branches, shaElement)
  const hasShaJu = branchesFormElement(branches, shaElement)
  const minMainQi = 2  // 月令已确保支持，≥2 即可
  if (!hasShaJu && mainQiCount < minMainQi) return null

  // 6. 无印星化杀（帮身破格因素）
  //    印星透干 + 印星在地支有强根 → 真破格；月令为印星元素 → 提纲破格
  const yinElement = getGeneratingElement(dayElement) // 生我者=印星五行
  const hasYinTou = hasStemGod(dayMaster, touStems, ['正印', '偏印'])
  if (hasYinTou) {
    const yinRoots = CONG_ROOT_BRANCHES[yinElement]
    const yinHasRoot = branches.some((b) => yinRoots.includes(b))
    if (yinHasRoot) return null
  }
  // 月令本气为印星元素 → 提纲帮身，破格
  if (getBranchElement(monthBranch) === yinElement) return null

  // 7. 无食伤制杀（克破因素）
  //    食伤透干 + 食伤在地支有强根 → 真克破
  const shiShangElement = getGeneratedElement(dayElement) // 我生者=食伤五行
  const hasShiShangTou = hasStemGod(dayMaster, touStems, ['食神', '伤官'])
  if (hasShiShangTou) {
    const ssRoots = CONG_ROOT_BRANCHES[shiShangElement]
    const ssHasRoot = branches.some((b) => ssRoots.includes(b))
    if (ssHasRoot) return null
  }
  // 2+地支本气为食伤 → 克神在地支成势
  // 排除已合化为从神（官杀）三合/三会局的地支
  const keBranches = branches.filter((b) => {
    if (getBranchElement(b) !== shiShangElement) return false
    return !isBranchInElementHe(b, branches, shaElement)
  })
  if (keBranches.length >= 2) return null

  return {
    name: '从杀格',
    reason: '日主无根，全局官杀强旺，无印化无食制，气势偏于官杀，成从杀格',
  }
}

// ═══════════════════════════════════════════
// 从财格
// ═══════════════════════════════════════════

export function isCongCai(bazi: BaziResult): { name: string; reason: string } | null {
  const { dayMaster, pillars } = bazi
  const dayElement = getStemElement(dayMaster)
  const caiElement = getControlledElement(dayElement)

  // 1. 身弱
  const strength = determineStrength(bazi)
  if (strength.level !== '身弱') return null

  // 2. 日主无根
  if (!isRootless(bazi)) return null

  // 3. 天干透财星
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  if (!hasStemGod(dayMaster, touStems, ['正财', '偏财'])) return null

  // 4. 月令支持从神：月支必须扶财星
  const monthBranch = pillars.month.branch
  const supportedMonths = CONG_MONTH_SUPPORT[caiElement]
  if (!supportedMonths.includes(monthBranch)) return null

  // 5. 地支会财局（三合/三会，或本气达标）
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const mainQiCount = branchesMainQiCount(branches, caiElement)
  const hasCaiJu = branchesFormElement(branches, caiElement)
  const minMainQi = 2
  if (!hasCaiJu && mainQiCount < minMainQi) return null

  // 6. 无印星帮身（从格通用破格条件）
  const yinElement = getGeneratingElement(dayElement)
  const hasYinTou = hasStemGod(dayMaster, touStems, ['正印', '偏印'])
  if (hasYinTou) {
    const yinRoots = CONG_ROOT_BRANCHES[yinElement]
    const yinHasRoot = branches.some((b) => yinRoots.includes(b))
    if (yinHasRoot) return null
  }
  if (getBranchElement(monthBranch) === yinElement) return null

  // 7. 无比劫夺财（克神因素）
  const biJieElement = dayElement // 比劫与日主同五行
  const hasBiJieTou = hasStemGod(dayMaster, touStems, ['比肩', '劫财'])
  if (hasBiJieTou) {
    const bjRoots = CONG_ROOT_BRANCHES[biJieElement]
    const bjHasRoot = branches.some((b) => bjRoots.includes(b))
    if (bjHasRoot) return null
  }
  // 2+地支本气为比劫 → 克神成势，排除已合化为从神(财)局的地支
  const bjBranches = branches.filter((b) => {
    if (getBranchElement(b) !== biJieElement) return false
    return !isBranchInElementHe(b, branches, caiElement)
  })
  if (bjBranches.length >= 2) return null

  // 8. 官杀泄财：官杀透干且有根则财党杀，不取从财
  //    虚浮官杀（无根）不足以泄财
  const shaElement = getControllingElement(dayElement)
  const hasGuanShaTou = hasStemGod(dayMaster, touStems, ['正官', '七杀'])
  if (hasGuanShaTou) {
    const shaRoots = CONG_ROOT_BRANCHES[shaElement]
    const shaHasRoot = branches.some((b) => shaRoots.includes(b))
    if (shaHasRoot) {
      // 官杀有根 → 真泄财，除非有食伤制杀
      const hasShiShang = hasStemGod(dayMaster, touStems, ['食神', '伤官'])
      if (!hasShiShang) return null
    }
  }
  // 2+地支本气为官杀（非财局成员）→ 泄财成势
  const shaBranches = branches.filter((b) => {
    if (getBranchElement(b) !== shaElement) return false
    return !isBranchInElementHe(b, branches, caiElement)
  })
  if (shaBranches.length >= 2 && !hasGuanShaTou) return null

  return {
    name: '从财格',
    reason: '日主无根，全局财星强旺，无比劫夺财，气势偏于财，成从财格',
  }
}
