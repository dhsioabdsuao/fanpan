// ── 体质倾向（基于五行平衡与调候分析）──
// CONSUMES-FULL-ANALYSIS-ONLY:本模块只消费 analyze() 的统一结果,
// 不重复计算五行计数/调候类型/强弱(诊断流程 L10)。
// 五行→脏腑映射依据《黄帝内经》基础理论。
// 养生建议为传统体质养生的现代演绎。

import type { BaziResult, ElementType } from '@/types/bazi'
import type { FullAnalysis } from './analyze'
import { analyze } from './analyze'

// ═══════════════════════════════════════════
// 类型
// ═══════════════════════════════════════════

export interface OrganFocus {
  organ: string
  element: ElementType
  status: '偏旺' | '偏弱' | '适中'
  advice: string
}

export interface WellnessAdvice {
  exercise: string
  rest: string
  diet: string
  seasonal: string
}

export interface HealthGuidance {
  summary: string
  organs: OrganFocus[]
  wellness: WellnessAdvice
}

// ═══════════════════════════════════════════
// 五行 → 脏腑
// ═══════════════════════════════════════════

const ELEMENT_ORGAN: Record<ElementType, { organ: string; detail: string }> = {
  '木': { organ: '肝胆', detail: '肝主疏泄，开窍于目，与情绪和解毒功能相关' },
  '火': { organ: '心与小肠', detail: '心主血脉与神志，与循环和情绪调节相关' },
  '土': { organ: '脾胃', detail: '脾主运化，为后天之本，与消化吸收相关' },
  '金': { organ: '肺与大肠', detail: '肺主气，开窍于鼻，与呼吸和免疫力相关' },
  '水': { organ: '肾与膀胱', detail: '肾藏精，主骨生髓，与内分泌和生殖相关' },
}

// ═══════════════════════════════════════════
// 强弱 → 养生建议
// ═══════════════════════════════════════════

interface OrganAdvice {
  excess: string
  deficient: string
}

const ORGAN_ADVICE: Record<ElementType, OrganAdvice> = {
  '木': {
    excess: '木气过旺，注意肝胆养护。避免过度劳累和情绪压抑，少饮酒，可常饮菊花枸杞茶疏肝明目',
    deficient: '木气偏弱，肝胆功能需关注。注意用眼休息、避免熬夜伤肝，多食绿叶蔬菜，适当散步舒展筋骨',
  },
  '火': {
    excess: '火气偏旺，注意心火调节。少吃辛辣刺激食物，避免情绪大起大落，绿豆汤、莲子心茶可清心降火',
    deficient: '火气不足，心血需补养。可适当食用红枣、桂圆等温补食材，适度有氧运动增强心肺功能',
  },
  '土': {
    excess: '土气过旺，脾胃负担偏重。注意饮食清淡、少食多餐，避免生冷油腻，适当运动助消化',
    deficient: '土气偏弱，脾胃运化功能需加强。规律饮食、细嚼慢咽，山药、小米粥等健脾养胃的食物可常吃',
  },
  '金': {
    excess: '金气偏旺，肺气易燥。注意呼吸道保湿，避免烟尘环境，多吃梨、银耳等润肺食物',
    deficient: '金气不足，肺卫功能偏弱。注意保暖防感冒，可练习深呼吸增强肺活量，白色食物（百合、白萝卜）有益',
  },
  '水': {
    excess: '水气过旺，肾脏负担需关注。注意保暖尤其是腰膝，避免过度劳累和熬夜伤精，适度节制',
    deficient: '水气不足，肾精需补养。建议早睡早起、节制房事，黑色食物（黑豆、黑芝麻、桑葚）可补肾益精',
  },
}

// ═══════════════════════════════════════════
// 调候类型 → 体质综述
// ═══════════════════════════════════════════

const CLIMATE_SUMMARY: Record<string, string> = {
  '火炎土燥': '体质偏燥热，火土之气偏盛，水气不足。整体需以清热养阴、补水润燥为主，注意心火和脾胃的平衡。',
  '金寒水冷': '体质偏寒凉，金水之气偏盛，火气不足。整体需以温阳散寒、补火暖身为主，注意肾阳和心肺的温养。',
  '寒暖适中': '体质寒暖适中，五行相对平衡。保持现有的生活节奏和饮食习惯，适度运动、规律作息即可维持良好状态。',
}

// ═══════════════════════════════════════════
// 强弱 → 体质补充
// ═══════════════════════════════════════════

const STRENGTH_NOTE: Record<string, string> = {
  '身强': '日主强旺，整体体质底子不错，但需注意过犹不及——精力充沛时容易透支，注意劳逸结合。',
  '中和': '日主中和，体质平稳，日常保养得当即可。',
  '身弱': '日主偏弱，整体精力储备偏少，需注重调养和储能，避免长期高强度消耗。',
}

// ═══════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════

export function generateHealthGuidanceFromFull(full: Omit<FullAnalysis, 'texts'>): HealthGuidance {
  const wuXingCount = full.wuXing.count
  const tiaoHouType = full.tiaoHou.type
  const strength = full.strength

  // ── 体质综述 ──
  const climateSummary = CLIMATE_SUMMARY[tiaoHouType] ?? CLIMATE_SUMMARY['寒暖适中']
  const strengthNote = STRENGTH_NOTE[strength.level] ?? ''
  const summary = `${climateSummary}${strengthNote}`

  // ── 各脏腑分析 ──
  const ALL: ElementType[] = ['木', '火', '土', '金', '水']
  const organs: OrganFocus[] = []

  for (const el of ALL) {
    const count = wuXingCount[el] ?? 0
    const info = ELEMENT_ORGAN[el]
    const adviceMap = ORGAN_ADVICE[el]

    let status: '偏旺' | '偏弱' | '适中'
    let advice: string

    if (count >= 3) {
      status = '偏旺'
      advice = adviceMap.excess
    } else if (count === 0) {
      status = '偏弱'
      advice = adviceMap.deficient
    } else {
      status = '适中'
      advice = `${info.organ}功能尚可，保持现有养护习惯即可`
    }

    organs.push({
      organ: info.organ,
      element: el,
      status,
      advice,
    })
  }

  // ── 养生建议 ──
  // 从调候类型和强弱推导
  const isDry = tiaoHouType === '火炎土燥'
  const isCold = tiaoHouType === '金寒水冷'
  const isWeak = strength.level === '身弱'
  const isStrong = strength.level === '身强'

  // 运动
  let exercise: string
  if (isWeak) {
    exercise = '温和有氧运动为主（太极、散步、瑜伽），避免高强度消耗型运动。每次运动至微微出汗即可，不必追求大汗淋漓'
  } else if (isStrong) {
    exercise = '适合规律性较强的运动（跑步、游泳、球类），通过运动释放过剩精力，保持身心平衡。每周3-5次为宜'
  } else {
    exercise = '温和与有氧交替进行，保持每周2-3次规律运动即可，以身体感觉舒适为度'
  }

  // 作息
  let rest: string
  if (isDry) {
    rest = '早睡早起，避免熬夜加重阴虚火旺。中午可小憩15-30分钟养心，晚上11点前入睡最佳'
  } else if (isCold) {
    rest = '宜早睡晚起，保证充足睡眠以养阳气。睡前可用温水泡脚，促进血液循环，改善寒凉体质'
  } else if (isWeak) {
    rest = '保证每天7-8小时睡眠，不熬夜是最重要的保养方式。精力不足时及时休息，不要硬撑'
  } else {
    rest = '保持规律作息，避免长期熬夜。睡眠质量比时长更重要，睡前减少屏幕时间'
  }

  // 饮食
  let diet: string
  if (isDry) {
    diet = '清淡为主，多食绿叶蔬菜和水分充足的食物（黄瓜、冬瓜、梨）。少吃辛辣油炸，适量饮用绿茶、菊花茶清热降火'
  } else if (isCold) {
    diet = '温补为主，多食温热性食物（姜、羊肉、红枣、桂圆）。少食生冷瓜果和冰镇饮品，饭前喝碗热汤暖胃'
  } else {
    diet = '均衡饮食，五色入五脏。不偏食、不过量，时令食材最养人'
  }

  // 季节
  let seasonal: string
  if (isDry) {
    seasonal = '夏季注意防暑降火，多补水；秋冬季节干燥时注意润肺，可食银耳、百合。春季阳气生发，适合户外活动'
  } else if (isCold) {
    seasonal = '秋冬季节重点保暖，尤其腰腹和下肢；夏季虽热也不宜贪凉饮冷。春夏季多晒太阳，借自然阳气温养身体'
  } else {
    seasonal = '四季交替时注意及时增减衣物，换季时节饮食适当调整适应气候变化'
  }

  return {
    summary,
    organs,
    wellness: { exercise, rest, diet, seasonal },
  }
}

/** 兼容旧签名:内部走统一管线(analyze 一次) */
export function generateHealthGuidance(bazi: BaziResult): HealthGuidance {
  return generateHealthGuidanceFromFull(analyze(bazi))
}
