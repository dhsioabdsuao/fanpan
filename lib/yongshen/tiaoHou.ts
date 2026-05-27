import type { BaziResult, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
import type { TiaoHouAdjustment, TiaoHouLevel } from './types'
import {
  FIVE_ELEMENTS,
  GENERATES,
  CONTROLS,
  GENERATED_BY,
  CONTROLLED_BY,
  getTiaoHouLevel,
} from './helpers'

// ── 调候 pattern → 五行调整分 ──

const PATTERN_ADJUSTMENTS: Record<string, Record<ElementType, number>> = {
  '火炎土燥': { 金: +2, 木: 0, 水: +2, 火: -2, 土: -2 },
  '金水寒滞': { 金: -2, 木: +2, 水: -2, 火: +2, 土: 0 },
  '水冷土湿': { 金: 0, 木: +1, 水: -2, 火: +2, 土: -1 },
  '木火通明': { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 },
  '平衡':     { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 },
}

function defaultAdjust(): Record<ElementType, number> {
  return { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
}

export function deriveTiaoHou(
  bazi: BaziResult,
  strength: DayMasterStrength,
  factPack: FlowFactPack,
): TiaoHouAdjustment {
  const dayElement = bazi.dayMasterElement
  const climatic = factPack.climaticBalance
  const pattern = climatic.pattern
  const level = getTiaoHouLevel(pattern)

  // ── 三级（平衡/木火通明）：不调整 ──

  if (level === 3) {
    return {
      level: 3,
      needs: [],
      elementAdjust: defaultAdjust(),
      overrideFuYi: false,
      detail: pattern === '木火通明'
        ? '命局木火通明，气势流畅，无需调候补救'
        : '命局五行平衡，无需调候调整',
      active: false,
      weight: 0,
      pattern,
    }
  }

  // ── 获取 pattern 对应的调整分 ──

  const elementAdjust = { ...(PATTERN_ADJUSTMENTS[pattern] ?? defaultAdjust()) }

  // ── 收集调候需求和排斥的五行 ──

  const needs: ElementType[] = []
  const avoids: ElementType[] = []
  for (const el of FIVE_ELEMENTS) {
    if (elementAdjust[el] > 0) needs.push(el)
    if (elementAdjust[el] < 0) avoids.push(el)
  }

  // ── 判定是否 override 扶抑 ──

  const overrideFuYi =
    level === 1 && computeOverride(strength.level, elementAdjust, dayElement)

  // ── 权重 ──

  const weight = level === 1 ? 0.7 : 0.4

  // ── detail ──

  const needStr = needs.length > 0 ? needs.join('、') : '无'
  const avoidStr = avoids.length > 0 ? avoids.join('、') : '无'
  const overrideNote = overrideFuYi
    ? '，与扶抑方向冲突，调候优先'
    : '，与扶抑方向一致'

  const detail = `调候等级${level}（${pattern}）：需${needStr}，避${avoidStr}${overrideNote}`

  return {
    level,
    needs,
    elementAdjust,
    overrideFuYi,
    detail,
    active: true,
    weight,
    pattern,
  }
}

// ── override 判定 ──

function computeOverride(
  strengthLevel: string,
  elementAdjust: Record<ElementType, number>,
  dayElement: ElementType,
): boolean {
  // 中和时不 override
  if (strengthLevel === '中和') return false

  const tiaoHouPos: ElementType[] = []
  const tiaoHouNeg: ElementType[] = []
  for (const el of FIVE_ELEMENTS) {
    if (elementAdjust[el] > 0) tiaoHouPos.push(el)
    if (elementAdjust[el] < 0) tiaoHouNeg.push(el)
  }

  if (strengthLevel === '偏强' || strengthLevel === '极强') {
    // 克泄耗方向：fuYi 用财/官杀/食伤，忌印/比劫
    const fuYiPos = [CONTROLS[dayElement], CONTROLLED_BY[dayElement], GENERATES[dayElement]]
    const fuYiNeg = [GENERATED_BY[dayElement], dayElement]

    // 冲突 = 调候喜fuYi忌，或调候忌fuYi喜
    return (
      tiaoHouPos.some((el) => fuYiNeg.includes(el)) ||
      tiaoHouNeg.some((el) => fuYiPos.includes(el))
    )
  }

  // 生扶方向：fuYi 用印/比劫，忌财/官杀/食伤
  const fuYiPos = [GENERATED_BY[dayElement], dayElement]
  const fuYiNeg = [CONTROLS[dayElement], CONTROLLED_BY[dayElement], GENERATES[dayElement]]

  return (
    tiaoHouPos.some((el) => fuYiNeg.includes(el)) ||
    tiaoHouNeg.some((el) => fuYiPos.includes(el))
  )
}
