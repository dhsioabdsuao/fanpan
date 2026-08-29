// ─────────────────────────────────────────────────────────────
// 测试共用:四柱级命盘构造器
//
// 判断层(取格/成败/强弱/调候/流通/喜忌/神煞)只依赖 pillars、
// dayMaster、elementCount、inputInfo 等字段,不依赖历法(daYun 等)。
// 金标准命例直接给四柱构造,与历法层解耦——历法层的正确性由
// S1 的 calculateBazi 金标准测试单独保证。
// ─────────────────────────────────────────────────────────────

import type { BaziResult, ElementType, Pillar, BaziInput } from '@/types/bazi'
import { countElements } from '@/lib/bazi-utils'

const STEM_ELEMENT: Record<string, ElementType> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

const BRANCH_ELEMENT: Record<string, ElementType> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
}

const HIDDEN_STEMS: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

function makePillar(ganZhi: string): Pillar {
  const stem = ganZhi[0]
  const branch = ganZhi[1]
  return {
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    hiddenStems: HIDDEN_STEMS[branch],
  }
}

export interface PillarChartOptions {
  pillars: [string, string, string, string] // 年 月 日 时,如 ['壬午','甲辰','戊午','己未']
  gender?: 'male' | 'female'
}

/**
 * 由四柱构造判断层可用的 BaziResult。
 * 历法相关字段(zodiac/naYin/daYun 等)留空,不得用于历法断言。
 */
export function buildChartFromPillars(opts: PillarChartOptions): BaziResult {
  const [year, month, day, hour] = opts.pillars
  const pillars = {
    year: makePillar(year),
    month: makePillar(month),
    day: makePillar(day),
    hour: makePillar(hour),
  }
  const dayMaster = pillars.day.stem
  const dayMasterElement = pillars.day.stemElement
  const gender = opts.gender ?? 'male'

  const inputInfo: BaziInput = {
    year: 0, month: 0, day: 0, hour: 0, minute: 0, gender, isLunar: false,
  }

  const bazi: BaziResult = {
    pillars,
    dayMaster,
    dayMasterElement,
    zodiac: '',
    naYin: { year: '', month: '', day: '', hour: '' },
    elementCount: countElements(
      pillars.year.stem, pillars.year.branch,
      pillars.month.stem, pillars.month.branch,
      pillars.day.stem, pillars.day.branch,
      pillars.hour.stem, pillars.hour.branch,
    ),
    tenGods: {
      yearStem: '', monthStem: '', hourStem: '',
      yearBranch: [], monthBranch: [], dayBranch: [], hourBranch: [],
    },
    solarDate: '',
    lunarDate: '',
    inputInfo,
    solarTimeAdjustment: null,
  }
  return bazi
}
