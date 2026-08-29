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

// ── isHuaGe(判定轨迹版)──
// 【格局规格书 §0.3】每个检查步骤记录 {label, met, note},
// 未命中时 note 说明原因,供取格层生成 judgementTrace。

export interface HuaGeCheckStep {
  label: string
  met: boolean
  note: string
}

export interface HuaGeResult {
  name: string
  huaShen: ElementType
  steps: HuaGeCheckStep[]
}

export function isHuaGeDetailed(bazi: BaziResult): { result: HuaGeResult | null; steps: HuaGeCheckStep[] } {
  const { dayMaster, pillars } = bazi
  const steps: HuaGeCheckStep[] = []
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const monthBranch = pillars.month.branch

  const info = HUA_QI_MAP[dayMaster]
  if (!info) {
    steps.push({ label: '日主参与五合', met: false, note: `日主${dayMaster}不在五合化气映射中` })
    return { result: null, steps }
  }

  // 1. 日主与另一天干形成五合
  const comboStem = touStems.find((s) => s === info.partner)
  if (comboStem) {
    steps.push({ label: '日主参与五合', met: true, note: `日主${dayMaster}与${comboStem}合化${info.element}` })
  } else {
    steps.push({ label: '日主参与五合', met: false, note: `天干无合神${info.partner},${dayMaster}${info.partner}不合` })
    return { result: null, steps }
  }

  const huaElement = info.element

  // 2. 化神透干：天干中有化神五行的天干（合神本身已透）
  //    合神（partner）的五行 = 化神五行，所以合神透干即化神透干
  const touElements = touStems.map((s) => getStemElement(s))
  const huaTou = touElements.includes(huaElement)
  steps.push({ label: '化神透干', met: huaTou, note: huaTou ? `合神${comboStem}即化神${huaElement}之干` : `天干无${huaElement}五行` })
  if (!huaTou) return { result: null, steps }

  // 3. 月令支持化神：月支必须是化神的旺相之地
  //    《滴天髓》任铁樵注：“化神要昌，须得月令之气”
  const supportedMonths = HUA_MONTH_SUPPORT[huaElement]
  const monthSupported = supportedMonths.includes(monthBranch)
  steps.push({ label: '月令支持化神', met: monthSupported, note: monthSupported ? `月支${monthBranch}属[${supportedMonths.join(',')}]` : `月支${monthBranch}不在${huaElement}之旺相月[${supportedMonths.join(',')}]` })
  if (!monthSupported) return { result: null, steps }

  // 4. 化神在地支有强根
  const allHe = detectAllHe(branches)
  const hasHeJu = allHe.some((h) => h.element === huaElement && (h.type === '三合' || h.type === '三会'))

  const rootBranches = HUA_ROOT_BRANCHES[huaElement]
  const hasLuWang = branches.some((b) => rootBranches.includes(b))

  if (hasHeJu || hasLuWang) {
    steps.push({ label: '化神有强根', met: true, note: hasHeJu ? '地支成化神三合/三会局' : `地支有化神强根[${rootBranches.join(',')}]` })
  } else {
    steps.push({ label: '化神有强根', met: false, note: `地支无${huaElement}强根且无化神合会局` })
    return { result: null, steps }
  }

  // 5. 全局无克破化神：无克制化神的五行成势
  //    5a. 克神透干 + 克神在地支有根（禄旺/合局） → 成势克破
  const keElement = KE_MAP[huaElement]
  const keStems = touStems.filter((s) => getStemElement(s) === keElement)
  if (keStems.length > 0) {
    const keRoots = HUA_ROOT_BRANCHES[keElement]
    const keHasBranch = branches.some((b) => keRoots.includes(b))
    const keHasHeJu = allHe.some((h) => h.element === keElement && (h.type === '三合' || h.type === '三会'))
    if (keHasBranch || keHasHeJu) {
      steps.push({ label: '无克破化神', met: false, note: `克神${keElement}透干[${keStems.join(',')}]且有根/成局→ 克破` })
      return { result: null, steps }
    }
  }

  //    5b. 月令为克神 → 提纲克破，化神失时
  const monthBranchElement = getBranchElement(monthBranch)
  if (monthBranchElement === keElement) {
    steps.push({ label: '无克破化神', met: false, note: `月支${monthBranch}本气为克神${keElement}→ 提纲克破` })
    return { result: null, steps }
  }

  //    5c. 两个或以上地支本气为克神 → 克神在地支成势
  const keBranches = branches.filter((b) => getBranchElement(b) === keElement)
  if (keBranches.length >= 2) {
    steps.push({ label: '无克破化神', met: false, note: `地支本气为克神${keElement}达${keBranches.length}个→ 克神成势` })
    return { result: null, steps }
  }

  steps.push({ label: '无克破化神', met: true, note: keStems.length > 0 ? `克神透干[${keStems.join(',')}]但无根不成势` : `天干地支无克神${keElement}成势` })

  return {
    result: {
      name: HUA_NAME_MAP[huaElement],
      huaShen: huaElement,
      steps,
    },
    steps,
  }
}

/** 兼容旧签名:只返回命中结果(取格层请用 isHuaGeDetailed 获取轨迹) */
export function isHuaGe(bazi: BaziResult): { name: string; huaShen: ElementType } | null {
  const r = isHuaGeDetailed(bazi).result
  return r ? { name: r.name, huaShen: r.huaShen } : null
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
