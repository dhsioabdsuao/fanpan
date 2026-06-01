import { describe, it, expect } from 'vitest'
import { deriveHuaGe } from './huaGe'
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

function makeStrength(level: '极强' | '偏强' | '中和' | '偏弱' | '极弱'): DayMasterStrength {
  return {
    totalScore: 30,
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

describe('deriveHuaGe', () => {
  it('1. 假化格：日主在地支有根气（寅甲本气+辰乙中气），合而不化', () => {
    // 甲日主，月干己土 → 甲己合土
    // 地支：寅藏甲(木本气)、辰藏乙(木中气) → 日主甲木有根 → 不合化
    const bazi = makeBazi('壬', '午', '己', '辰', '甲', '子', '丙', '寅')
    const strength = makeStrength('中和')
    const factPack = mockFactPack({ 金: 20, 木: 10, 水: 15, 火: 20, 土: 35 })

    const result = deriveHuaGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('有根气')
  })

  it('2. 假化格：日主在地支有根气（寅巳戊余气根），合而不化', () => {
    // 戊日主，时干癸水 → 戊癸合化火
    // 地支：寅藏戊(土余气)、巳藏戊(土余气) → 日主戊土有根 → 不合化
    const bazi = makeBazi('甲', '寅', '丙', '巳', '戊', '午', '癸', '亥')
    const strength = makeStrength('中和')
    const factPack = mockFactPack({ 金: 10, 木: 30, 水: 5, 火: 35, 土: 20 })

    const result = deriveHuaGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('有根气')
  })

  it('3. 假化格：月令不支持，合而不化', () => {
    // 甲日主，月干己土，月支寅（木月）
    // 寅不在土月令列表中 → 合而不化
    const bazi = makeBazi('壬', '午', '己', '寅', '甲', '子', '丙', '寅')
    const strength = makeStrength('中和')
    const factPack = mockFactPack({ 金: 20, 木: 30, 水: 15, 火: 20, 土: 15 })

    const result = deriveHuaGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('合而不化')
  })

  it('4. 假化格：日主与年干五合但不相邻，隔位不合', () => {
    // 年干己土，月干壬水，日主甲木
    // 甲己合，但己在年柱，壬在月柱相隔 → 不相邻
    const bazi = makeBazi('己', '巳', '壬', '辰', '甲', '子', '丙', '寅')
    const strength = makeStrength('中和')
    const factPack = mockFactPack({ 金: 20, 木: 15, 水: 30, 火: 15, 土: 20 })

    const result = deriveHuaGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('隔位不合')
  })

  it('5. 假化格：化神被克破（木克土，木力>25%）', () => {
    // 甲日主，月干己 → 甲己合化土，月支巳支持土
    // 地支子(癸)巳(丙庚戊)午(丁己)戌(戊辛丁) → 全无木藏干 → 无根 ✓
    // 天干丙(食伤)庚(官杀) → 无印比 ✓
    // 但木力40% > 25% → 克破化神
    const bazi = makeBazi('丙', '子', '己', '巳', '甲', '午', '庚', '戌')
    const strength = makeStrength('中和')
    const factPack = mockFactPack({ 金: 10, 木: 40, 水: 10, 火: 20, 土: 20 })

    const result = deriveHuaGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
    expect(result.detail).toContain('化神被克破')
  })

  it('6. 非化格：日主无合化对象', () => {
    // 戊日主，戊合癸，但月干甲、时干丙都不等于癸
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '丙', '辰')
    const strength = makeStrength('偏强')
    const factPack = mockFactPack({ 金: 10, 木: 25, 水: 15, 火: 25, 土: 25 })

    const result = deriveHuaGe(bazi, strength, factPack)

    expect(result.active).toBe(false)
  })
})
