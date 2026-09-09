// ─────────────────────────────────────────────────────────────
// 称号阶梯(纯函数,UI 与 UserStats 展示共用)
//
// 称号计数 = titleCount(仅"他人帖首条批注"累计,见 antiSpam.ts)。
// 色阶映射现有曜金主题 token,不新增颜色:
//   铜 → goldMuted / 银 → goldLight / 金 → gold / 曜金 → glowGold
// 若产品验收后需铜/银专属色,必须在 theme/colors.ts 与
// colorsDark.ts 同步加 token(colorsDark 是类型强转,漏改不报错)。
// ─────────────────────────────────────────────────────────────

export type TitleTier = 'bronze' | 'silver' | 'gold' | 'apex'

export interface TitleTierDef {
  /** 达到该称号所需 titleCount(含) */
  threshold: number
  name: string
  tier: TitleTier
}

export const TITLE_TIERS: TitleTierDef[] = [
  { threshold: 10, name: '初窥门径·铜', tier: 'bronze' },
  { threshold: 50, name: '批注学徒·银', tier: 'silver' },
  { threshold: 200, name: '命理师·金', tier: 'gold' },
  { threshold: 500, name: '曜金大师', tier: 'apex' },
]

export interface TitleInfo {
  /** 当前称号名;0 条时 null(UI 显示「进阶中」) */
  name: string | null
  tier: TitleTier | null
  /** 距下一称号所需阈值;已到顶级为 null */
  nextThreshold: number | null
  /** 0..1,当前档内进度;无称号时 = count / 第一档阈值;顶级 = 1 */
  progress: number
}

/** 根据称号计数映射称号信息(纯函数,任何 UI 不得自行推导) */
export function titleForCount(count: number): TitleInfo {
  const n = Math.max(0, Math.floor(count))
  let current: TitleTierDef | null = null
  let next: TitleTierDef | null = null
  for (const tier of TITLE_TIERS) {
    if (n >= tier.threshold) {
      current = tier
    } else {
      next = tier
      break
    }
  }

  if (current === null) {
    return {
      name: null,
      tier: null,
      nextThreshold: TITLE_TIERS[0].threshold,
      progress: n / TITLE_TIERS[0].threshold,
    }
  }

  if (next === null) {
    return { name: current.name, tier: current.tier, nextThreshold: null, progress: 1 }
  }

  const span = next.threshold - current.threshold
  const progress = span > 0 ? (n - current.threshold) / span : 0
  return { name: current.name, tier: current.tier, nextThreshold: next.threshold, progress }
}

const TIER_COLOR_TOKENS: Record<TitleTier, string> = {
  bronze: 'goldMuted',
  silver: 'goldLight',
  gold: 'gold',
  apex: 'glowGold',
}

/** 称号档位对应的主题色 token(theme/colors.ts 的键名) */
export function tierColorToken(tier: TitleTier): string {
  return TIER_COLOR_TOKENS[tier]
}
