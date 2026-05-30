import type { BaziResult } from '@/types/bazi'
import type { TenGodName } from '@/lib/yongshen/types'
import { getTenGod } from '@/lib/bazi-utils'
import { buildStemPool } from './helpers'
import type { PatternName, XiangShen } from './types'
import { getHelperInfo } from './assessOutcome'

type PatternInfo = {
  patternName: PatternName
  patternGod: string
  patternGodType: TenGodName
  patternOrigin: '透干' | '本气不透' | '禄刃借透'
  patternGodSource: string
}

/**
 * 取相神：成就格局所必需的那个天干。
 * 基于 assessOutcome 的判定结果，将帮助格局成立的十神映射到天干池中的具体天干。
 */
export function deriveXiangShen(
  bazi: BaziResult,
  pattern: PatternInfo,
): XiangShen | null {
  const info = getHelperInfo(bazi, pattern)
  if (!info) return null

  const pool = buildStemPool(bazi)
  const dayMaster = bazi.dayMaster

  // 在天干池中找十神类型匹配的天干
  const match = pool.entries.find(
    e => getTenGod(dayMaster, e.stem) === info.tenGod,
  )

  if (!match) return null

  return {
    gan: match.stem,
    type: info.tenGod,
    role: info.role,
  }
}
