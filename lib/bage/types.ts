import type { TenGodName, ReasoningStep } from '@/lib/yongshen/types'

// ── 格局名称 ──

export type PatternName =
  | '正官格' | '七杀格' | '正印格' | '偏印格'
  | '正财格' | '偏财格' | '食神格' | '伤官格'
  | '建禄格' | '月刃格'  // 禄刃月（比劫月令，不立正八格）

// ── 相神 ──

export interface XiangShen {
  gan: string                  // 相神天干
  type: TenGodName             // 相神十神
  role: string                 // 作用说明（如'财生官'、'印制伤护官'）
}

// ── 顶层导出 ──

export interface BageResult {
  // 格名与格神
  patternName: PatternName
  patternGod: string           // 格神天干（如'辛'）
  patternGodType: TenGodName   // 格神的十神（如'正官'）
  patternOrigin: '透干' | '本气不透' | '禄刃借透'
  patternGodSource: string     // 如'透于月干' / '透于年干' / '（月令本气）'

  // 成败（算法内部用，不对外判好坏）
  success: boolean | null      // true=成格, false=败格, null=中立/难以判定
  successDetail: string        // 一句话判定依据
  failureReasons: string[]     // 败格具体原因

  // 相神（成就格局所必需的那个字）
  xiangShen: XiangShen | null

  // 推理步骤
  reasoning: ReasoningStep[]

  // 对外提示（宪法合规：轻描淡写，不展开判定、不判吉凶）
  patternHint: string
}
