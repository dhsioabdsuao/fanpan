import type { BaziResult } from '@/types/bazi'
import type { StrengthDetail } from './types'
import { BRANCH_HIDDEN_STEMS, getConflictAdjust } from './conflictHelpers'
import { getMonthlyOrderScore, getTenGodCategory } from './tenGodHelpers'

export function evaluateMonthlyOrder(bazi: BaziResult): {
  score: number
  details: StrengthDetail[]
} {
  const { dayMaster, pillars } = bazi
  const monthBranch = pillars.month.branch

  const hiddenStems = BRANCH_HIDDEN_STEMS[monthBranch]
  if (!hiddenStems || hiddenStems.length === 0) {
    return { score: 0, details: [] }
  }
  const benQi = hiddenStems[0].stem

  const tenGod = getTenGodCategory(dayMaster, benQi)
  const rawScore = getMonthlyOrderScore(tenGod)

  const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const conflictAdjust = getConflictAdjust(monthBranch, allBranches)

  const finalScore = rawScore * conflictAdjust

  const source = `月支${monthBranch},本气${benQi},十神${tenGod}`
  const detail: StrengthDetail = {
    factor: '月令',
    source,
    rawScore,
    positionWeight: 1.0,
    conflictAdjust,
    finalScore,
  }

  return { score: finalScore, details: [detail] }
}
