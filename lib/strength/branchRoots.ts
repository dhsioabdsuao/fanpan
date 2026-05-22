import type { BaziResult } from '@/types/bazi'
import type { StrengthDetail } from './types'
import {
  BRANCH_HIDDEN_STEMS, BRANCH_POSITION_WEIGHTS, getConflictAdjust, getRootBaseScore, ROOT_TABLE,
} from './conflictHelpers'

export function evaluateBranchRoots(bazi: BaziResult): {
  score: number
  details: StrengthDetail[]
} {
  const { dayMaster, pillars } = bazi
  const rootTable = ROOT_TABLE[dayMaster]
  if (!rootTable) return { score: 0, details: [] }

  const branches = [
    { key: 'year' as const, pillar: pillars.year },
    { key: 'month' as const, pillar: pillars.month },
    { key: 'day' as const, pillar: pillars.day },
    { key: 'hour' as const, pillar: pillars.hour },
  ]

  const allBranches = branches.map((b) => b.pillar.branch)

  const details: StrengthDetail[] = []

  for (const { key, pillar } of branches) {
    const branch = pillar.branch
    const branchRoots = rootTable[branch]
    if (!branchRoots) continue

    const hiddenStems = BRANCH_HIDDEN_STEMS[branch]
    if (!hiddenStems) continue

    for (const hs of hiddenStems) {
      const rootLevel = branchRoots[hs.stem]
      if (!rootLevel) continue

      const rawScore = getRootBaseScore(rootLevel)
      const positionWeight = BRANCH_POSITION_WEIGHTS[key]
      const conflictAdjust = getConflictAdjust(branch, allBranches)

      const finalScore = rawScore * positionWeight * conflictAdjust

      const positionLabel = {
        year: '年支', month: '月支', day: '日支', hour: '时支',
      }[key]

      details.push({
        factor: '地支通根',
        source: `${positionLabel}${branch},${hs.stem}(${rootLevel})`,
        rawScore,
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
  const score = Math.min(total, 25)

  return { score, details }
}
