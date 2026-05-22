import type { BaziResult } from '@/types/bazi'
import type { DayMasterStrength, StrengthLevel } from './types'
import { evaluateMonthlyOrder } from './monthlyOrder'
import { evaluateBranchRoots } from './branchRoots'
import { evaluateStemSupport } from './stemSupport'
import { evaluateStemDrain } from './stemDrain'
import { evaluateHiddenStems } from './hiddenStems'

export type { DayMasterStrength, StrengthLevel, StrengthBreakdown, StrengthDetail } from './types'

function classifyLevel(totalScore: number): StrengthLevel {
  if (totalScore >= 75) return '极强'
  if (totalScore >= 50) return '偏强'
  if (totalScore >= 25) return '中和'
  if (totalScore >= 10) return '偏弱'
  return '极弱'
}

export function calculateDayMasterStrength(bazi: BaziResult): DayMasterStrength {
  const monthlyOrder = evaluateMonthlyOrder(bazi)
  const branchRoots = evaluateBranchRoots(bazi)
  const stemSupport = evaluateStemSupport(bazi)
  const stemDrain = evaluateStemDrain(bazi)
  const hiddenStems = evaluateHiddenStems(bazi)

  const totalScore =
    monthlyOrder.score +
    branchRoots.score +
    stemSupport.score -
    stemDrain.score +
    hiddenStems.score

  const level = classifyLevel(totalScore)

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    level,
    breakdown: {
      monthlyOrderScore: monthlyOrder.score,
      branchRootsScore: branchRoots.score,
      stemSupportScore: stemSupport.score,
      stemDrainScore: stemDrain.score,
      hiddenStemsScore: hiddenStems.score,
    },
    details: [
      ...monthlyOrder.details,
      ...branchRoots.details,
      ...stemSupport.details,
      ...stemDrain.details,
      ...hiddenStems.details,
    ],
  }
}
