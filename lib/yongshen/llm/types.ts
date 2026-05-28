import type { ElementType } from '@/types/bazi'
import type { YongShenResult } from '../types'

export interface YongShenFactPack {
  primaryMethod: '扶抑' | '从格' | '化格' | '通关'
  dayMaster: string
  dayMasterElement: ElementType
  yongShen: Array<{
    gan: string
    element: ElementType
    tenGod: string
    score: number
    reason: string
  }>
  jiShen: Array<{
    gan: string
    element: ElementType
    tenGod: string
    score: number
    reason: string
  }>
  tiaoHou: {
    active: boolean
    pattern?: string
    needs?: string[]
    detail: string
  }
  tongGuan: {
    active: boolean
    mediator?: ElementType
    clashingPair?: [ElementType, ElementType]
    detail: string
  }
  isSpecialGe: boolean
  summary: string
}

export function buildYongShenFactPack(result: YongShenResult): YongShenFactPack {
  // 日主 = tenGod 为「比肩」的那个天干
  const allRatings = [...result.yongShen, ...result.jiShen, ...result.xianShen]
  const dm = allRatings.find((r) => r.tenGod === '比肩')
  const dayMaster = dm?.gan ?? '?'
  const dayMasterElement = dm?.element ?? '土'

  return {
    primaryMethod: result.primaryMethod,
    dayMaster,
    dayMasterElement,
    yongShen: result.yongShen.map((r) => ({
      gan: r.gan,
      element: r.element,
      tenGod: r.tenGod,
      score: r.score,
      reason: r.reason,
    })),
    jiShen: result.jiShen.map((r) => ({
      gan: r.gan,
      element: r.element,
      tenGod: r.tenGod,
      score: r.score,
      reason: r.reason,
    })),
    tiaoHou: result.tiaoHou
      ? {
          active: result.tiaoHou.active,
          pattern: result.tiaoHou.pattern,
          needs: result.tiaoHou.needs,
          detail: result.tiaoHou.detail,
        }
      : { active: false, detail: '' },
    tongGuan: result.tongGuan
      ? {
          active: result.tongGuan.active,
          mediator: result.tongGuan.mediator,
          clashingPair: result.tongGuan.clashingPair,
          detail: result.tongGuan.detail,
        }
      : { active: false, detail: '' },
    isSpecialGe: result.primaryMethod === '从格' || result.primaryMethod === '化格',
    summary: result.summary,
  }
}
