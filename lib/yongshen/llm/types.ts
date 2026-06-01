import type { BaziResult, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { YongShenResult } from '../types'
import { buildStemPool } from '@/lib/bage/helpers'
import { getHiddenStems } from '@/lib/bazi-utils'

// ── 原局存在状态 ──

export type StemPresence =
  | { status: '透干'; pillar: 'year' | 'month' | 'hour' }
  | { status: '藏支有根'; branches: string[] }
  | { status: '缺失' }

export interface YongShenFactPack {
  primaryMethod: '扶抑' | '从格' | '化格' | '通关'
  dayMaster: string
  dayMasterElement: ElementType
  dayMasterStrength: {
    level: string
    score: number
  }
  structureTone: string
  yongShen: Array<{
    gan: string
    element: ElementType
    tenGod: string
    score: number
    reason: string
    presence: StemPresence
  }>
  jiShen: Array<{
    gan: string
    element: ElementType
    tenGod: string
    score: number
    reason: string
    presence: StemPresence
  }>
  tiaoHou: {
    active: boolean
    pattern?: string
    needs?: string[]
    detail: string
    hasRescue: boolean
  }
  tongGuan: {
    active: boolean
    mediator?: ElementType
    clashingPair?: [ElementType, ElementType]
    detail: string
  }
  isSpecialGe: boolean
  summary: string
}

function computePresence(
  gan: string,
  pool: ReturnType<typeof buildStemPool>,
  allBranches: { name: string; hidden: string[] }[],
): StemPresence {
  // 1. 检查是否透干
  const entry = pool.entries.find((e) => e.stem === gan)
  if (entry) {
    return { status: '透干', pillar: entry.pillar }
  }

  // 2. 检查藏支是否有根
  const rootBranches: string[] = []
  for (const br of allBranches) {
    if (br.hidden.includes(gan)) {
      rootBranches.push(br.name)
    }
  }
  if (rootBranches.length > 0) {
    return { status: '藏支有根', branches: rootBranches }
  }

  // 3. 完全缺失
  return { status: '缺失' }
}

export function buildYongShenFactPack(
  result: YongShenResult,
  bazi: BaziResult,
  strength: DayMasterStrength,
  structureTone: string,
): YongShenFactPack {
  const allRatings = [...result.yongShen, ...result.jiShen, ...result.xianShen]
  const dm = allRatings.find((r) => r.tenGod === '比肩')
  const dayMaster = dm?.gan ?? '?'
  const dayMasterElement = dm?.element ?? '土'

  const pool = buildStemPool(bazi)
  const allBranches = [
    { name: '年', hidden: getHiddenStems(bazi.pillars.year.branch) },
    { name: '月', hidden: getHiddenStems(bazi.pillars.month.branch) },
    { name: '日', hidden: getHiddenStems(bazi.pillars.day.branch) },
    { name: '时', hidden: getHiddenStems(bazi.pillars.hour.branch) },
  ]

  return {
    primaryMethod: result.primaryMethod,
    dayMaster,
    dayMasterElement,
    dayMasterStrength: {
      level: strength.level,
      score: strength.totalScore,
    },
    structureTone,
    yongShen: result.yongShen.map((r) => ({
      gan: r.gan,
      element: r.element,
      tenGod: r.tenGod,
      score: r.score,
      reason: r.reason,
      presence: computePresence(r.gan, pool, allBranches),
    })),
    jiShen: result.jiShen.map((r) => ({
      gan: r.gan,
      element: r.element,
      tenGod: r.tenGod,
      score: r.score,
      reason: r.reason,
      presence: computePresence(r.gan, pool, allBranches),
    })),
    tiaoHou: result.tiaoHou
      ? {
          active: result.tiaoHou.active,
          pattern: result.tiaoHou.pattern,
          needs: result.tiaoHou.needs,
          detail: result.tiaoHou.detail,
          hasRescue: result.tiaoHou.hasRescue,
        }
      : { active: false, detail: '', hasRescue: false },
    tongGuan: result.tongGuan
      ? {
          active: result.tongGuan.active,
          mediator: result.tongGuan.mediator,
          clashingPair: result.tongGuan.clashingPair,
          detail: result.tongGuan.detail,
        }
      : { active: false, detail: '' },
    isSpecialGe: result.primaryMethod === '从格' || result.primaryMethod === '化格',
    summary: result.summary,
  }
}
