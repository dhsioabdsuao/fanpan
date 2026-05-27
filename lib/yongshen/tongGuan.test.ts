import { describe, it, expect } from 'vitest'
import { deriveTongGuan } from './tongGuan'
import type { BaziResult, Pillar, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
import type { FlowTypeEntry } from '@/lib/flow/types'
import { getStemElement, getBranchElement, getHiddenStems, getTenGod } from '@/lib/bazi-utils'

// ── Mock 工厂 ──

function makePillar(stem: string, branch: string): Pillar {
  return {
    stem,
    branch,
    stemElement: getStemElement(stem),
    branchElement: getBranchElement(branch),
    hiddenStems: getHiddenStems(branch),
  }
}

function makeBazi(
  yearStem: string, yearBranch: string,
  monthStem: string, monthBranch: string,
  dayStem: string, dayBranch: string,
  hourStem: string, hourBranch: string,
): BaziResult {
  const dayMaster = dayStem
  const yearPillar = makePillar(yearStem, yearBranch)
  const monthPillar = makePillar(monthStem, monthBranch)
  const dayPillar = makePillar(dayStem, dayBranch)
  const hourPillar = makePillar(hourStem, hourBranch)

  return {
    pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
    dayMaster,
    dayMasterElement: getStemElement(dayMaster),
    zodiac: '',
    naYin: { year: '', month: '', day: '', hour: '' },
    elementCount: { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 },
    tenGods: {
      yearStem: getTenGod(dayMaster, yearStem),
      monthStem: getTenGod(dayMaster, monthStem),
      hourStem: getTenGod(dayMaster, hourStem),
      yearBranch: yearPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
      monthBranch: monthPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
      dayBranch: dayPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
      hourBranch: hourPillar.hiddenStems.map((s) => getTenGod(dayMaster, s)),
    },
    solarDate: '',
    lunarDate: '',
    inputInfo: { year: 2000, month: 1, day: 1, hour: 0, minute: 0, gender: 'male', isLunar: false },
    solarTimeAdjustment: null,
  }
}

function makeStrength(): DayMasterStrength {
  return {
    totalScore: 35,
    level: '中和',
    breakdown: {
      monthlyOrderScore: 0, branchRootsScore: 0, stemSupportScore: 0,
      stemDrainScore: 0, hiddenStemsScore: 0,
    },
    details: [],
  }
}

function mockFactPack(
  forceMap: Record<ElementType, number>,
  structureTypes: FlowTypeEntry[] = [],
): FlowFactPack {
  const forces = {} as Record<ElementType, { element: ElementType; force: number; yangForce: number; yinForce: number }>
  for (const el of ['金', '木', '水', '火', '土'] as ElementType[]) {
    const f = forceMap[el] ?? 0
    forces[el] = { element: el, force: f, yangForce: f / 2, yinForce: f / 2 }
  }
  const total = Object.values(forceMap).reduce((s, v) => s + v, 0)
  return {
    elementForce: { forces, average: total / 5 },
    structureSummary: {
      primaryTypes: structureTypes,
      mainAxis: null,
      overallTone: '',
      yinYangLayer: '阴阳均衡',
    },
  } as unknown as FlowFactPack
}

function entry(type: string, priority = 1): FlowTypeEntry {
  return { type, priority, trigger: 'test' } as FlowTypeEntry
}

// ── 测试 ──

describe('deriveTongGuan', () => {
  it('1. 金木交战真通关（structureSummary 标记）', () => {
    // 日主水，金30% vs 木28%，差2% < 15%
    const bazi = makeBazi('壬', '子', '壬', '子', '壬', '子', '壬', '辰')
    const strength = makeStrength()
    const factPack = mockFactPack(
      { 金: 30, 木: 28, 水: 17, 火: 13, 土: 12 },
      [entry('4a_双行交战')],
    )

    const result = deriveTongGuan(bazi, strength, factPack)

    expect(result.active).toBe(true)
    expect(result.mediator).toBe('水')
    expect(result.clashingPair).toEqual(['金', '木'])
    expect(result.detail).toContain('通关')
  })

  it('2. 木土交战真通关（自行检测）', () => {
    // 日主火，木32% vs 土30%，差2% < 15%
    const bazi = makeBazi('丙', '寅', '丙', '巳', '丙', '午', '丙', '戌')
    const strength = makeStrength()
    const factPack = mockFactPack(
      { 金: 13, 木: 32, 水: 13, 火: 12, 土: 30 },
    )

    const result = deriveTongGuan(bazi, strength, factPack)

    expect(result.active).toBe(true)
    expect(result.mediator).toBe('火')
    expect(result.clashingPair).toEqual(['木', '土'])
    expect(result.detail).toContain('通关')
  })

  it('3. 假通关：两强力量差 ≥15%，一边倒不须通关', () => {
    // 金40% vs 木25%，差15%
    const bazi = makeBazi('壬', '子', '壬', '子', '壬', '子', '壬', '辰')
    const strength = makeStrength()
    const factPack = mockFactPack(
      { 金: 40, 木: 25, 水: 15, 火: 10, 土: 10 },
    )

    const result = deriveTongGuan(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('力量差')
  })

  it('4. 假通关：日主在交战方中，属扶抑范畴', () => {
    // 庚金日主，金30% vs 木28%
    const bazi = makeBazi('庚', '申', '庚', '申', '庚', '申', '庚', '辰')
    const strength = makeStrength()
    const factPack = mockFactPack(
      { 金: 30, 木: 28, 水: 17, 火: 13, 土: 12 },
      [entry('4a_双行交战')],
    )

    const result = deriveTongGuan(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('扶抑')
  })

  it('5. 假通关：五行均衡，无两行 >25% 交战', () => {
    const bazi = makeBazi('丁', '卯', '己', '酉', '丁', '亥', '辛', '亥')
    const strength = makeStrength()
    const factPack = mockFactPack(
      { 金: 22, 木: 20, 水: 20, 火: 20, 土: 18 },
    )

    const result = deriveTongGuan(bazi, strength, factPack)

    expect(result.active).toBe(false)
  })

  it('6. 假通关：偏枯严重，疑似从格，不走通关', () => {
    const bazi = makeBazi('壬', '子', '壬', '子', '壬', '子', '壬', '辰')
    const strength = makeStrength()
    const factPack = mockFactPack(
      { 金: 5, 木: 5, 水: 80, 火: 5, 土: 5 },
      [entry('4a_双行交战'), entry('2e_全偏枯')],
    )

    const result = deriveTongGuan(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('偏枯')
  })
})
