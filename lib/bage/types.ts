import type { TenGodName } from '@/types/bazi'

export type PatternCategory =
  | '官格' | '杀格'
  | '财格' | '印格'
  | '食神格' | '伤官格'
  | '建禄月劫格' | '阳刃格'

export type PatternDisplayName =
  | '正官格' | '七杀格'
  | '正财格' | '偏财格'
  | '正印格' | '偏印格'
  | '食神格' | '伤官格'
  | '建禄月劫格' | '阳刃格'

export type Outcome = '成格' | '不成格' | '破格'

export type PatternOrigin = '透干' | '会支' | '不透不会' | '比劫当令'

export interface PatternResult {
  category: PatternCategory
  displayName: PatternDisplayName
  yongShen: string
  patternGod: string
  origin: PatternOrigin
  outcome: Outcome
  outcomeReason: string
}
