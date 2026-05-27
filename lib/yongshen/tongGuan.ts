import type { BaziResult, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
import type { TongGuanResult } from './types'
import {
  FIVE_ELEMENTS,
  CONTROLS,
  getClashMediator,
} from './helpers'

export function deriveTongGuan(
  bazi: BaziResult,
  _strength: DayMasterStrength,
  factPack: FlowFactPack,
): TongGuanResult {
  const dayElement = bazi.dayMasterElement
  const forces = factPack.elementForce.forces
  const totalForce = FIVE_ELEMENTS.reduce(
    (sum, el) => sum + (forces[el]?.force ?? 0),
    0,
  )

  if (totalForce === 0) {
    return { active: false, detail: '五行力量数据缺失' }
  }

  const pcts: { el: ElementType; pct: number }[] = FIVE_ELEMENTS
    .map((el) => ({ el, pct: ((forces[el]?.force ?? 0) / totalForce) * 100 }))
    .sort((a, b) => b.pct - a.pct)

  const structureTypes = factPack.structureSummary?.primaryTypes ?? []
  const hasStructuralConflict = structureTypes.some(
    (t) => t.type === '4a_双行交战',
  )

  // ── 防御：偏枯严重，可能属于从格，不走通关 ──

  if (
    structureTypes.some((t) =>
      ['2a_火土偏枯', '2b_金水偏枯', '2c_木火偏枯', '2d_水土偏枯', '2e_全偏枯'].includes(t.type),
    )
  ) {
    return {
      active: false,
      detail: '命局偏枯严重，可能属于从格范畴，不走通关',
    }
  }

  // ── 找出交战对 ──

  let clashingPair: [ElementType, ElementType] | null = null

  if (hasStructuralConflict) {
    // 条件 A：structureSummary 已标记 → 搜索所有五行（含日主），后续由条件 3 排除
    clashingPair = findClashingPair(pcts, 20)
    if (!clashingPair) {
      return {
        active: false,
        detail: '结构判定有双行交战标记，但未找到满足条件的交战对',
      }
    }
  } else {
    // 条件 B：自行检测 → 排除日主行
    const nonDay = pcts.filter((p) => p.el !== dayElement)

    if (nonDay.length < 2) {
      return { active: false, detail: '不足以形成交战' }
    }

    const top1 = nonDay[0]
    const top2 = nonDay[1]

    if (!areMutuallyControlling(top1.el, top2.el)) {
      return { active: false, detail: '最强两行不相克，不构成交战' }
    }

    if (top1.pct < 25 || top2.pct < 25) {
      return {
        active: false,
        detail: `交战双方力量未达 25%（${top1.el}${top1.pct.toFixed(0)}%、${top2.el}${top2.pct.toFixed(0)}%），不构成双行对峙`,
      }
    }

    clashingPair = CONTROLS[top1.el] === top2.el
      ? [top1.el, top2.el]
      : [top2.el, top1.el]
  }

  // ── 条件 2：两强力量差 < 15% ──

  const pct1 = pcts.find((p) => p.el === clashingPair[0])!.pct
  const pct2 = pcts.find((p) => p.el === clashingPair[1])!.pct
  const diff = Math.abs(pct1 - pct2)

  if (diff >= 15) {
    return {
      active: false,
      detail: `${clashingPair[0]}(${pct1.toFixed(0)}%)与${clashingPair[1]}(${pct2.toFixed(0)}%)力量差${diff.toFixed(0)}%≥15%，一方压倒，扶抑足以处理`,
    }
  }

  // ── 条件 3：两行中不含日主行 ──

  if (clashingPair.includes(dayElement)) {
    return {
      active: false,
      detail: `交战方包含日主行${dayElement}，属于扶抑范畴而非通关`,
    }
  }

  // ── 真通关 ──

  const mediator = getClashMediator(clashingPair[0], clashingPair[1])

  if (!mediator) {
    return { active: false, detail: '无法确定通关五行' }
  }

  return {
    active: true,
    mediator,
    clashingPair,
    detail: `${clashingPair[0]}${clashingPair[1]}交战（力差${diff.toFixed(0)}%），用${mediator}通关：${clashingPair[0]}生${mediator}，${mediator}生${clashingPair[1]}`,
  }
}

// ── 辅助 ──

function areMutuallyControlling(a: ElementType, b: ElementType): boolean {
  return CONTROLS[a] === b || CONTROLS[b] === a
}

/** 从百分比列表中找到最高的两个相克五行，minPct 为最低力量阈值 */
function findClashingPair(
  pcts: { el: ElementType; pct: number }[],
  minPct: number,
): [ElementType, ElementType] | null {
  for (let i = 0; i < pcts.length - 1; i++) {
    for (let j = i + 1; j < pcts.length; j++) {
      const a = pcts[i]
      const b = pcts[j]
      if (areMutuallyControlling(a.el, b.el) && a.pct > minPct && b.pct > minPct) {
        return CONTROLS[a.el] === b.el ? [a.el, b.el] : [b.el, a.el]
      }
    }
  }
  return null
}
