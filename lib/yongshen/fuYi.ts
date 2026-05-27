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
  _factPack: FlowFactPack,
): FuYiResult {
  const dayElement = bazi.dayMasterElement
  const level = strength.level

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
    // 全部 0 分，让调候和流通主导
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
      ? `日主${level}(总分${strength.totalScore})，扶抑法不给强结论，交由调候与流通主导`
      : direction === '克泄耗'
        ? `日主${level}(总分${strength.totalScore})，取克泄耗：财(+3)、官杀(+2)、食伤(+2)为用，印比(-3)为忌`
        : `日主${level}(总分${strength.totalScore})，取生扶：印(+3)、比劫(+2)为用，官杀(-3)、财食(-2)为忌`

  return {
    active: true,
    direction,
    elementScores: scores,
    weight: 1.0, // 实际权重由 index.ts 根据 WeightConfig 覆盖
    detail,
  }
}
