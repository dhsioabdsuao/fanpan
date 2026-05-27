import type { BaziResult } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
import type { HuaGeResult } from './types'
import {
  FIVE_ELEMENTS,
  CONTROLLED_BY,
  getFiveComboPartner,
  getFiveComboElement,
  isHuaGeMonthAllowed,
} from './helpers'

export function deriveHuaGe(
  bazi: BaziResult,
  _strength: DayMasterStrength,
  factPack: FlowFactPack,
): HuaGeResult {
  const dayStem = bazi.dayMaster
  const monthStem = bazi.pillars.month.stem
  const hourStem = bazi.pillars.hour.stem
  const monthBranch = bazi.pillars.month.branch

  // ── 条件 1：日主与相邻天干五合 ──

  const partner = getFiveComboPartner(dayStem)
  if (!partner) {
    return { active: false, detail: `日主${dayStem}无五合对象` }
  }

  let comboPosition: 'month' | 'hour'
  let comboStem: string

  if (monthStem === partner) {
    comboPosition = 'month'
    comboStem = monthStem
  } else if (hourStem === partner) {
    comboPosition = 'hour'
    comboStem = hourStem
  } else {
    return {
      active: false,
      detail: `日主${dayStem}与${partner}五合，但${partner}在年干或不在局中，隔位不合`,
    }
  }

  const huaShen = getFiveComboElement(dayStem, comboStem)
  if (!huaShen) {
    return { active: false, detail: '五合化神判定异常' }
  }

  // ── 条件 2：月令支持化神 ──

  if (!isHuaGeMonthAllowed(huaShen, monthBranch)) {
    return {
      active: false,
      detail: `日主${dayStem}与${comboPosition}干${comboStem}合化${huaShen}，但月令${monthBranch}不支持化神${huaShen}，合而不化`,
    }
  }

  // ── 条件 3：化神不被克破 ──

  const controllerElement = CONTROLLED_BY[huaShen] // 克制化神的五行
  const forces = factPack.elementForce.forces
  const totalForce = FIVE_ELEMENTS.reduce(
    (sum, el) => sum + (forces[el]?.force ?? 0),
    0,
  )
  const controllerForce = forces[controllerElement]?.force ?? 0
  const controllerPct = totalForce > 0
    ? (controllerForce / totalForce) * 100
    : 0

  if (controllerPct > 25) {
    return {
      active: false,
      detail: `日主${dayStem}与${comboPosition}干${comboStem}合化${huaShen}，月令${monthBranch}得气，但克化神者${controllerElement}力占${controllerPct.toFixed(0)}%>25%，化神被克破`,
    }
  }

  // ── 真化格 ──

  return {
    active: true,
    huaShen,
    comboPartner: comboStem,
    comboPosition,
    detail: `日主${dayStem}与${comboPosition}干${comboStem}合化${huaShen}，月令${monthBranch}得气，化神不破，真化格成立`,
  }
}
