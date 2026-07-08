// ── 化格判定（《滴天髓》原文·任铁樵注）──
//
// 化得真者只论化，化神还有几般话。
// 日主参与天干五合，化神透干有强根，全局无克破化神，方为真化。

import type { BaziResult, ElementType } from '@/types/bazi'
import { getStemElement, getTenGod } from '@/lib/bazi-utils'
import { detectAllHe } from './helpers'

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

  // 3. 化神在地支有强根
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const allHe = detectAllHe(branches)
  const hasHeJu = allHe.some((h) => h.element === huaElement && (h.type === '三合' || h.type === '三会'))

  const rootBranches = HUA_ROOT_BRANCHES[huaElement]
  const hasLuWang = branches.some((b) => rootBranches.includes(b))

  if (!hasHeJu && !hasLuWang) return null

  // 4. 全局无克破化神：无克制化神的五行成势
  //    克神透干 + 克神在地支有根（禄旺/合局） → 成势克破
  const keElement = KE_MAP[huaElement]
  const keStems = touStems.filter((s) => getStemElement(s) === keElement)
  if (keStems.length > 0) {
    const keRoots = HUA_ROOT_BRANCHES[keElement]
    const keHasBranch = branches.some((b) => keRoots.includes(b))
    const keHasHeJu = allHe.some((h) => h.element === keElement && (h.type === '三合' || h.type === '三会'))
    if (keHasBranch || keHasHeJu) return null
  }

  return {
    name: HUA_NAME_MAP[huaElement],
    huaShen: huaElement,
  }
}
