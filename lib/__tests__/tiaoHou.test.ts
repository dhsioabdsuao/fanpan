import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput, BaziResult } from '@/types/bazi'
import { countWuXing, getTiaoHouType, getTiaoHouYongShen } from '../bage/tiaoHou'

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return {
    year: 2000, month: 6, day: 15, hour: 10, minute: 0,
    gender: 'male', isLunar: false,
    ...overrides,
  }
}

// ── countWuXing ──

describe('countWuXing', () => {
  it('C0: 壬午 甲辰 戊午 己未 → 金0木1水1火2土4', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 4, day: 20, hour: 14, minute: 59 }))
    expect(bazi.pillars.month.branch).toBe('辰')
    const cnt = countWuXing(bazi)
    expect(cnt).toEqual({ 金: 0, 木: 1, 水: 1, 火: 2, 土: 4 })
  })

  it('C1: 壬午 丙午 甲戌 壬申 → 金1木1水2火3土1', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 7, day: 5, hour: 15, minute: 32 }))
    expect(bazi.pillars.month.branch).toBe('午')
    const cnt = countWuXing(bazi)
    expect(cnt).toEqual({ 金: 1, 木: 1, 水: 2, 火: 3, 土: 1 })
  })

  it('C2: 甲申 甲戌 乙酉 辛巳 → 金3木3水0火1土1', () => {
    const bazi = calculateBazi(makeInput({ year: 2004, month: 11, day: 2, hour: 9, minute: 26, gender: 'female' }))
    expect(bazi.pillars.month.branch).toBe('戌')
    const cnt = countWuXing(bazi)
    expect(cnt).toEqual({ 金: 3, 木: 3, 水: 0, 火: 1, 土: 1 })
  })

  it('C3: 庚辰 戊子 庚申 癸未 → 金3木0水2火0土3', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 12, day: 28, hour: 13, minute: 0, gender: 'female' }))
    expect(bazi.pillars.month.branch).toBe('子')
    const cnt = countWuXing(bazi)
    expect(cnt).toEqual({ 金: 3, 木: 0, 水: 2, 火: 0, 土: 3 })
  })

  it('C4: 庚辰 壬午 甲辰 己巳 → 金1木1水1火2土3', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 6, day: 15, hour: 10, minute: 0 }))
    expect(bazi.pillars.month.branch).toBe('午')
    const cnt = countWuXing(bazi)
    expect(cnt).toEqual({ 金: 1, 木: 1, 水: 1, 火: 2, 土: 3 })
  })
})

// ── getTiaoHouType ──

describe('getTiaoHouType', () => {
  it('C0: 火炎土燥 — 辰月，非冬月 + 火+土=6≥5 + 水=1≤1', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 4, day: 20, hour: 14, minute: 59 }))
    expect(getTiaoHouType(bazi)).toBe('火炎土燥')
  })

  it('C1: 寒暖适中 — 午月（夏月）但水=2>1，不触发', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 7, day: 5, hour: 15, minute: 32 }))
    expect(getTiaoHouType(bazi)).toBe('寒暖适中')
  })

  it('C2: 寒暖适中 — 戌月，火+土=2<5，金+水=3<5，均不触发', () => {
    const bazi = calculateBazi(makeInput({ year: 2004, month: 11, day: 2, hour: 9, minute: 26, gender: 'female' }))
    expect(getTiaoHouType(bazi)).toBe('寒暖适中')
  })

  it('C3: 金寒水冷 — 子月（冬月）+ 火=0≤1', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 12, day: 28, hour: 13, minute: 0, gender: 'female' }))
    expect(getTiaoHouType(bazi)).toBe('金寒水冷')
  })

  it('C4: 火炎土燥 — 午月（夏月）+ 水=1≤1', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 6, day: 15, hour: 10, minute: 0 }))
    expect(getTiaoHouType(bazi)).toBe('火炎土燥')
  })

  it('冬月安全闸：子月 + 火+土≥5 + 水≤1，因冬月阻止 → 寒暖适中', () => {
    // 构造一个"冬月但火土旺"的命局来测试安全闸
    // 手工指定 wuXingCount 绕过 calculateBazi 找真实日期的困难
    const bazi = calculateBazi(makeInput({ year: 2000, month: 12, day: 28, hour: 13, minute: 0, gender: 'female' }))
    // 用假的五行计数模拟火炎土燥条件：火+土=6≥5，水=1≤1
    const fakeCount = { 金: 0, 木: 1, 水: 1, 火: 3, 土: 3 }
    // 但月支是子（冬月），安全闸应阻止火炎土燥
    expect(bazi.pillars.month.branch).toBe('子')
    expect(getTiaoHouType(bazi, fakeCount)).toBe('寒暖适中')
  })

  it('夏月安全闸：午月 + 金+水≥5 + 火≤1，因夏月阻止 → 寒暖适中', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 7, day: 5, hour: 15, minute: 32 }))
    // 午月（夏月）用假计数模拟金寒水冷条件
    const fakeCount = { 金: 3, 木: 0, 水: 2, 火: 1, 土: 2 }
    expect(bazi.pillars.month.branch).toBe('午')
    expect(getTiaoHouType(bazi, fakeCount)).toBe('寒暖适中')
  })
})

// ── getTiaoHouYongShen 双轨集成 ──

describe('getTiaoHouYongShen — 穷通宝鉴查表', () => {
  it('C0: 戊 in 辰月 → 甲丙癸', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 4, day: 20, hour: 14, minute: 59 }))
    expect(bazi.dayMaster).toBe('戊')
    expect(bazi.pillars.month.branch).toBe('辰')
    expect(getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch)).toEqual(['甲', '丙', '癸'])
  })

  it('C1: 甲 in 午月 → 壬庚丁（表有数据，但寒暖适中不触发建议）', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 7, day: 5, hour: 15, minute: 32 }))
    expect(bazi.dayMaster).toBe('甲')
    expect(bazi.pillars.month.branch).toBe('午')
    const gods = getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch)
    expect(gods).toEqual(['壬', '庚', '丁'])
    // 双轨：寒暖适中 → generateAnalysis 跳过调候建议
    expect(getTiaoHouType(bazi)).toBe('寒暖适中')
  })

  it('C3: 庚 in 子月 → 丙甲', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 12, day: 28, hour: 13, minute: 0, gender: 'female' }))
    expect(bazi.dayMaster).toBe('庚')
    expect(bazi.pillars.month.branch).toBe('子')
    expect(getTiaoHouType(bazi)).toBe('金寒水冷')
    expect(getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch)).toEqual(['丙', '甲'])
  })

  it('C4: 甲 in 午月 → 壬庚丁，火炎土燥触发调候建议', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 6, day: 15, hour: 10, minute: 0 }))
    expect(bazi.dayMaster).toBe('甲')
    expect(bazi.pillars.month.branch).toBe('午')
    expect(getTiaoHouType(bazi)).toBe('火炎土燥')
    expect(getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch)).toEqual(['壬', '庚', '丁'])
  })
})
