// ── 化格判定（《滴天髓》原文·任铁樵注）──
//
// 化得真者只论化，化神还有几般话。
// 日主参与天干五合，化神透干有强根，全局无克破化神，方为真化。

import type { BaziResult, ElementType } from '@/types/bazi'
import { getStemElement, getBranchElement, getTenGod } from '@/lib/bazi-utils'
import { detectAllHe, getHiddenStemsSpec } from './helpers'

// ── 五合化气映射 ──

interface HuaQiInfo {
  partner: string
  element: ElementType
  newDayMaster: string
}

const HUA_QI_MAP: Record<string, HuaQiInfo> = {
  '甲': { partner: '己', element: '土', newDayMaster: '戊' },
  '己': { partner: '甲', element: '土', newDayMaster: '己' },
  '乙': { partner: '庚', element: '金', newDayMaster: '辛' },
  '庚': { partner: '乙', element: '金', newDayMaster: '庚' },
  '丙': { partner: '辛', element: '水', newDayMaster: '壬' },
  '辛': { partner: '丙', element: '水', newDayMaster: '癸' },
  '丁': { partner: '壬', element: '木', newDayMaster: '乙' },
  '壬': { partner: '丁', element: '木', newDayMaster: '甲' },
  '戊': { partner: '癸', element: '火', newDayMaster: '丙' },
  '癸': { partner: '戊', element: '火', newDayMaster: '丁' },
}

const HUA_NAME_MAP: Record<ElementType, string> = {
  '木': '化木格', '火': '化火格', '土': '化土格',
  '金': '化金格', '水': '化水格',
}

// 克制化神的五行
const KE_MAP: Record<ElementType, ElementType> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
}

// 化神强根分支（禄旺之地 + 土四季）
const HUA_ROOT_BRANCHES: Record<ElementType, string[]> = {
  '土': ['辰', '戌', '丑', '未', '午'],
  '金': ['申', '酉'],
  '水': ['亥', '子'],
  '木': ['寅', '卯'],
  '火': ['巳', '午'],
}

// 化神月令支持：月支必须是化神的旺相之地（旺月或生扶之月）
// 《滴天髓》任铁樵注：“化神要昌，须得月令之气”
const HUA_MONTH_SUPPORT: Record<ElementType, string[]> = {
  '金': ['申', '酉', '辰', '戌', '丑', '未'],  // 金旺月 + 土月生金
  '木': ['寅', '卯', '亥', '子'],              // 木旺月 + 水月生木
  '水': ['亥', '子', '申', '酉'],              // 水旺月 + 金月生水
  '火': ['巳', '午', '寅', '卯'],              // 火旺月 + 木月生火
  '土': ['辰', '戌', '丑', '未', '巳', '午'],  // 土旺月 + 火月生土
}

// ── getHuaQiDayMaster ──

/**
 * 根据原日主和合神，返回化气后的日主天干。
 * 甲己化土 → 甲→戊, 己→己
 * 乙庚化金 → 乙→辛, 庚→庚
 * 丙辛化水 → 丙→壬, 辛→癸
 * 丁壬化木 → 丁→乙, 壬→甲
 * 戊癸化火 → 戊→丙, 癸→丁
 */
export function getHuaQiDayMaster(dayMaster: string, comboStem: string): string | null {
  const info = HUA_QI_MAP[dayMaster]
  if (!info || info.partner !== comboStem) return null
  return info.newDayMaster
}

// ── isHuaGe ──

export function isHuaGe(bazi: BaziResult): { name: string; huaShen: ElementType } | null {
  const { dayMaster, pillars } = bazi
  const info = HUA_QI_MAP[dayMaster]
  if (!info) return null

  // 1. 日主与另一天干形成五合
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  const comboStem = touStems.find((s) => s === info.partner)
  if (!comboStem) return null

  const huaElement = info.element

  // 2. 化神透干：天干中有化神五行的天干（合神本身已透）
  //    合神（partner）的五行 = 化神五行，所以合神透干即化神透干
  const touElements = touStems.map((s) => getStemElement(s))
  if (!touElements.includes(huaElement)) return null

  // 3. 月令支持化神：月支必须是化神的旺相之地
  //    《滴天髓》任铁樵注：“化神要昌，须得月令之气”
  const monthBranch = pillars.month.branch
  const supportedMonths = HUA_MONTH_SUPPORT[huaElement]
  if (!supportedMonths.includes(monthBranch)) return null

  // 4. 化神在地支有强根
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const allHe = detectAllHe(branches)
  const hasHeJu = allHe.some((h) => h.element === huaElement && (h.type === '三合' || h.type === '三会'))

  const rootBranches = HUA_ROOT_BRANCHES[huaElement]
  const hasLuWang = branches.some((b) => rootBranches.includes(b))

  if (!hasHeJu && !hasLuWang) return null

  // 5. 全局无克破化神：无克制化神的五行成势
  //    5a. 克神透干 + 克神在地支有根（禄旺/合局） → 成势克破
  const keElement = KE_MAP[huaElement]
  const keStems = touStems.filter((s) => getStemElement(s) === keElement)
  if (keStems.length > 0) {
    const keRoots = HUA_ROOT_BRANCHES[keElement]
    const keHasBranch = branches.some((b) => keRoots.includes(b))
    const keHasHeJu = allHe.some((h) => h.element === keElement && (h.type === '三合' || h.type === '三会'))
    if (keHasBranch || keHasHeJu) return null
  }

  //    5b. 月令为克神 → 提纲克破，化神失时
  const monthBranchElement = getBranchElement(monthBranch)
  if (monthBranchElement === keElement) return null

  //    5c. 两个或以上地支本气为克神 → 克神在地支成势
  const keBranches = branches.filter((b) => getBranchElement(b) === keElement)
  if (keBranches.length >= 2) return null

  return {
    name: HUA_NAME_MAP[huaElement],
    huaShen: huaElement,
  }
}

// ── 化气后十神重排 ──

export interface HuaQiShiShenResult {
  newDayMaster: string
  huaElement: ElementType
  stemTenGods: Record<'year' | 'month' | 'day' | 'hour', string>
  hiddenTenGods: Record<string, string[]>
}

/**
 * 化气成立后，按新日主重算全局四柱天干和地支藏干的十神。
 * 阳随阳，阴随阴——新日主已由 HUA_QI_MAP 确定。
 */
export function recalculateShiShen(
  bazi: BaziResult,
  newDayMaster: string,
): HuaQiShiShenResult {
  const { pillars } = bazi
  const huaElement = getStemElement(newDayMaster)

  const stemTenGods = {
    year: getTenGod(newDayMaster, pillars.year.stem),
    month: getTenGod(newDayMaster, pillars.month.stem),
    day: getTenGod(newDayMaster, bazi.dayMaster),
    hour: getTenGod(newDayMaster, pillars.hour.stem),
  }

  const branchKeys = ['year', 'month', 'day', 'hour'] as const
  const hiddenTenGods: Record<string, string[]> = {}
  for (const key of branchKeys) {
    const branch = pillars[key].branch
    const hidden = getHiddenStemsSpec(branch)
    hiddenTenGods[key] = hidden.map((s) => getTenGod(newDayMaster, s))
  }

  return { newDayMaster, huaElement, stemTenGods, hiddenTenGods }
}
