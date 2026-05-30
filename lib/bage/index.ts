import type { BaziResult } from '@/types/bazi'
import type { BageResult } from './types'
import { extractPattern } from './extractPattern'
import { assessOutcome } from './assessOutcome'
import { deriveXiangShen } from './deriveXiangShen'

/**
 * 八格判定主入口：取格 → 成败 → 相神，输出完整 BageResult。
 * 仅需 bazi（月令藏干透干 + 十神生克即可判定，不依赖 strength/factPack）。
 */
export function deriveBage(bazi: BaziResult): BageResult {
  const pattern = extractPattern(bazi)
  const outcome = assessOutcome(bazi, pattern)
  const xiangShen = deriveXiangShen(bazi, pattern)

  const reasoning = buildReasoning(bazi, pattern, outcome, xiangShen)
  const patternHint = buildPatternHint(pattern.patternName, pattern.isLuRen, outcome, xiangShen)

  return {
    patternName: pattern.patternName,
    patternGod: pattern.patternGod,
    patternGodType: pattern.patternGodType,
    patternOrigin: pattern.patternOrigin,
    patternGodSource: pattern.patternGodSource,
    success: outcome.success,
    outcomeType: outcome.outcomeType,
    successDetail: outcome.successDetail,
    failureReasons: outcome.failureReasons,
    xiangShen,
    reasoning,
    patternHint,
  }
}

// ── 推理链 ──

function buildReasoning(
  bazi: BaziResult,
  pattern: ReturnType<typeof extractPattern>,
  outcome: ReturnType<typeof assessOutcome>,
  xs: ReturnType<typeof deriveXiangShen>,
) {
  const steps = []

  steps.push({
    step: '取格',
    detail: `月支${bazi.pillars.month.branch}，格神${pattern.patternGod}（${pattern.patternGodType}），${pattern.patternOrigin === '透干' ? pattern.patternGodSource : pattern.patternGodSource}`,
  })

  if (outcome.success === true) {
    steps.push({ step: '成败', detail: outcome.successDetail })
  } else if (outcome.success === false) {
    steps.push({ step: '成败', detail: outcome.failureReasons.join('；') })
  } else {
    steps.push({ step: '成败', detail: outcome.successDetail || '格局存疑，中立未判' })
  }

  if (xs) {
    steps.push({ step: '相神', detail: `${xs.gan}（${xs.type}），${xs.role}` })
  }

  return steps
}

// ── 对外提示（宪法合规） ──

function buildPatternHint(
  patternName: string,
  isLuRen: boolean,
  outcome: ReturnType<typeof assessOutcome>,
  xs: ReturnType<typeof deriveXiangShen>,
): string {
  // 真禄刃格（月支为日主禄或阳干刃）
  if ((patternName === '建禄格' || patternName === '月刃格') && isLuRen) {
    return `命局立${patternName}，月令为日主禄旺之位。`
  }
  // 杂气兜底建禄格：月令本气比劫但非禄非刃
  if (patternName === '建禄格' || patternName === '月刃格') {
    return `命局立${patternName}。`
  }

  // 成格 + 有相神 → 一句中性结构描述
  if (outcome.success === true && xs) {
    return `命局立${patternName}，${xs.role}。`
  }

  // 败格 / 中立 → 只点格名，不暗示好坏
  return `命局立${patternName}。`
}
