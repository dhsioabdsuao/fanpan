import type { BaziResult, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
import type { CongGeResult, CongGeType } from './types'
import {
  FIVE_ELEMENTS,
  GENERATES,
  CONTROLS,
  GENERATED_BY,
  CONTROLLED_BY,
  hasBenQiRootInBranches,
} from './helpers'

export function deriveCongGe(
  bazi: BaziResult,
  strength: DayMasterStrength,
  factPack: FlowFactPack,
): CongGeResult {
  const dayElement = bazi.dayMasterElement
  const branches = [
    bazi.pillars.year.branch,
    bazi.pillars.month.branch,
    bazi.pillars.day.branch,
    bazi.pillars.hour.branch,
  ]

  // ── 从弱格检查（日主极弱）──

  if (strength.totalScore < 10) {
    // 条件 2：天干无印无比劫
    const stemElements = [
      bazi.pillars.year.stemElement,
      bazi.pillars.month.stemElement,
      bazi.pillars.hour.stemElement,
    ]
    const hasYinOrBiJie = stemElements.some(
      (el) => el === dayElement || el === GENERATED_BY[dayElement],
    )

    if (hasYinOrBiJie) {
      return {
        active: false,
        detail: `日主${dayElement}极弱(totalScore=${strength.totalScore})，但天干有印星或比劫透出，破格不从`,
      }
    }

    // 条件 3：地支无日主行的本气根
    if (hasBenQiRootInBranches(dayElement, branches)) {
      return {
        active: false,
        detail: `日主${dayElement}极弱(totalScore=${strength.totalScore})，但地支有${dayElement}的本气根，为假从格`,
      }
    }

    // 三个条件全部满足 → 真从格，判定从神
    return classifyCongRuo(dayElement, factPack)
  }

  // ── 从强格检查（日主极强）──

  if (strength.totalScore >= 75) {
    // 天干无财官食伤
    const restrainElements = [
      CONTROLS[dayElement],       // 财
      CONTROLLED_BY[dayElement],  // 官杀
      GENERATES[dayElement],      // 食伤
    ]

    const stemElements = [
      bazi.pillars.year.stemElement,
      bazi.pillars.month.stemElement,
      bazi.pillars.hour.stemElement,
    ]
    const hasRestrain = stemElements.some((el) =>
      restrainElements.includes(el),
    )

    if (hasRestrain) {
      return {
        active: false,
        detail: `日主${dayElement}极强(totalScore=${strength.totalScore})，但天干有财官食伤透出，破格不从`,
      }
    }

    // 地支无财官食伤的本气根
    const hasRestrainRoot = restrainElements.some((el) =>
      hasBenQiRootInBranches(el, branches),
    )

    if (hasRestrainRoot) {
      return {
        active: false,
        detail: `日主${dayElement}极强(totalScore=${strength.totalScore})，但地支有财官食伤的本气根，破格不从`,
      }
    }

    // 从强 / 从旺
    const forces = factPack.elementForce.forces
    const dayForce = forces[dayElement]?.force ?? 0
    const totalForce = FIVE_ELEMENTS.reduce((sum, el) => sum + (forces[el]?.force ?? 0), 0)
    const dayPct = totalForce > 0 ? (dayForce / totalForce) * 100 : 0

    const type: CongGeType = dayPct > 50 ? '从旺' : '从强'

    return {
      active: true,
      type,
      congShen: [GENERATED_BY[dayElement], dayElement],
      detail: `日主${dayElement}极强(totalScore=${strength.totalScore})，天干无财官食伤、地支无克泄耗本气根，为${type}格。从神：${GENERATED_BY[dayElement]}(印)生扶日主`,
    }
  }

  // ── 非从格 ──

  return {
    active: false,
    detail: `日主${strength.level}(totalScore=${strength.totalScore})，强度不满足从格条件（需 <10 或 >=75）`,
  }
}

// ── 从弱格类型细分 ──

function classifyCongRuo(
  dayElement: ElementType,
  factPack: FlowFactPack,
): CongGeResult {
  const forces = factPack.elementForce.forces
  const totalForce = FIVE_ELEMENTS.reduce((sum, el) => sum + (forces[el]?.force ?? 0), 0)

  if (totalForce === 0) {
    return {
      active: true,
      type: '从势',
      congShen: [],
      detail: '五行力量数据缺失，暂判从势',
    }
  }

  // 计算各五行力量占比
  const pcts: { el: ElementType; force: number; pct: number }[] = FIVE_ELEMENTS
    .filter((el) => el !== dayElement)
    .map((el) => ({
      el,
      force: forces[el]?.force ?? 0,
      pct: ((forces[el]?.force ?? 0) / totalForce) * 100,
    }))
    .sort((a, b) => b.pct - a.pct)

  const max = pcts[0]

  // 一气从：某行 > 50%
  if (max.pct > 50) {
    let type: CongGeType
    let typeLabel: string

    if (max.el === CONTROLS[dayElement]) {
      type = '从财'
      typeLabel = '财'
    } else if (max.el === CONTROLLED_BY[dayElement]) {
      type = '从杀'
      typeLabel = '官杀'
    } else if (max.el === GENERATES[dayElement]) {
      type = '从儿'
      typeLabel = '食伤'
    } else {
      // 印星或比劫按理已被条件 2 排除，兜底
      type = '从势'
      typeLabel = max.el
    }

    return {
      active: true,
      type,
      congShen: [max.el],
      detail: `日主${dayElement}极弱无根，全局${max.el}(占比${max.pct.toFixed(0)}%)独旺，为${type}格。从${typeLabel}而去`,
    }
  }

  // 从儿特殊：食伤 > 40%
  if (max.el === GENERATES[dayElement] && max.pct > 40) {
    return {
      active: true,
      type: '从儿',
      congShen: [max.el],
      detail: `日主${dayElement}极弱无根，食伤${max.el}占比${max.pct.toFixed(0)}%主导，为从儿格`,
    }
  }

  // 从势：至少两行 > 30%
  const strongElements = pcts.filter((p) => p.pct > 30)
  if (strongElements.length >= 2) {
    return {
      active: true,
      type: '从势',
      congShen: strongElements.map((p) => p.el),
      detail: `日主${dayElement}极弱无根，${strongElements.map((p) => `${p.el}(${p.pct.toFixed(0)}%)`).join('、')}各成气候，为从势格`,
    }
  }

  // 兜底：虽有主导行但未达阈值，仍归从势
  return {
    active: true,
    type: '从势',
    congShen: [max.el],
    detail: `日主${dayElement}极弱无根，全局${max.el}偏旺(${max.pct.toFixed(0)}%)但未独占，暂归从势`,
  }
}
