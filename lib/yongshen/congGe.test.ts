import { describe, it, expect } from 'vitest'
import { deriveCongGe } from './congGe'
import type { BaziResult, Pillar, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { FlowFactPack } from '@/lib/flow'
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

function makeStrength(
  level: '极强' | '偏强' | '中和' | '偏弱' | '极弱',
  totalScore: number,
): DayMasterStrength {
  return {
    totalScore,
    level,
    breakdown: {
      monthlyOrderScore: 0, branchRootsScore: 0, stemSupportScore: 0,
      stemDrainScore: 0, hiddenStemsScore: 0,
    },
    details: [],
  }
}

function mockFactPack(forceMap: Record<ElementType, number>): FlowFactPack {
  const forces = {} as Record<ElementType, { element: ElementType; force: number; yangForce: number; yinForce: number }>
  for (const el of ['金', '木', '水', '火', '土'] as ElementType[]) {
    const f = forceMap[el] ?? 0
    forces[el] = { element: el, force: f, yangForce: f / 2, yinForce: f / 2 }
  }
  const total = Object.values(forceMap).reduce((s, v) => s + v, 0)
  return {
    elementForce: { forces, average: total / 5 },
  } as unknown as FlowFactPack
}

// ── 测试 ──

describe('deriveCongGe', () => {
  it('1. 真从杀：日主极弱，官杀独旺（丙火日主，全局水盛）', () => {
    // 壬子/壬子/丙子/壬辰
    // 丙火日主，水是官杀(克我者)，地支无巳午本气根
    const bazi = makeBazi('壬', '子', '壬', '子', '丙', '子', '壬', '辰')
    const strength = makeStrength('极弱', 5)
    // 水 > 50%
    const factPack = mockFactPack({ 金: 5, 木: 5, 水: 80, 火: 3, 土: 7 })

    const result = deriveCongGe(bazi, strength, factPack)

    expect(result.active).toBe(true)
    expect(result.type).toBe('从杀')
    expect(result.congShen).toEqual(['水'])
  })

  it('2. 真从财：日主极弱，财星独旺（庚金日主，全局木盛）', () => {
    // 甲寅/甲寅/庚子/甲寅
    // 庚金日主，木是财(我克者)，地支无申酉本气根
    const bazi = makeBazi('甲', '寅', '甲', '寅', '庚', '子', '甲', '寅')
    const strength = makeStrength('极弱', 5)
    const factPack = mockFactPack({ 金: 2, 木: 85, 水: 5, 火: 3, 土: 5 })

    const result = deriveCongGe(bazi, strength, factPack)

    expect(result.active).toBe(true)
    expect(result.type).toBe('从财')
    expect(result.congShen).toEqual(['木'])
  })

  it('3. 真从势：多行势均（甲木日主，金火土各行其势）', () => {
    // 庚戌/丙戌/甲子/戊申
    // 甲木日主，天干庚(金·官)/丙(火·食)/戊(土·财)，无印比
    const bazi = makeBazi('庚', '戌', '丙', '戌', '甲', '子', '戊', '申')
    const strength = makeStrength('极弱', 3)
    // 金 40%，土 35%，各 > 30% → 从势
    const factPack = mockFactPack({ 金: 40, 木: 3, 水: 10, 火: 12, 土: 35 })

    const result = deriveCongGe(bazi, strength, factPack)

    expect(result.active).toBe(true)
    expect(result.type).toBe('从势')
    expect(result.congShen).toContain('金')
    expect(result.congShen).toContain('土')
  })

  it('4. 假从格：条件1不满足（totalScore=15，不够极弱）', () => {
    // 同样壬子/壬子/丙子/壬辰，但 totalScore=15
    const bazi = makeBazi('壬', '子', '壬', '子', '丙', '子', '壬', '辰')
    const strength = makeStrength('偏弱', 15)
    const factPack = mockFactPack({ 金: 5, 木: 5, 水: 80, 火: 3, 土: 7 })

    const result = deriveCongGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('不满足从格条件')
  })

  it('5. 假从格：条件2不满足（天干有印星透出，破格）', () => {
    // 甲寅/戊寅/庚子/甲寅
    // 庚金日主，戊土是印(生我者)透在月干 → 破格
    const bazi = makeBazi('甲', '寅', '戊', '寅', '庚', '子', '甲', '寅')
    const strength = makeStrength('极弱', 5)
    const factPack = mockFactPack({ 金: 2, 木: 85, 水: 5, 火: 3, 土: 5 })

    const result = deriveCongGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('印星或比劫透出')
  })

  it('6. 假从格：条件3不满足（地支有日主本气根，为假从）', () => {
    // 甲寅/甲寅/庚申/甲寅
    // 庚金日主，申是金的本气根 → 假从格
    const bazi = makeBazi('甲', '寅', '甲', '寅', '庚', '申', '甲', '寅')
    const strength = makeStrength('极弱', 5)
    const factPack = mockFactPack({ 金: 5, 木: 80, 水: 5, 火: 5, 土: 5 })

    const result = deriveCongGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('本气根')
  })

  it('7. 非从格：日主中和，直接不进入从格逻辑', () => {
    const bazi = makeBazi('丁', '卯', '己', '酉', '丁', '亥', '辛', '亥')
    const strength = makeStrength('中和', 35)
    const factPack = mockFactPack({ 金: 30, 木: 20, 水: 20, 火: 15, 土: 15 })

    const result = deriveCongGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
  })
})
