import type { ElementType } from '@/types/bazi'

// ── 十神名称（与 lib/bazi-utils.ts 中 getTenGod() 返回值一致）──

export type TenGodName =
  | '比肩' | '劫财'
  | '食神' | '伤官'
  | '偏财' | '正财'
  | '七杀' | '正官'
  | '偏印' | '正印'

// ── 天干喜忌分类 ──

export type GanCategory = '喜用' | '忌' | '仇' | '闲'

// ── 主导方法论 ──

export type PrimaryMethod = '扶抑' | '从格' | '化格' | '通关'

// ── 单个天干评定 ──

export interface GanRating {
  gan: string            // '甲'～'癸'
  element: ElementType
  yinYang: '阳' | '阴'
  tenGod: TenGodName     // 相对于日主的十神
  category: GanCategory
  priority: number       // 1-10, 喜用神内部排序用, 越小越优先
  score: number          // 综合评分, 正=喜用倾向, 负=忌仇倾向
  reason: string         // 一句话理由
}

// ── 推理步骤 ──

export interface ReasoningStep {
  step: string
  detail: string
}

// ── 扶抑法内部结果 ──

export type FuYiDirection = '克泄耗' | '生扶' | '中和'

export interface FuYiResult {
  active: boolean
  direction: FuYiDirection
  elementScores: Record<ElementType, number>   // 五行级别扶抑基础分
  weight: number                                // 主调权重 0-1
  detail: string
}

// ── 从格内部结果 ──

export type CongGeType = '从强' | '从旺' | '从杀' | '从财' | '从儿' | '从势'

export interface CongGeResult {
  active: boolean
  type?: CongGeType
  congShen?: ElementType[]      // 从神（可能 1-2 个五行）
  detail: string
}

// ── 化格内部结果 ──

export type HuaGeTransformation =
  | '甲己合土' | '乙庚合金' | '丙辛合水' | '丁壬合木' | '戊癸合火'

export interface HuaGeResult {
  active: boolean
  huaShen?: ElementType         // 化神（如'土'、'火'）
  comboPartner?: string          // 合化对方天干（如'己'、'癸'）
  comboPosition?: 'month' | 'hour'  // 合在哪柱
  detail: string
}

// ── 通关内部结果 ──

export type ClashingPair = '金木' | '木土' | '土水' | '水火' | '火金'

export interface TongGuanResult {
  active: boolean
  mediator?: ElementType                       // 通关五行
  clashingPair?: [ElementType, ElementType]    // 交战双方
  detail: string
}

// ── 调候调整 ──

export type TiaoHouLevel = 1 | 2 | 3  // 1=强需求 2=中等 3=弱/无

export interface TiaoHouAdjustment {
  active: boolean
  level: TiaoHouLevel
  pattern: string
  needs: ElementType[]
  overrideFuYi: boolean                 // 一级调候是否推翻扶抑方向
  elementAdjust: Record<ElementType, number>  // 每个五行的调候加减分
  weight: number
  detail: string
  hasRescue: boolean                    // 火炎土燥时金水双全形成调候救应
}

// ── 扶抑+调候+流通 综合权重配置 ──

export interface WeightConfig {
  fuYi: number
  tiaoHou: number
  flow: number
}

// ── 顶层导出 ──

export interface YongShenResult {
  yongShen: GanRating[]
  jiShen: GanRating[]
  xianShen: GanRating[]

  primaryMethod: PrimaryMethod
  reasoning: ReasoningStep[]

  summary: string

  // 调试/内部信息
  fuYi: FuYiResult | null
  congGe: CongGeResult | null
  huaGe: HuaGeResult | null
  tongGuan: TongGuanResult | null
  tiaoHou: TiaoHouAdjustment | null
}
