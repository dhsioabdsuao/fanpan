import type { BaziResult, ElementType } from '@/types/bazi'
import { getStemElement } from '@/lib/bazi-utils'
import { BRANCH_HIDDEN_STEMS } from '@/lib/strength/conflictHelpers'
import type { ElementForceEntry, ElementForceReport } from './types'

const ALL_ELEMENTS: ElementType[] = ['金', '木', '水', '火', '土']

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬'])
const YIN_STEMS = new Set(['乙', '丁', '己', '辛', '癸'])

// 中气贡献 0.6，余气贡献 0.3（本气已含在基础分 1.0 中）
const POSITION_WEIGHT: Record<string, number> = {
  '本气': 0.0,   // 已含在基础分
  '中气': 0.6,
  '余气': 0.3,
}

function initForceMap(): Record<ElementType, { yang: number; yin: number }> {
  const map: Record<string, { yang: number; yin: number }> = {}
  for (const e of ALL_ELEMENTS) map[e] = { yang: 0, yin: 0 }
  return map as Record<ElementType, { yang: number; yin: number }>
}

export function computeElementForce(bazi: BaziResult): ElementForceReport {
  const force = initForceMap()

  // 天干：每个 1.0 分
  for (const pos of ['year', 'month', 'day', 'hour'] as const) {
    const stem = bazi.pillars[pos].stem
    const element = getStemElement(stem)
    const isYang = YANG_STEMS.has(stem)
    if (isYang) {
      force[element].yang += 1.0
    } else {
      force[element].yin += 1.0
    }
  }

  // 地支：本气 1.0（基础分） + 中气/余气加权
  for (const pos of ['year', 'month', 'day', 'hour'] as const) {
    const branch = bazi.pillars[pos].branch
    const hidden = BRANCH_HIDDEN_STEMS[branch]
    if (!hidden) continue

    for (const entry of hidden) {
      const element = getStemElement(entry.stem)
      const weight = POSITION_WEIGHT[entry.position] ?? 0

      // 本气：1.0 基础分
      if (entry.position === '本气') {
        if (YANG_STEMS.has(entry.stem)) {
          force[element].yang += 1.0
        } else {
          force[element].yin += 1.0
        }
      } else {
        // 中气/余气：加权分
        if (YANG_STEMS.has(entry.stem)) {
          force[element].yang += weight
        } else {
          force[element].yin += weight
        }
      }
    }
  }

  // 组装
  let totalForce = 0
  const forces: Record<string, ElementForceEntry> = {}
  for (const e of ALL_ELEMENTS) {
    const f = force[e]
    const total = Math.round((f.yang + f.yin) * 100) / 100
    totalForce += total
    forces[e] = {
      element: e,
      force: total,
      yangForce: Math.round(f.yang * 100) / 100,
      yinForce: Math.round(f.yin * 100) / 100,
    }
  }

  return {
    forces: forces as Record<ElementType, ElementForceEntry>,
    average: Math.round((totalForce / 5) * 100) / 100,
  }
}
