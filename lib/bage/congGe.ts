// ── 从格判定（《滴天髓》原文·任铁樵注）──
//
// 从得真者只论从，从神又有吉和凶。
// 日主无根，全局气势偏于一方，无破格之神，方为真从。

import type { BaziResult, ElementType } from '@/types/bazi'
import {
  getTenGod,
  getStemElement,
  getBranchElement,
  getControllingElement,
  getControlledElement,
  getGeneratingElement,
  getGeneratedElement,
} from '@/lib/bazi-utils'
import { getHiddenStemsSpec, detectAllHe } from './helpers'

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
// 从格判定(判定轨迹版)
// 【格局规格书 §0.2】从格判定不依赖强弱模块,只看自身条件。
// 每个检查步骤记录 {label, met, note},未命中时 note 说明原因,
// 供取格层生成 judgementTrace。
// ═══════════════════════════════════════════

export interface CongCheckStep {
  label: string
  met: boolean
  note: string
}

export interface CongGeResult {
  name: string
  reason: string
  steps: CongCheckStep[]
}

function step(label: string, met: boolean, note: string): CongCheckStep {
  return { label, met, note }
}

// ═══════════════════════════════════════════
// 从杀格
// ═══════════════════════════════════════════

export function isCongShaDetailed(bazi: BaziResult): { result: CongGeResult | null; steps: CongCheckStep[] } {
  const { dayMaster, pillars } = bazi
  const dayElement = getStemElement(dayMaster)
  const shaElement = getControllingElement(dayElement)
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const monthBranch = pillars.month.branch
  const steps: CongCheckStep[] = []

  // 1. 日主无根
  const rootless = isRootless(bazi)
  if (rootless) {
    steps.push(step('日主无根', true, '天干无比劫透、四支藏干无比劫'))
  } else {
    const touBiJie = touStems.filter((s) => ['比肩', '劫财'].includes(getTenGod(dayMaster, s)))
    const zhiBiJie = branches.filter((b) => getHiddenStemsSpec(b).some((s) => ['比肩', '劫财'].includes(getTenGod(dayMaster, s))))
    steps.push(step('日主无根', false, `天干透比劫[${touBiJie.join(',') || '无'}]、地支藏比劫[${zhiBiJie.join(',') || '无'}]`))
    return { result: null, steps }
  }

  // 2. 天干透官杀
  const hasGuanSha = hasStemGod(dayMaster, touStems, ['正官', '七杀'])
  const guanShaStems = touStems.filter((s) => ['正官', '七杀'].includes(getTenGod(dayMaster, s)))
  steps.push(step('天干透官杀', hasGuanSha, hasGuanSha ? `透[${guanShaStems.join(',')}]` : '天干无正官/七杀'))
  if (!hasGuanSha) return { result: null, steps }

  // 3. 月令支持从神：月支必须扶官杀
  //    《滴天髓》"从神要旺，须得月令之气"
  const supportedMonths = CONG_MONTH_SUPPORT[shaElement]
  const monthSupported = supportedMonths.includes(monthBranch)
  steps.push(step('月令扶从神', monthSupported, monthSupported ? `月支${monthBranch}属[${supportedMonths.join(',')}]` : `月支${monthBranch}不在${shaElement}之旺相月[${supportedMonths.join(',')}]`))
  if (!monthSupported) return { result: null, steps }

  // 4. 地支会官杀局（三合/三会，或本气达标）
  //    月令支持时 ≥2 本气即可，否则 ≥3
  const mainQiCount = branchesMainQiCount(branches, shaElement)
  const hasShaJu = branchesFormElement(branches, shaElement)
  const minMainQi = 2  // 月令已确保支持，≥2 即可
  const juOk = hasShaJu || mainQiCount >= minMainQi
  steps.push(step('地支官杀成势', juOk, hasShaJu ? '成三合/三会官杀局' : `本气${shaElement}地支${mainQiCount}个(需≥${minMainQi})`))
  if (!juOk) return { result: null, steps }

  // 5. 无印星化杀（帮身破格因素）
  //    印星透干 + 印星在地支有强根 → 真破格；月令为印星元素 → 提纲破格
  const yinElement = getGeneratingElement(dayElement) // 生我者=印星五行
  const hasYinTou = hasStemGod(dayMaster, touStems, ['正印', '偏印'])
  if (hasYinTou) {
    const yinRoots = CONG_ROOT_BRANCHES[yinElement]
    const yinHasRoot = branches.some((b) => yinRoots.includes(b))
    if (yinHasRoot) {
      steps.push(step('无印星化杀', false, `印星透干且地支有根[${yinRoots.join(',')}]→ 帮身破格`))
      return { result: null, steps }
    }
  }
  // 月令本气为印星元素 → 提纲帮身，破格
  if (getBranchElement(monthBranch) === yinElement) {
    steps.push(step('无印星化杀', false, `月支${monthBranch}本气为${yinElement}(印星)→ 提纲帮身破格`))
    return { result: null, steps }
  }
  steps.push(step('无印星化杀', true, hasYinTou ? '印星透干但无根,虚浮不破' : '天干无印星'))

  // 6. 无食伤制杀（克破因素）
  //    食伤透干 + 食伤在地支有强根 → 真克破
  const shiShangElement = getGeneratedElement(dayElement) // 我生者=食伤五行
  const hasShiShangTou = hasStemGod(dayMaster, touStems, ['食神', '伤官'])
  if (hasShiShangTou) {
    const ssRoots = CONG_ROOT_BRANCHES[shiShangElement]
    const ssHasRoot = branches.some((b) => ssRoots.includes(b))
    if (ssHasRoot) {
      steps.push(step('无食伤制杀', false, `食伤透干且地支有根[${ssRoots.join(',')}]→ 克破`))
      return { result: null, steps }
    }
  }
  // 2+地支本气为食伤 → 克神在地支成势
  // 排除已合化为从神（官杀）三合/三会局的地支
  const keBranches = branches.filter((b) => {
    if (getBranchElement(b) !== shiShangElement) return false
    return !isBranchInElementHe(b, branches, shaElement)
  })
  if (keBranches.length >= 2) {
    steps.push(step('无食伤制杀', false, `地支本气为食伤(${shiShangElement})达${keBranches.length}个→ 克神成势`))
    return { result: null, steps }
  }
  steps.push(step('无食伤制杀', true, hasShiShangTou ? '食伤透干但无根,虚浮不破' : '天干无食伤'))

  return {
    result: {
      name: '从杀格',
      reason: '日主无根，全局官杀强旺，无印化无食制，气势偏于官杀，成从杀格',
      steps,
    },
    steps,
  }
}

/** 兼容旧签名:只返回命中结果(取格层请用 isCongShaDetailed 获取轨迹) */
export function isCongSha(bazi: BaziResult): CongGeResult | null {
  return isCongShaDetailed(bazi).result
}

// ═══════════════════════════════════════════
// 从财格
// ═══════════════════════════════════════════

export function isCongCaiDetailed(bazi: BaziResult): { result: CongGeResult | null; steps: CongCheckStep[] } {
  const { dayMaster, pillars } = bazi
  const dayElement = getStemElement(dayMaster)
  const caiElement = getControlledElement(dayElement)
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const monthBranch = pillars.month.branch
  const steps: CongCheckStep[] = []

  // 1. 日主无根
  const rootless = isRootless(bazi)
  if (rootless) {
    steps.push(step('日主无根', true, '天干无比劫透、四支藏干无比劫'))
  } else {
    const touBiJie = touStems.filter((s) => ['比肩', '劫财'].includes(getTenGod(dayMaster, s)))
    const zhiBiJie = branches.filter((b) => getHiddenStemsSpec(b).some((s) => ['比肩', '劫财'].includes(getTenGod(dayMaster, s))))
    steps.push(step('日主无根', false, `天干透比劫[${touBiJie.join(',') || '无'}]、地支藏比劫[${zhiBiJie.join(',') || '无'}]`))
    return { result: null, steps }
  }

  // 2. 天干透财星
  const hasCai = hasStemGod(dayMaster, touStems, ['正财', '偏财'])
  const caiStems = touStems.filter((s) => ['正财', '偏财'].includes(getTenGod(dayMaster, s)))
  steps.push(step('天干透财星', hasCai, hasCai ? `透[${caiStems.join(',')}]` : '天干无正财/偏财'))
  if (!hasCai) return { result: null, steps }

  // 3. 月令支持从神：月支必须扶财星
  const supportedMonths = CONG_MONTH_SUPPORT[caiElement]
  const monthSupported = supportedMonths.includes(monthBranch)
  steps.push(step('月令扶从神', monthSupported, monthSupported ? `月支${monthBranch}属[${supportedMonths.join(',')}]` : `月支${monthBranch}不在${caiElement}之旺相月[${supportedMonths.join(',')}]`))
  if (!monthSupported) return { result: null, steps }

  // 4. 地支会财局（三合/三会，或本气达标）
  const mainQiCount = branchesMainQiCount(branches, caiElement)
  const hasCaiJu = branchesFormElement(branches, caiElement)
  const minMainQi = 2
  const juOk = hasCaiJu || mainQiCount >= minMainQi
  steps.push(step('地支财星成势', juOk, hasCaiJu ? '成三合/三会财局' : `本气${caiElement}地支${mainQiCount}个(需≥${minMainQi})`))
  if (!juOk) return { result: null, steps }

  // 5. 无印星帮身（从格通用破格条件）
  const yinElement = getGeneratingElement(dayElement)
  const hasYinTou = hasStemGod(dayMaster, touStems, ['正印', '偏印'])
  if (hasYinTou) {
    const yinRoots = CONG_ROOT_BRANCHES[yinElement]
    const yinHasRoot = branches.some((b) => yinRoots.includes(b))
    if (yinHasRoot) {
      steps.push(step('无印星帮身', false, `印星透干且地支有根[${yinRoots.join(',')}]→ 帮身破格`))
      return { result: null, steps }
    }
  }
  if (getBranchElement(monthBranch) === yinElement) {
    steps.push(step('无印星帮身', false, `月支${monthBranch}本气为${yinElement}(印星)→ 提纲帮身破格`))
    return { result: null, steps }
  }
  steps.push(step('无印星帮身', true, hasYinTou ? '印星透干但无根,虚浮不破' : '天干无印星'))

  // 6. 无比劫夺财（克神因素）
  const biJieElement = dayElement // 比劫与日主同五行
  const hasBiJieTou = hasStemGod(dayMaster, touStems, ['比肩', '劫财'])
  if (hasBiJieTou) {
    const bjRoots = CONG_ROOT_BRANCHES[biJieElement]
    const bjHasRoot = branches.some((b) => bjRoots.includes(b))
    if (bjHasRoot) {
      steps.push(step('无比劫夺财', false, `比劫透干且地支有根[${bjRoots.join(',')}]→ 克财破格`))
      return { result: null, steps }
    }
  }
  // 2+地支本气为比劫 → 克神成势，排除已合化为从神(财)局的地支
  const bjBranches = branches.filter((b) => {
    if (getBranchElement(b) !== biJieElement) return false
    return !isBranchInElementHe(b, branches, caiElement)
  })
  if (bjBranches.length >= 2) {
    steps.push(step('无比劫夺财', false, `地支本气为比劫达${bjBranches.length}个→ 克神成势`))
    return { result: null, steps }
  }
  steps.push(step('无比劫夺财', true, hasBiJieTou ? '比劫透干但无根,虚浮不破' : '天干无比劫'))

  // 7. 官杀泄财：官杀透干且有根则财党杀，不取从财
  //    虚浮官杀（无根）不足以泄财
  const shaElement = getControllingElement(dayElement)
  const hasGuanShaTou = hasStemGod(dayMaster, touStems, ['正官', '七杀'])
  if (hasGuanShaTou) {
    const shaRoots = CONG_ROOT_BRANCHES[shaElement]
    const shaHasRoot = branches.some((b) => shaRoots.includes(b))
    if (shaHasRoot) {
      // 官杀有根 → 真泄财，除非有食伤制杀
      const hasShiShang = hasStemGod(dayMaster, touStems, ['食神', '伤官'])
      if (!hasShiShang) {
        steps.push(step('官杀不泄财', false, '官杀透干有根且无食伤制杀→ 财党杀' ))
        return { result: null, steps }
      }
    }
  }
  // 2+地支本气为官杀（非财局成员）→ 泄财成势
  const shaBranches = branches.filter((b) => {
    if (getBranchElement(b) !== shaElement) return false
    return !isBranchInElementHe(b, branches, caiElement)
  })
  if (shaBranches.length >= 2 && !hasGuanShaTou) {
    steps.push(step('官杀不泄财', false, `地支本气为官杀达${shaBranches.length}个→ 泄财成势`))
    return { result: null, steps }
  }
  steps.push(step('官杀不泄财', true, hasGuanShaTou ? '官杀透干但无根/有食伤制杀' : '无官杀泄财'))

  return {
    result: {
      name: '从财格',
      reason: '日主无根，全局财星强旺，无比劫夺财，气势偏于财，成从财格',
      steps,
    },
    steps,
  }
}

/** 兼容旧签名:只返回命中结果(取格层请用 isCongCaiDetailed 获取轨迹) */
export function isCongCai(bazi: BaziResult): CongGeResult | null {
  return isCongCaiDetailed(bazi).result
}
