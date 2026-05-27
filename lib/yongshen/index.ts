import type { BaziResult, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
import type {
  YongShenResult,
  GanRating,
  PrimaryMethod,
  ReasoningStep,
  TiaoHouAdjustment,
  TongGuanResult,
} from './types'
import {
  FIVE_ELEMENTS,
  ALL_GAN,
  GENERATES,
  CONTROLS,
  CONTROLLED_BY,
  createBaseRating,
  getWeightConfig,
} from './helpers'
import { deriveFuYi } from './fuYi'
import { deriveCongGe } from './congGe'
import { deriveHuaGe } from './huaGe'
import { deriveTiaoHou } from './tiaoHou'
import { deriveTongGuan } from './tongGuan'
import { refineYinYang } from './yinYangRefine'
import { rankGanRatings } from './ranker'

export function deriveYongShen(
  bazi: BaziResult,
  strength: DayMasterStrength,
  factPack: FlowFactPack,
): YongShenResult {
  // ── 优先：化格 ──
  const huaGe = deriveHuaGe(bazi, strength, factPack)
  if (huaGe.active && huaGe.huaShen) {
    return buildHuaGeResult(bazi, huaGe)
  }

  // ── 其次：从格 ──
  const congGe = deriveCongGe(bazi, strength, factPack)
  if (congGe.active && congGe.congShen) {
    return buildCongGeResult(bazi, strength, congGe)
  }

  // ── 主线：扶抑 + 调候 + 通关 ──
  const fuYi = deriveFuYi(bazi, strength, factPack)
  const tiaoHou = deriveTiaoHou(bazi, strength, factPack)
  const tongGuan = deriveTongGuan(bazi, strength, factPack)

  const weights = getWeightConfig(strength.level, tiaoHou.level)
  fuYi.weight = weights.fuYi

  const ratings = refineYinYang(bazi, factPack, fuYi.elementScores)
  const { yongShen, jiShen, xianShen, reasoning } = rankGanRatings(
    ratings,
    tiaoHou,
    tongGuan,
    fuYi,
    factPack,
  )

  const summary = buildSummary({
    primaryMethod: '扶抑',
    yongShen,
    jiShen,
    tiaoHou,
    tongGuan,
  })

  return {
    yongShen,
    jiShen,
    xianShen,
    primaryMethod: '扶抑',
    reasoning,
    summary,
    fuYi,
    congGe: congGe.active ? congGe : null,
    huaGe: null,
    tongGuan: tongGuan.active ? tongGuan : null,
    tiaoHou: tiaoHou.active ? tiaoHou : null,
  }
}

// ── 化格结果构建 ──

function buildHuaGeResult(
  bazi: BaziResult,
  huaGe: NonNullable<YongShenResult['huaGe']>,
): YongShenResult {
  const huaShen = huaGe.huaShen!
  const dayMaster = bazi.dayMaster

  const ratings: GanRating[] = ALL_GAN.map((gan) => {
    const base = createBaseRating(gan, dayMaster)
    let score = 0
    let reason = ''

    if (base.element === huaShen) {
      score = +3
      reason = `化神${huaShen}+3`
    } else if (base.element === GENERATES[huaShen]) {
      score = +2
      reason = `化神所生+2`
    } else if (base.element === CONTROLS[huaShen]) {
      score = -3
      reason = `克破化神-3`
    } else if (base.element === CONTROLLED_BY[huaShen]) {
      score = -2
      reason = `化神所克-2`
    } else {
      reason = '闲'
    }

    return {
      gan,
      element: base.element,
      yinYang: base.yinYang,
      tenGod: base.tenGod as GanRating['tenGod'],
      category: score > 0.5 ? '喜用' : score < -0.5 ? '忌' : '闲',
      priority: 0,
      score,
      reason,
    }
  })

  const yongShen = ratings
    .filter((r) => r.category === '喜用')
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
  yongShen.forEach((r, i) => { r.priority = i + 1 })

  const jiShen = ratings
    .filter((r) => r.category === '忌' || r.category === '仇')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  const xianShen = ratings.filter(
    (r) => !yongShen.includes(r) && !jiShen.includes(r),
  )

  const reasoning: ReasoningStep[] = [
    { step: '化格判定', detail: huaGe.detail },
    { step: '喜忌推导', detail: `化神${huaShen}为第一用神，生${GENERATES[huaShen]}为次用，忌${CONTROLLED_BY[huaShen]}克破` },
    {
      step: '最终排序',
      detail: `喜用神:${yongShen.map((g) => g.gan).join('、') || '无'}；忌神:${jiShen.map((g) => g.gan).join('、') || '无'}`,
    },
  ]

  return {
    yongShen,
    jiShen,
    xianShen,
    primaryMethod: '化格',
    reasoning,
    summary: `化格成立：${huaGe.detail}。喜${huaShen}及${GENERATES[huaShen]}，忌${CONTROLLED_BY[huaShen]}。`,
    fuYi: null,
    congGe: null,
    huaGe,
    tongGuan: null,
    tiaoHou: null,
  }
}

// ── 从格结果构建 ──

function buildCongGeResult(
  bazi: BaziResult,
  strength: DayMasterStrength,
  congGe: NonNullable<YongShenResult['congGe']>,
): YongShenResult {
  const congShen = congGe.congShen!
  const dayMaster = bazi.dayMaster
  const dayElement = bazi.dayMasterElement

  const ratings: GanRating[] = ALL_GAN.map((gan) => {
    const base = createBaseRating(gan, dayMaster)
    let score = 0
    let reason = ''

    if (congShen.includes(base.element)) {
      score = +3
      reason = `从神${base.element}+3`
    } else if (base.element === dayElement) {
      score = -3
      reason = `日主${dayElement}-3`
    } else if (congShen.some((cs) => CONTROLS[cs] === base.element)) {
      score = -2
      reason = '克从神-2'
    } else if (congShen.some((cs) => GENERATES[cs] === base.element)) {
      score = +2
      reason = '从神所生+2'
    } else {
      reason = '闲'
    }

    return {
      gan,
      element: base.element,
      yinYang: base.yinYang,
      tenGod: base.tenGod as GanRating['tenGod'],
      category: score > 0.5 ? '喜用' : score < -0.5 ? '忌' : '闲',
      priority: 0,
      score,
      reason,
    }
  })

  const yongShen = ratings
    .filter((r) => r.category === '喜用')
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
  yongShen.forEach((r, i) => { r.priority = i + 1 })

  const jiShen = ratings
    .filter((r) => r.category === '忌' || r.category === '仇')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  const xianShen = ratings.filter(
    (r) => !yongShen.includes(r) && !jiShen.includes(r),
  )

  const reasoning: ReasoningStep[] = [
    { step: '从格判定', detail: congGe.detail },
    { step: '喜忌推导', detail: `从神${congShen.join('、')}为用，生从神者为次用，日主${dayElement}及克从神者为忌` },
    {
      step: '最终排序',
      detail: `喜用神:${yongShen.map((g) => g.gan).join('、') || '无'}；忌神:${jiShen.map((g) => g.gan).join('、') || '无'}`,
    },
  ]

  return {
    yongShen,
    jiShen,
    xianShen,
    primaryMethod: '从格',
    reasoning,
    summary: `从格成立：${congGe.detail}。从${congShen.join('、')}而去。`,
    fuYi: null,
    congGe,
    huaGe: null,
    tongGuan: null,
    tiaoHou: null,
  }
}

// ── 摘要 ──

function buildSummary(params: {
  primaryMethod: PrimaryMethod
  yongShen: GanRating[]
  jiShen: GanRating[]
  tiaoHou: TiaoHouAdjustment | null
  tongGuan: TongGuanResult | null
}): string {
  const { yongShen, jiShen, tiaoHou, tongGuan } = params

  const yongStr = yongShen.map((g) => `${g.gan}(${g.element}${g.tenGod})`).join('、') || '无'
  const jiStr = jiShen.map((g) => `${g.gan}(${g.element}${g.tenGod})`).join('、') || '无'

  let extra = ''
  if (tiaoHou?.active && tiaoHou.overrideFuYi) {
    extra = '，调候优先于扶抑'
  }
  if (tongGuan?.active) {
    extra += `，${tongGuan.detail}`
  }

  return `喜用神：${yongStr}；忌神：${jiStr}${extra}`
}
