import type { BaziResult } from '@/types/bazi'
import type { StrengthDetail, HiddenStemEntry } from './types'
import {
  BRANCH_HIDDEN_STEMS, BRANCH_POSITION_WEIGHTS, getConflictAdjust, getHiddenStemBaseScore, ROOT_TABLE,
} from './conflictHelpers'
import { getTenGodCategory, isSupportGod, isDrainGod } from './tenGodHelpers'

export function evaluateHiddenStems(bazi: BaziResult): {
  score: number
  details: StrengthDetail[]
} {
  const { dayMaster, pillars } = bazi
  const rootTable = ROOT_TABLE[dayMaster] ?? {}

  const branches = [
    { key: 'year' as const, pillar: pillars.year },
    { key: 'day' as const, pillar: pillars.day },
    { key: 'hour' as const, pillar: pillars.hour },
  ]

  const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]

  const details: StrengthDetail[] = []

  for (const { key, pillar } of branches) {
    const branch = pillar.branch
    const hiddenStems = BRANCH_HIDDEN_STEMS[branch]
    if (!hiddenStems) continue

    const positionWeight = BRANCH_POSITION_WEIGHTS[key]
    const conflictAdjust = getConflictAdjust(branch, allBranches)

    const branchRoots = rootTable[branch] ?? {}

    for (const hs of hiddenStems) {
      if (branchRoots[hs.stem] !== undefined) continue

      const tenGod = getTenGodCategory(dayMaster, hs.stem)
      const rawScore = getHiddenStemBaseScore(hs.position)

      let signedRawScore: number
      if (isSupportGod(tenGod)) {
        signedRawScore = rawScore
      } else if (isDrainGod(tenGod)) {
        signedRawScore = -rawScore
      } else {
        continue
      }

      const finalScore = signedRawScore * positionWeight * conflictAdjust

      const positionLabel = { year: '年支', day: '日支', hour: '时支' }[key]

      details.push({
        factor: '地支藏干',
        source: `${positionLabel}${branch},${hs.stem}(${hs.position}),十神${tenGod}`,
        rawScore: signedRawScore,
        positionWeight,
        conflictAdjust,
        finalScore,
      })
    }
  }

  let total = 0
  for (const d of details) {
    total += d.finalScore
  }
  const score = Math.max(-8, Math.min(8, total))

  return { score, details }
}
