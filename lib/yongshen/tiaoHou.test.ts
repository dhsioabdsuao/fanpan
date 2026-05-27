import { describe, it, expect } from 'vitest'
import { deriveTiaoHou } from './tiaoHou'
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
  totalScore = 30,
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

function mockFactPack(pattern: string): FlowFactPack {
  return {
    climaticBalance: {
      coldWarm: '平衡',
      dryWet: '平衡',
      pattern,
      needs: [],
      detail: '',
    },
  } as unknown as FlowFactPack
}

// ── 测试 ──

describe('deriveTiaoHou', () => {
  it('1. 火炎土燥 + 日主强戊土 → 同向，不 override', () => {
    // 戊土偏强，扶抑用金水克泄耗，调候也需金水 → 同向
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    const strength = makeStrength('偏强', 60)
    const factPack = mockFactPack('火炎土燥')

    const result = deriveTiaoHou(bazi, strength, factPack)

    expect(result.level).toBe(1)
    expect(result.overrideFuYi).toBe(false)
    expect(result.elementAdjust['金']).toBe(+2)
    expect(result.elementAdjust['水']).toBe(+2)
    expect(result.elementAdjust['火']).toBe(-2)
    expect(result.elementAdjust['土']).toBe(-2)
    expect(result.elementAdjust['木']).toBe(0)
    expect(result.weight).toBe(0.7)
  })

  it('2. 火炎土燥 + 日主弱戊土 → 冲突，override', () => {
    // 戊土偏弱，扶抑用火土生扶，调候需金水 → 冲突
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    const strength = makeStrength('偏弱', 15)
    const factPack = mockFactPack('火炎土燥')

    const result = deriveTiaoHou(bazi, strength, factPack)

    expect(result.level).toBe(1)
    expect(result.overrideFuYi).toBe(true)
    expect(result.needs).toContain('金')
    expect(result.needs).toContain('水')
  })

  it('3. 金水寒滞 + 日主强庚金 → 冲突，override', () => {
    // 庚金偏强，扶抑用水木火克泄耗，但调候忌水（增寒）→ 冲突
    const bazi = makeBazi('庚', '申', '壬', '子', '庚', '申', '丙', '子')
    const strength = makeStrength('偏强', 65)
    const factPack = mockFactPack('金水寒滞')

    const result = deriveTiaoHou(bazi, strength, factPack)

    expect(result.level).toBe(1)
    expect(result.overrideFuYi).toBe(true)
    expect(result.elementAdjust['木']).toBe(+2)
    expect(result.elementAdjust['火']).toBe(+2)
    expect(result.elementAdjust['金']).toBe(-2)
    expect(result.elementAdjust['水']).toBe(-2)
  })

  it('4. 金水寒滞 + 日主弱木 → 冲突，override', () => {
    // 弱木生扶用印比，调候需木火 → 火（调候喜）vs 火（食伤，fuYi忌）= 微观冲突
    // 水（调候忌）vs 水（印，fuYi喜）= 核心冲突 → override
    const bazi = makeBazi('乙', '亥', '乙', '酉', '乙', '卯', '乙', '酉')
    const strength = makeStrength('偏弱', 15)
    const factPack = mockFactPack('金水寒滞')

    const result = deriveTiaoHou(bazi, strength, factPack)

    expect(result.level).toBe(1)
    // 调候忌水(印)而扶抑喜水 → 方向性冲突
    expect(result.overrideFuYi).toBe(true)
  })

  it('5. 水冷土湿 → level=2，不 override', () => {
    const bazi = makeBazi('戊', '辰', '戊', '辰', '戊', '辰', '戊', '辰')
    const strength = makeStrength('偏强', 60)
    const factPack = mockFactPack('水冷土湿')

    const result = deriveTiaoHou(bazi, strength, factPack)

    expect(result.level).toBe(2)
    expect(result.weight).toBe(0.4)
    // level 2 永不 override
    expect(result.overrideFuYi).toBe(false)
    expect(result.elementAdjust['火']).toBe(+2)
    expect(result.elementAdjust['水']).toBe(-2)
  })

  it('6. 木火通明 → level=3，不调整', () => {
    const bazi = makeBazi('丙', '寅', '丙', '巳', '丙', '午', '丙', '戌')
    const strength = makeStrength('偏强', 55)
    const factPack = mockFactPack('木火通明')

    const result = deriveTiaoHou(bazi, strength, factPack)

    expect(result.level).toBe(3)
    expect(result.weight).toBe(0)
    expect(result.needs).toEqual([])
    for (const el of ['金', '木', '水', '火', '土'] as ElementType[]) {
      expect(result.elementAdjust[el]).toBe(0)
    }
  })

  it('7. 平衡 → level=3，weight=0', () => {
    const bazi = makeBazi('丁', '卯', '己', '酉', '丁', '亥', '辛', '亥')
    const strength = makeStrength('中和', 35)
    const factPack = mockFactPack('平衡')

    const result = deriveTiaoHou(bazi, strength, factPack)

    expect(result.level).toBe(3)
    expect(result.weight).toBe(0)
  })
})
