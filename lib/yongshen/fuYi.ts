import type { BaziResult, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
import type { FuYiResult, FuYiDirection } from './types'
import {
  FIVE_ELEMENTS,
  GENERATES,
  CONTROLS,
  GENERATED_BY,
  CONTROLLED_BY,
} from './helpers'

export function deriveFuYi(
  bazi: BaziResult,
  strength: DayMasterStrength,
  factPack: FlowFactPack,
): FuYiResult {
  const dayElement = bazi.dayMasterElement
  const level = strength.level
  const totalScore = strength.totalScore

  // Step 1: 确定扶抑方向
  let direction: FuYiDirection
  if (level === '中和') {
    direction = '中和'
  } else if (level === '偏强' || level === '极强') {
    direction = '克泄耗'
  } else {
    direction = '生扶'
  }

  // Step 2: 初始五行评分
  const scores: Record<ElementType, number> = {
    金: 0, 木: 0, 水: 0, 火: 0, 土: 0,
  }

  if (direction === '中和') {
    // 中和细分：按 totalScore 在 [25, 50) 区间的位置给减半方向分
    const midPoint = 37.5
    if (totalScore >= midPoint) {
      // 中和偏强 → 轻微取抑（克泄耗，分值减半）
      for (const el of FIVE_ELEMENTS) {
        if (el === dayElement) {
          scores[el] = -1.5 // 比劫：扶身，忌
        } else if (el === GENERATED_BY[dayElement]) {
          scores[el] = -1.5 // 印星：生身，忌
        } else if (el === GENERATES[dayElement]) {
          scores[el] = +1 // 食伤：泄身，用
        } else if (el === CONTROLS[dayElement]) {
          scores[el] = +1.5 // 财：耗身，用
        } else if (el === CONTROLLED_BY[dayElement]) {
          scores[el] = +1 // 官杀：克身，用
        }
      }
    } else {
      // 中和偏弱 → 轻微取扶（生扶，分值减半）
      for (const el of FIVE_ELEMENTS) {
        if (el === dayElement) {
          scores[el] = +1 // 比劫：扶身，用
        } else if (el === GENERATED_BY[dayElement]) {
          scores[el] = +1.5 // 印星：生身，用
        } else if (el === GENERATES[dayElement]) {
          scores[el] = -1 // 食伤：泄身，忌
        } else if (el === CONTROLS[dayElement]) {
          scores[el] = -1 // 财：耗身，忌
        } else if (el === CONTROLLED_BY[dayElement]) {
          scores[el] = -1.5 // 官杀：克身，忌
        }
      }
    }

    // 病药补充：从 elementForce 看五行分布，过旺微抑、缺失微补
    const forces = factPack.elementForce?.forces
    if (forces) {
      const totalForce = FIVE_ELEMENTS.reduce((s, el) => s + (forces[el]?.force ?? 0), 0)
      const avgForce = totalForce / 5
      for (const el of FIVE_ELEMENTS) {
        const elForce = forces[el]?.force ?? avgForce
        if (avgForce > 0 && elForce > avgForce * 1.5) {
          scores[el] = Math.round((scores[el] - 0.5) * 100) / 100
        }
        if (elForce === 0) {
          scores[el] = Math.round((scores[el] + 0.5) * 100) / 100
        }
      }
    }
  } else if (direction === '克泄耗') {
    for (const el of FIVE_ELEMENTS) {
      if (el === dayElement) {
        scores[el] = -3 // 比劫：扶身，忌
      } else if (el === GENERATED_BY[dayElement]) {
        scores[el] = -3 // 印星：生身，忌
      } else if (el === GENERATES[dayElement]) {
        scores[el] = +2 // 食伤：泄身，用
      } else if (el === CONTROLS[dayElement]) {
        scores[el] = +3 // 财：耗身，用
      } else if (el === CONTROLLED_BY[dayElement]) {
        scores[el] = +2 // 官杀：克身，用
      }
    }
  } else {
    // 生扶
    for (const el of FIVE_ELEMENTS) {
      if (el === dayElement) {
        scores[el] = +2 // 比劫：扶身，用
      } else if (el === GENERATED_BY[dayElement]) {
        scores[el] = +3 // 印星：生身，用
      } else if (el === GENERATES[dayElement]) {
        scores[el] = -2 // 食伤：泄身，忌
      } else if (el === CONTROLS[dayElement]) {
        scores[el] = -2 // 财：耗身，忌
      } else if (el === CONTROLLED_BY[dayElement]) {
        scores[el] = -3 // 官杀：克身，忌
      }
    }
  }

  // Step 3: 推理摘要
  const detail =
    direction === '中和'
      ? totalScore >= 37.5
        ? `日主${level}(总分${totalScore}，偏强半区)，扶抑法微弱取克泄耗（分值减半），辅以五行病药微调`
        : `日主${level}(总分${totalScore}，偏弱半区)，扶抑法微弱取生扶（分值减半），辅以五行病药微调`
      : direction === '克泄耗'
        ? `日主${level}(总分${totalScore})，取克泄耗：财(+3)、官杀(+2)、食伤(+2)为用，印比(-3)为忌`
        : `日主${level}(总分${totalScore})，取生扶：印(+3)、比劫(+2)为用，官杀(-3)、财食(-2)为忌`

  return {
    active: true,
    direction,
    elementScores: scores,
    weight: 1.0, // 实际权重由 index.ts 根据 WeightConfig 覆盖
    detail,
  }
}
