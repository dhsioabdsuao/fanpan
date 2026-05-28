import { describe, it, expect } from 'vitest'
import { deriveFuYi } from './fuYi'
import type { BaziResult, Pillar } from '@/types/bazi'
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
  yearStem: string,
  yearBranch: string,
  monthStem: string,
  monthBranch: string,
  dayStem: string,
  dayBranch: string,
  hourStem: string,
  hourBranch: string,
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
      monthlyOrderScore: 0,
      branchRootsScore: 0,
      stemSupportScore: 0,
      stemDrainScore: 0,
      hiddenStemsScore: 0,
    },
    details: [],
  }
}

const factPackMock = {} as FlowFactPack

// ── 测试 ──

describe('deriveFuYi', () => {
  it('1. 日主偏强 → 方向=克泄耗，财官食伤为正分', () => {
    // 壬午 甲辰 戊午 己未 → 戊土偏强
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    const strength = makeStrength('偏强', 60)
    const result = deriveFuYi(bazi, strength, factPackMock)

    expect(result.direction).toBe('克泄耗')
    // 克泄耗方向：财(+3)=水, 官杀(+2)=木, 食伤(+2)=金, 印(-3)=火, 比劫(-3)=土
    expect(result.elementScores['土']).toBe(-3) // 比劫忌
    expect(result.elementScores['火']).toBe(-3) // 印星忌
    expect(result.elementScores['金']).toBe(+2) // 食伤用
    expect(result.elementScores['水']).toBe(+3) // 财用
    expect(result.elementScores['木']).toBe(+2) // 官杀用
    expect(result.active).toBe(true)
  })

  it('2. 日主偏弱 → 方向=生扶，印比为正分', () => {
    // 乙亥 乙酉 乙卯 乙酉 → 乙木偏弱
    const bazi = makeBazi('乙', '亥', '乙', '酉', '乙', '卯', '乙', '酉')
    const strength = makeStrength('偏弱', 15)
    const result = deriveFuYi(bazi, strength, factPackMock)

    expect(result.direction).toBe('生扶')
    // 生扶方向：印(+3)=水, 比劫(+2)=木, 官杀(-3)=金, 财(-2)=土, 食伤(-2)=火
    expect(result.elementScores['水']).toBe(+3) // 印星用
    expect(result.elementScores['木']).toBe(+2) // 比劫用
    expect(result.elementScores['金']).toBe(-3) // 官杀忌
    expect(result.elementScores['土']).toBe(-2) // 财忌
    expect(result.elementScores['火']).toBe(-2) // 食伤忌
  })

  it('3. 日主中和偏弱（score=28）→ 方向=中和，生扶方向微弱正分', () => {
    // 丁火日主，中和偏弱半区 → 印(+1.5)=木, 比劫(+1)=火, 官杀(-1.5)=水, 食伤(-1)=土, 财(-1)=金
    const bazi = makeBazi('丁', '卯', '己', '酉', '丁', '亥', '辛', '亥')
    const strength = makeStrength('中和', 28)
    const result = deriveFuYi(bazi, strength, factPackMock)

    expect(result.direction).toBe('中和')
    // 生扶方向减半：印木 +1.5, 比劫火 +1
    expect(result.elementScores['木']).toBe(1.5)  // 印星用
    expect(result.elementScores['火']).toBe(1)    // 比劫用
    // 克泄耗减半：官杀水 -1.5, 食伤土 -1, 财金 -1
    expect(result.elementScores['水']).toBe(-1.5) // 官杀忌
    expect(result.elementScores['土']).toBe(-1)   // 食伤忌
    expect(result.elementScores['金']).toBe(-1)   // 财忌
  })

  it('3b. 日主中和偏强（score=48）→ 方向=中和，克泄耗方向微弱正分', () => {
    // 丁火日主，中和偏强半区 → 财(+1.5)=金, 官杀(+1)=水, 食伤(+1)=土, 印(-1.5)=木, 比劫(-1.5)=火
    const bazi = makeBazi('丁', '卯', '己', '酉', '丁', '亥', '辛', '亥')
    const strength = makeStrength('中和', 48)
    const result = deriveFuYi(bazi, strength, factPackMock)

    expect(result.direction).toBe('中和')
    // 克泄耗减半：财金 +1.5, 官杀水 +1, 食伤土 +1
    expect(result.elementScores['金']).toBe(1.5)  // 财用
    expect(result.elementScores['水']).toBe(1)    // 官杀用
    expect(result.elementScores['土']).toBe(1)    // 食伤用
    // 生扶减半：印木 -1.5, 比劫火 -1.5
    expect(result.elementScores['木']).toBe(-1.5) // 印星忌
    expect(result.elementScores['火']).toBe(-1.5) // 比劫忌
  })

  it('4. 日主极强 → 方向=克泄耗（同偏强）', () => {
    // 戊辰 己未 戊戌 己未 → 戊土极强
    const bazi = makeBazi('戊', '辰', '己', '未', '戊', '戌', '己', '未')
    const strength = makeStrength('极强', 85)
    const result = deriveFuYi(bazi, strength, factPackMock)

    expect(result.direction).toBe('克泄耗')
    expect(result.elementScores['土']).toBe(-3) // 比劫忌
    expect(result.elementScores['火']).toBe(-3) // 印星忌
    expect(result.elementScores['金']).toBe(+2) // 食伤用
    expect(result.elementScores['水']).toBe(+3) // 财用
    expect(result.elementScores['木']).toBe(+2) // 官杀用
  })

  it('5. 日主极弱 → 方向=生扶（同偏弱）', () => {
    // 壬子 壬子 丙子 壬辰 → 丙火极弱
    const bazi = makeBazi('壬', '子', '壬', '子', '丙', '子', '壬', '辰')
    const strength = makeStrength('极弱', 5)
    const result = deriveFuYi(bazi, strength, factPackMock)

    expect(result.direction).toBe('生扶')
    // 生扶方向：印(+3)=木, 比劫(+2)=火, 官杀(-3)=水, 食伤(-2)=土, 财(-2)=金
    expect(result.elementScores['木']).toBe(+3) // 印星用
    expect(result.elementScores['火']).toBe(+2) // 比劫用
    expect(result.elementScores['水']).toBe(-3) // 官杀忌
    expect(result.elementScores['土']).toBe(-2) // 食伤忌
    expect(result.elementScores['金']).toBe(-2) // 财忌
  })
})
