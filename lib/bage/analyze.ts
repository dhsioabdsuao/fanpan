// ─────────────────────────────────────────────────────────────
// 统一诊断管线(诊断流程 L0-L9 结构化层)
//
// analyze(bazi) 按固定顺序一次算完全部判断层:
//   取格 → 成败 → 强弱 → 调候 → 流通 → 喜忌 → 神煞
// 所有文案模块与 UI 只消费本对象,禁止各自重新推导。
// 文案字段(texts)在 S5 填充。
// ─────────────────────────────────────────────────────────────

import type { BaziResult, ElementType } from '@/types/bazi'
import { extractPattern } from './extractPattern'
import type { ExtractResult } from './extractPattern'
import { assessOutcome } from './assessOutcome'
import type { AssessResult } from './assessOutcome'
import { determineStrength } from '@/lib/strength/determineStrength'
import type { StrengthResult } from '@/lib/strength/determineStrength'
import { getTiaoHouYongShen, getTiaoHouType, countWuXing } from './tiaoHou'
import { analyzeWuXingLiuTong } from './liuTong'
import type { LiuTongResult } from './liuTong'
import { computeXiYong } from './xiYong'
import type { XiYongResult } from './xiYong'
import { getAllShenSha } from './shensha'
import type { ShenSha } from './shensha'
import { getStemElement } from '@/lib/bazi-utils'
import { generateAnalysisFromFull } from './generateAnalysis'
import type { AnalysisInput, AnalysisResult } from './generateAnalysis'
import { generateNarrative } from './narrative'
import { generateCareerGuidanceFromFull } from './careerGuidance'
import type { CareerGuidance } from './careerGuidance'
import { generateHealthGuidanceFromFull } from './healthGuidance'
import type { HealthGuidance } from './healthGuidance'

export interface TiaoHouResult {
  type: '火炎土燥' | '金寒水冷' | '寒暖适中'
  /** 穷通宝鉴调候天干(原文) */
  gods: string[]
  /** 调候天干对应五行(去重) */
  elements: ElementType[]
}

export interface WuXingResult {
  /** 8 分制计数(UI 图表/旺衰展示用,同 bazi.elementCount) */
  count: Record<ElementType, number>
  /** 最旺五行 */
  dominant: ElementType | null
  /** 缺失五行 */
  deficient: ElementType[]
}

export interface FullTexts {
  summary: string
  analysis: string
  narrative: string
  career: CareerGuidance
  health: HealthGuidance
}

export interface FullAnalysis {
  bazi: BaziResult
  pattern: ExtractResult
  outcome: AssessResult
  strength: StrengthResult
  tiaoHou: TiaoHouResult
  liuTong: LiuTongResult
  wuXing: WuXingResult
  xiYong: XiYongResult
  shenSha: ShenSha[]
  /** 文案层(全部由结构化结论翻译而来) */
  texts: FullTexts
}

const ELEMENTS: ElementType[] = ['木', '火', '土', '金', '水']

/** 兼容旧签名:内部走统一管线(analyze 一次),pattern/outcome/strength 参数仅作契约 */
export function generateAnalysis(input: AnalysisInput): AnalysisResult {
  return generateAnalysisFromFull(analyze(input.bazi))
}

/** 兼容旧签名:内部走统一管线(analyze 一次) */
export function generateCareerGuidance(bazi: BaziResult): CareerGuidance {
  return generateCareerGuidanceFromFull(analyze(bazi))
}

/** 兼容旧签名:内部走统一管线(analyze 一次) */
export function generateHealthGuidance(bazi: BaziResult): HealthGuidance {
  return generateHealthGuidanceFromFull(analyze(bazi))
}

export function analyze(bazi: BaziResult): FullAnalysis {
  // L2 取格(含化格/从格先行判定与判定轨迹)
  const pattern = extractPattern(bazi)

  // L4 成败(结构化成格条件)
  const outcome = assessOutcome(bazi, pattern)

  // L3 强弱(仅作参考,无硬门槛)
  const strength = determineStrength(bazi)

  // L5 调候
  const gods = getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch)
  const tiaoHou: TiaoHouResult = {
    type: getTiaoHouType(bazi),
    gods,
    elements: [...new Set(gods.map((g) => getStemElement(g)))],
  }

  // L6 流通
  const liuTong = analyzeWuXingLiuTong(bazi)

  // L7 喜忌(全软件唯一喜忌出口)
  const xiYong = computeXiYong({
    pattern,
    outcome,
    tiaoHouType: tiaoHou.type,
    tiaoHouGods: tiaoHou.gods,
    liuTongTongGuan: liuTong.tongGuan as ElementType | null,
    elementCount: bazi.elementCount,
    dayMasterElement: bazi.dayMasterElement,
  })

  // L1 五行统计
  const count = countWuXing(bazi)
  let dominant: ElementType | null = null
  let max = 0
  for (const el of ELEMENTS) {
    if (count[el] > max) {
      max = count[el]
      dominant = el
    }
  }
  const wuXing: WuXingResult = {
    count,
    dominant,
    deficient: ELEMENTS.filter((el) => count[el] === 0),
  }

  // L9 神煞(纯标注)
  const shenSha = getAllShenSha(bazi)

  const structured: Omit<FullAnalysis, 'texts'> = {
    bazi,
    pattern,
    outcome,
    strength,
    tiaoHou,
    liuTong,
    wuXing,
    xiYong,
    shenSha,
  }

  // L10 文案层(只翻译结构化结论)
  const analysisText: AnalysisResult = generateAnalysisFromFull(structured)
  const texts: FullTexts = {
    summary: analysisText.summary,
    analysis: analysisText.analysis,
    narrative: generateNarrative(structured),
    career: generateCareerGuidanceFromFull(structured),
    health: generateHealthGuidanceFromFull(structured),
  }

  return { ...structured, texts }
}
