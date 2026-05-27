import type { ElementType } from '@/types/bazi'
import type { FlowFactPack } from '@/lib/flow'
import type {
  GanRating,
  GanCategory,
  ReasoningStep,
  FuYiResult,
  TiaoHouAdjustment,
  TongGuanResult,
} from './types'
import { FIVE_ELEMENTS } from './helpers'

export function rankGanRatings(
  ratings: GanRating[],
  tiaoHou: TiaoHouAdjustment,
  tongGuan: TongGuanResult,
  fuYi: FuYiResult,
  _factPack: FlowFactPack,
): {
  finalRatings: GanRating[]
  yongShen: GanRating[]
  jiShen: GanRating[]
  xianShen: GanRating[]
  reasoning: ReasoningStep[]
} {
  // ── Step 1：融合扶抑与调候 ──

  const fuYiWeight = getFuYiWeight(tiaoHou)
  const tiaoHouWeight = 1 - fuYiWeight

  const fused = ratings.map((r) => {
    const tiaoHouAdjust = tiaoHou.elementAdjust[r.element] ?? 0
    const fusedScore =
      tiaoHouWeight === 0
        ? r.score
        : r.score * fuYiWeight + tiaoHouAdjust * tiaoHouWeight

    return {
      ...r,
      score: Math.round(fusedScore * 100) / 100,
    }
  })

  // ── Step 2：通关加分 ──

  if (tongGuan.active && tongGuan.mediator) {
    for (const r of fused) {
      if (r.element === tongGuan.mediator) {
        r.score = Math.round((r.score + 0.3) * 100) / 100
        r.reason = r.reason + ', 通关+0.3'
      }
    }
  }

  // ── Step 3：重新分类 ──

  for (const r of fused) {
    r.category = classifyScore(r.score)
  }

  // ── Step 4：排序与选取 ──

  const yongShen = fused
    .filter((r) => r.category === '喜用')
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  const jiShen = fused
    .filter((r) => r.category === '忌' || r.category === '仇')
    .sort((a, b) => a.score - b.score) // 最差的排前面
    .slice(0, 3)

  const xianShen = fused.filter(
    (r) => !yongShen.includes(r) && !jiShen.includes(r),
  )

  // ── Step 5：重算 priority ──

  yongShen.forEach((r, i) => {
    r.priority = i + 1
  })

  // ── Step 6：推理链 ──

  const reasoning: ReasoningStep[] = [
    { step: '扶抑定主调', detail: fuYi.detail },
    {
      step: '阴阳干细化',
      detail: `完成10天干十神微调+原局补缺/现成/被制+阴阳子分量平衡，最高分${fused[0]?.gan ?? '—'}(${fused[0]?.score ?? 0})`,
    },
  ]

  if (tiaoHou.level !== 3) {
    reasoning.push({
      step: '调候融合',
      detail: tiaoHou.detail + `（融合权重：扶抑${fuYiWeight} 调候${tiaoHouWeight}）`,
    })
  }

  if (tongGuan.active) {
    reasoning.push({ step: '通关介入', detail: tongGuan.detail })
  }

  reasoning.push({
    step: '最终排序',
    detail: `喜用神:${yongShen.map((g) => g.gan).join('、') || '无'}；忌神:${jiShen.map((g) => g.gan).join('、') || '无'}`,
  })

  return { finalRatings: fused, yongShen, jiShen, xianShen, reasoning }
}

// ── 辅助 ──

function getFuYiWeight(tiaoHou: TiaoHouAdjustment): number {
  if (tiaoHou.level === 3) return 1.0
  if (tiaoHou.overrideFuYi) return 0.3
  if (tiaoHou.level === 1) return 0.5
  return 0.6 // level 2
}

function classifyScore(score: number): GanCategory {
  if (score > 0.5) return '喜用'
  if (score > 0) return '闲'
  if (score >= -0.5) return '闲'
  if (score >= -2.5) return '忌'
  return '仇'
}
