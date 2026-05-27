import type { BaziResult, ElementType } from '@/types/bazi'
import type { FlowFactPack } from '@/lib/flow'
import type { GanRating, TenGodName } from './types'
import {
  ALL_GAN,
  CONTROLLED_BY,
  createBaseRating,
} from './helpers'
import { getStemElement, getTenGod } from '@/lib/bazi-utils'

// ── 十神微调表 ──

const KE_XIE_HAO_BONUS: Partial<Record<TenGodName, number>> = {
  '七杀': +0.5,
  '食神': +0.5,
  // 正官/伤官/偏财/正财 → 0（不列即 0）
}

const SHENG_FU_BONUS: Partial<Record<TenGodName, number>> = {
  '正印': +0.5,
  '比肩': +0.3,
  // 偏印/劫财 → 0
}

function getTenGodBonus(tenGod: TenGodName): number {
  return KE_XIE_HAO_BONUS[tenGod] ?? SHENG_FU_BONUS[tenGod] ?? 0
}

// ── 主函数 ──

export function refineYinYang(
  bazi: BaziResult,
  factPack: FlowFactPack,
  baseElementScores: Record<ElementType, number>,
): GanRating[] {
  const dayMaster = bazi.dayMaster
  const forces = factPack.elementForce.forces

  // 收集命局透出的天干（年/月/时）
  const appearedGans = new Set([
    bazi.pillars.year.stem,
    bazi.pillars.month.stem,
    bazi.pillars.hour.stem,
  ])

  // 收集被制的天干
  const suppressedGans = findSuppressedGans(bazi)

  return ALL_GAN.map((gan) => {
    const base = createBaseRating(gan, dayMaster)
    const element = base.element
    let score = baseElementScores[element] ?? 0
    const reasons: string[] = []

    // ── Step 1：基础分 ──
    if (score !== 0) {
      reasons.push(`${element}基础${score > 0 ? '+' : ''}${score}`)
    }

    // ── Step 2：十神微调 ──
    if (score > 0) {
      const bonus = getTenGodBonus(base.tenGod as TenGodName)
      if (bonus !== 0) {
        score += bonus
        reasons.push(`${base.tenGod}${bonus > 0 ? '+' : ''}${bonus}`)
      }
    }

    // ── Step 3：原局有无微调 ──
    const elForce = forces[element]
    const elementForce = elForce?.force ?? 0

    // 补缺
    if (elementForce === 0 && score > 0) {
      score += 0.5
      reasons.push('补缺+0.5')
    }

    // 现成可用
    if (appearedGans.has(gan) && score > 0) {
      score += 0.3
      reasons.push('现成+0.3')
    }

    // 被制减分
    if (suppressedGans.has(gan)) {
      score -= 0.3
      reasons.push('被制-0.3')
    }

    // ── Step 4：阴阳子分量微调 ──
    if (score > 0) {
      const yangForce = elForce?.yangForce ?? 0
      const yinForce = elForce?.yinForce ?? 0
      const yinYang = base.yinYang

      if (yangForce > yinForce * 2 && yinYang === '阴') {
        score += 0.2
        reasons.push('阴补+0.2')
      } else if (yinForce > yangForce * 2 && yinYang === '阳') {
        score += 0.2
        reasons.push('阳补+0.2')
      }
    }

    // ── 组装结果 ──
    const roundedScore = Math.round(score * 100) / 100
    const category = roundedScore > 0.5 ? '喜用'
      : roundedScore < -0.5 ? '忌'
      : '闲'

    return {
      gan,
      element,
      yinYang: base.yinYang,
      tenGod: base.tenGod as TenGodName,
      category,
      priority: -roundedScore,
      score: roundedScore,
      reason: reasons.length > 0 ? reasons.join(', ') : '基础0',
    }
  })
}

// ── 辅助：查找被制的透出天干 ──

function findSuppressedGans(bazi: BaziResult): Set<string> {
  const suppressed = new Set<string>()

  const yearEl = bazi.pillars.year.stemElement
  const monthEl = bazi.pillars.month.stemElement
  const dayEl = bazi.dayMasterElement
  const hourEl = bazi.pillars.hour.stemElement

  // 年干：只有月干相邻
  if (monthEl === CONTROLLED_BY[yearEl]) {
    suppressed.add(bazi.pillars.year.stem)
  }

  // 月干：年干和日干相邻
  if (yearEl === CONTROLLED_BY[monthEl] || dayEl === CONTROLLED_BY[monthEl]) {
    suppressed.add(bazi.pillars.month.stem)
  }

  // 时干：只有日干相邻
  if (dayEl === CONTROLLED_BY[hourEl]) {
    suppressed.add(bazi.pillars.hour.stem)
  }

  return suppressed
}
