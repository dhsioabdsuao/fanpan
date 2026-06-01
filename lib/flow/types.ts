import type { ElementType } from '@/types/bazi'

// ── 五行力量 ──

export interface YinYangForce {
  yang: number
  yin: number
  total: number
}

export interface ElementForceEntry {
  element: ElementType
  force: number
  yangForce: number
  yinForce: number
}

export interface ElementForceReport {
  forces: Record<ElementType, ElementForceEntry>
  average: number
}

// ── 相生链路 ──

export type LinkStatus = 'flowing' | 'weak' | 'blocked'

export interface FlowLink {
  from: ElementType
  to: ElementType
  fromForce: number
  toForce: number
  status: LinkStatus
}

// ── 干支关联 ──

export type RelationType = '通根' | '得地' | '虚浮' | '被截脚'

export interface StemBranchPair {
  position: 'year' | 'month' | 'day' | 'hour'
  stem: string
  branch: string
  stemElement: ElementType
  branchElement: ElementType
  relation: RelationType
  detail: string
}

export interface HiddenStemExpress {
  stem: string
  position: string // 本气/中气/余气
  expressed: boolean // 透出否
}

export interface BranchExpressReport {
  branch: string
  branchPosition: 'year' | 'month' | 'day' | 'hour'
  hidden: HiddenStemExpress[]
}

export type YinYangTexture = '纯阳' | '纯阴' | '阳主阴辅' | '阴主阳辅' | '阴阳均衡'

export interface StemBranchReport {
  pairs: StemBranchPair[]
  branchExpressions: BranchExpressReport[]
  yinYangTexture: YinYangTexture
  detail: string
}

// ── 十神层 ──

export interface TenGodDistribution {
  yinStar: number   // 印星（正印+偏印）
  biJie: number     // 比劫（比肩+劫财）
  shiShang: number  // 食伤（食神+伤官）
  cai: number       // 财（正财+偏财）
  guanSha: number   // 官杀（正官+七杀）
}

// ── 调候 ──

export type ColdWarm = '偏寒' | '偏暖' | '平衡'
export type DryWet = '偏燥' | '偏湿' | '平衡'

export type ClimaticPattern = '火炎土燥' | '金水寒滞' | '水冷土湿' | '木火通明' | '平衡'

export interface ClimaticReport {
  coldWarm: ColdWarm
  dryWet: DryWet
  pattern: ClimaticPattern
  needs: ElementType[]
  detail: string
  hasRescue: boolean  // 火炎土燥时金水已到位形成调候救应
}

// ── 刑冲合 ──

export interface ConflictsHarmoniesReport {
  sixClashes: string[]
  threePunishments: string[]
  sixCombinations: string[]
  threeUnions: string[]
  halfUnions: string[]
  archUnions: string[]
}

// ── 命局结构 ──

export type FlowType =
  | '0_未分类'
  | '1a_周流'
  | '1b_起伏'
  | '2a_火土偏枯' | '2b_金水偏枯' | '2c_木火偏枯' | '2d_水土偏枯' | '2e_全偏枯'
  | '3a_印星过旺' | '3b_比劫过旺' | '3c_食伤过旺' | '3d_财官过旺'
  | '4a_双行交战'
  | '5a_散乱'

export interface FlowTypeEntry {
  type: FlowType
  priority: number
  trigger: string
}

export interface StructureSummary {
  primaryTypes: FlowTypeEntry[]
  mainAxis: string | null
  overallTone: string
  yinYangLayer: YinYangTexture
}

// ── LLM 占位符 ──
// Record 的 key 是占位符名（如 日柱、日主），value 是替换值
export type Placeholders = Record<string, string>

// ── 顶层 FactPack ──

export interface FlowFactPack {
  dayMaster: string
  dayMasterElement: ElementType
  monthCommand: {
    branch: string
    element: ElementType
    hiddenStems: string[]
  }
  elementForce: ElementForceReport
  flowLinks: FlowLink[]
  stemBranchRelation: StemBranchReport
  tenGods: TenGodDistribution
  climaticBalance: ClimaticReport
  structureSummary: StructureSummary
  conflictsAndHarmonies: ConflictsHarmoniesReport
  placeholders: Placeholders
}
