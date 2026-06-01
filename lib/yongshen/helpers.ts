import type { ElementType } from '@/types/bazi'
import { getStemElement, getTenGod, getBranchElement, getHiddenStems } from '@/lib/bazi-utils'
import type {
  GanCategory,
  TiaoHouLevel,
  WeightConfig,
  ClashingPair,
} from './types'

// ── 常量 ──

export const FIVE_ELEMENTS: ElementType[] = ['金', '木', '水', '火', '土']

export const ALL_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export type GanName = (typeof ALL_GAN)[number]

// ── 天干阴阳 ──

const GAN_YIN_YANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 乙: '阴',
  丙: '阳', 丁: '阴',
  戊: '阳', 己: '阴',
  庚: '阳', 辛: '阴',
  壬: '阳', 癸: '阴',
}

export function getGanYinYang(gan: string): '阳' | '阴' {
  return GAN_YIN_YANG[gan] ?? '阳'
}

// ── 地支本气根 ──
//
// “本气根”定义为地支本身的五行属性（不依赖藏干顺序）。
// 地支主气 = getBranchElement(branch) 的返回值。
//
// 本气根对照表：
//   木日主(甲乙)：寅、卯
//   火日主(丙丁)：巳、午
//   土日主(戊己)：辰、戌、丑、未
//   金日主(庚辛)：申、酉
//   水日主(壬癸)：亥、子
//
// 注意：辰戌丑未中虽藏有其他五行，但本气是土，故只算土日主的本气根。
//       戌中藏辛金（余气），不算金的本气根。

const BEN_QI_ROOTS: Record<ElementType, string[]> = {
  木: ['寅', '卯'],
  火: ['巳', '午'],
  土: ['辰', '戌', '丑', '未'],
  金: ['申', '酉'],
  水: ['亥', '子'],
}

/** 返回某五行对应的本气根地支列表 */
export function getBenQiRoots(element: ElementType): string[] {
  return BEN_QI_ROOTS[element]
}

/** 判定某个地支是否是某五行的本气根 */
export function isBenQiRoot(element: ElementType, branch: string): boolean {
  return BEN_QI_ROOTS[element]?.includes(branch) ?? false
}

/**
 * 从格判定用：日主地支中有没有本气根？
 * 遍历年月日时四支，任一为本气根则返回 true
 */
export function hasBenQiRootInBranches(
  dayMasterElement: ElementType,
  branches: string[],
): boolean {
  return branches.some((b) => isBenQiRoot(dayMasterElement, b))
}

/**
 * 从格/化格判定用：日主地支中有没有任何根（本气/中气/余气全查）
 *
 * 与 hasBenQiRootInBranches 的区别：
 *   本气根只看地支主气五行（如丑=土）；
 *   本函数遍历 getHiddenStems 返回的全部藏干，
 *   任一位置有日主同五行即判为有根。
 */
export function hasAnyRootInBranches(
  dayMasterElement: ElementType,
  branches: string[],
): boolean {
  return branches.some((b) => {
    const hidden = getHiddenStems(b)
    return hidden.some((stem) => getStemElement(stem) === dayMasterElement)
  })
}

// ── 五合（天干合化）──

const FIVE_COMBO_MAP: Record<string, string> = {
  甲: '己', 己: '甲',
  乙: '庚', 庚: '乙',
  丙: '辛', 辛: '丙',
  丁: '壬', 壬: '丁',
  戊: '癸', 癸: '戊',
}

const FIVE_COMBO_ELEMENT: Record<string, ElementType> = {
  甲己: '土', 己甲: '土',
  乙庚: '金', 庚乙: '金',
  丙辛: '水', 辛丙: '水',
  丁壬: '木', 壬丁: '木',
  戊癸: '火', 癸戊: '火',
}

/** 返回某天干的五合搭档，无则 null */
export function getFiveComboPartner(gan: string): string | null {
  return FIVE_COMBO_MAP[gan] ?? null
}

/** 给定两个天干，如果它们五合则返回化神五行，否则 null */
export function getFiveComboElement(gan1: string, gan2: string): ElementType | null {
  const key = gan1 + gan2
  return FIVE_COMBO_ELEMENT[key] ?? null
}

// ── 化格月令要求 ──
//
// 只有月令地支符合化神五行才有资格成化。
// 用的是月柱地支（monthBranch），不是月令五行。

export const HUA_GE_MONTH_REQUIREMENT: Record<string, string[]> = {
  土: ['辰', '戌', '丑', '未', '巳', '午'],   // 甲己合土：土月或火月
  金: ['巳', '酉', '丑', '申'],               // 乙庚合金：金月或金局月
  水: ['亥', '子', '申', '辰'],               // 丙辛合水：水月或水局月
  木: ['寅', '卯', '亥', '未'],               // 丁壬合木：木月或木局月
  火: ['巳', '午', '寅', '戌'],               // 戊癸合火：火月或火局月
}

/** 判定化格是否得月令支持 */
export function isHuaGeMonthAllowed(
  transformedElement: ElementType,
  monthBranch: string,
): boolean {
  return HUA_GE_MONTH_REQUIREMENT[transformedElement]?.includes(monthBranch) ?? false
}

// ── 通关五行 ──

const CLASH_MEDIATOR: Record<ClashingPair, ElementType> = {
  '金木': '水',
  '木土': '火',
  '土水': '金',
  '水火': '木',
  '火金': '土',
}

/** 给定两个交战五行，返回通关五行 */
export function getClashMediator(e1: ElementType, e2: ElementType): ElementType | null {
  // 不依赖 .sort()（Unicode 序不可靠），直接查两个方向
  const key = (e1 + e2) as ClashingPair
  if (key in CLASH_MEDIATOR) return CLASH_MEDIATOR[key]
  const rev = (e2 + e1) as ClashingPair
  if (rev in CLASH_MEDIATOR) return CLASH_MEDIATOR[rev]
  return null
}

// ── 调候分级 ──

/**
 * 从 ClimaticPattern 映射到调候需求等级
 *   1 = 强需求（火炎土燥 / 金水寒滞）
 *   2 = 中等（偏寒 / 偏燥 / 偏湿）
 *   3 = 弱/无（平衡 / 木火通明 等）
 */
export function getTiaoHouLevel(pattern: string): TiaoHouLevel {
  if (pattern === '火炎土燥' || pattern === '金水寒滞') return 1
  if (pattern === '平衡' || pattern === '木火通明') return 3
  return 2
}

// ── 调候五行的克星表（用于计算 elementAdjust）──

/**
 * 五行生克关系：
 *   生：木→火→土→金→水→木
 *   克：木→土→水→火→金→木
 */
const GENERATES: Record<ElementType, ElementType> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}

const CONTROLS: Record<ElementType, ElementType> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
}

const GENERATED_BY: Record<ElementType, ElementType> = {
  火: '木', 土: '火', 金: '土', 水: '金', 木: '水',
}

const CONTROLLED_BY: Record<ElementType, ElementType> = {
  土: '木', 水: '土', 火: '水', 金: '火', 木: '金',
}

export { GENERATES, CONTROLS, GENERATED_BY, CONTROLLED_BY }

// ── 权重配置 ──

/**
 * 根据强弱等级和调候等级计算综合权重。
 *
 * 中和区间（25-49 分）：扶抑弱，调候+流通主导
 * 偏强/偏弱：扶抑主导
 * 极强/极弱（非从格）：扶抑绝对主导
 */
export function getWeightConfig(
  strengthLevel: string,
  tiaoHouLevel: TiaoHouLevel,
): WeightConfig {
  // 调候无需求时，调候的权重挪给扶抑
  if (tiaoHouLevel === 3) {
    switch (strengthLevel) {
      case '中和':
        return { fuYi: 0.5, tiaoHou: 0, flow: 0.5 }
      default:
        return { fuYi: 0.85, tiaoHou: 0, flow: 0.15 }
    }
  }

  switch (strengthLevel) {
    case '中和':
      return { fuYi: 0.3, tiaoHou: 0.4, flow: 0.3 }
    case '偏强':
    case '偏弱':
      return { fuYi: 0.6, tiaoHou: 0.3, flow: 0.1 }
    case '极强':
    case '极弱':
      return { fuYi: 0.7, tiaoHou: 0.2, flow: 0.1 }
    default:
      return { fuYi: 0.5, tiaoHou: 0.3, flow: 0.2 }
  }
}

// ── 分数→喜忌分类 ──

/** 根据综合评分归入 喜用/忌/仇/闲 */
export function classifyGanCategory(score: number): GanCategory {
  if (score >= 1.0) return '喜用'
  if (score >= 0) return '闲'
  if (score >= -1.5) return '忌'
  return '仇'
}

// ── 便捷构造器 ──

/** 为单个天干构造 GanRating 基础对象（不含 score/reason/priority） */
export function createBaseRating(
  gan: string,
  dayMaster: string,
): {
  gan: string
  element: ElementType
  yinYang: '阳' | '阴'
  tenGod: ReturnType<typeof getTenGod>
} {
  return {
    gan,
    element: getStemElement(gan),
    yinYang: getGanYinYang(gan),
    tenGod: getTenGod(dayMaster, gan),
  }
}
