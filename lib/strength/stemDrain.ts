import type { BaziResult } from '@/types/bazi'
import type { StrengthDetail } from './types'
import { STEM_POSITION_WEIGHTS } from './conflictHelpers'
import { getDrainBaseScore, getTenGodCategory, isDrainGod } from './tenGodHelpers'
import { doesStemControl } from './conflictHelpers'

export function evaluateStemDrain(bazi: BaziResult): {
  score: number
  details: StrengthDetail[]
} {
  const { dayMaster, pillars } = bazi

  const stems = [
    { key: 'year' as const, stem: pillars.year.stem },
    { key: 'month' as const, stem: pillars.month.stem },
    { key: 'hour' as const, stem: pillars.hour.stem },
  ]

  const details: StrengthDetail[] = []

  for (const { key, stem } of stems) {
    const tenGod = getTenGodCategory(dayMaster, stem)
    if (!isDrainGod(tenGod)) continue

    const rawScore = getDrainBaseScore(tenGod)
    const positionWeight = STEM_POSITION_WEIGHTS[key]

    const otherStems = stems.filter((s) => s.stem !== stem).map((s) => s.stem)
    const isSuppressed = otherStems.some((other) => doesStemControl(other, stem))
    const suppressionAdjust = isSuppressed ? 0.5 : 1.0

    const finalScore = rawScore * positionWeight * suppressionAdjust

    const positionLabel = { year: '年干', month: '月干', hour: '时干' }[key]
    const suppressedNote = isSuppressed ? '(被克×0.5)' : ''

    details.push({
      factor: '天干克泄耗',
      source: `${positionLabel}${stem},十神${tenGod}${suppressedNote}`,
      rawScore,
      positionWeight,
      conflictAdjust: suppressionAdjust,
      finalScore,
    })
  }

  let total = 0
  for (const d of details) {
    total += d.finalScore
  }
  const score = Math.min(total, 12)

  return { score, details }
}
