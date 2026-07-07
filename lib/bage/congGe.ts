// ── 从格判定（《滴天髓》原文·任铁樵注）──
//
// 从得真者只论从，从神又有吉和凶。
// 日主无根，全局气势偏于一方，无破格之神，方为真从。

import type { BaziResult, ElementType } from '@/types/bazi'
import { getTenGod, getStemElement } from '@/lib/bazi-utils'
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

  // 4. 地支会官杀局（三合/三会，或本气≥3）
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const hasShaJu = branchesFormElement(branches, shaElement) || branchesMainQiCount(branches, shaElement) >= 3
  if (!hasShaJu) return null

  // 5. 无印星化杀
  if (hasStemGod(dayMaster, touStems, ['正印', '偏印'])) return null

  // 6. 无食伤制杀
  if (hasStemGod(dayMaster, touStems, ['食神', '伤官'])) return null

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

  // 4. 地支会财局（三合/三会，或本气≥3）
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const hasCaiJu = branchesFormElement(branches, caiElement) || branchesMainQiCount(branches, caiElement) >= 3
  if (!hasCaiJu) return null

  // 5. 无比劫夺财
  if (hasStemGod(dayMaster, touStems, ['比肩', '劫财'])) return null

  // 6. 官杀泄财：若有官杀且无食伤制之，则财党杀，不取从财
  const hasGuanSha = hasStemGod(dayMaster, touStems, ['正官', '七杀'])
  if (hasGuanSha) {
    const hasShiShang = hasStemGod(dayMaster, touStems, ['食神', '伤官'])
    if (!hasShiShang) return null
  }

  return {
    name: '从财格',
    reason: '日主无根，全局财星强旺，无比劫夺财，气势偏于财，成从财格',
  }
}
