// ─────────────────────────────────────────────────────────────
// S4a 喜忌综合层测试(喜忌规格书 v1.0)
// 期望值经探测验证后固化;铁律断言:喜用 ∩ 忌神 = ∅、杀格格神不入喜用。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'
import { buildChartFromPillars } from './testChart'
import { analyze } from '../bage/analyze'

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return { year: 2000, month: 6, day: 15, hour: 10, minute: 0, gender: 'male', isLunar: false, ...overrides }
}

function xi(pillars: [string, string, string, string]) {
  return analyze(buildChartFromPillars({ pillars }))
}

describe('喜忌:铁律(全案例适用)', () => {
  const charts: [string, string, string, string][] = [
    ['庚申', '庚申', '甲亥', '丙戌'], // 杀格
    ['壬午', '甲辰', '戊午', '己未'], // 建禄月劫(user-001)
    ['癸酉', '癸子', '丙申', '乙未'], // 官格
    ['丙寅', '丙辰', '甲子', '戊辰'], // 财格
    ['丁丑', '癸子', '庚申', '丁亥'], // 伤官格金水
    ['戊辰', '戊寅', '甲子', '丙寅'], // 建禄月劫财
    ['癸丑', '癸子', '丙子', '癸巳'], // 官格不成
  ]
  for (const c of charts) {
    it(`${c.join(' ')}:喜用∩忌神=∅,轨迹非空,主喜∈喜用`, () => {
      const full = xi(c)
      const inter = full.xiYong.favorable.filter((el) => full.xiYong.avoid.includes(el))
      expect(inter, `喜用[${full.xiYong.favorable}]与忌神[${full.xiYong.avoid}]相交`).toEqual([])
      expect(full.xiYong.ruleTrace.length).toBeGreaterThan(0)
      if (full.xiYong.primaryFavorable) {
        expect(full.xiYong.favorable[0]).toBe(full.xiYong.primaryFavorable)
      }
    })
  }
})

describe('喜忌:金标准 user-001(壬午 甲辰 戊午 己未)', () => {
  it('喜用=水>木>金,忌=土火,冲突火候已足', () => {
    const full = xi(['壬午', '甲辰', '戊午', '己未'])
    expect(full.pattern.category).toBe('建禄月劫格')
    expect(full.tiaoHou.type).toBe('火炎土燥')
    expect(full.xiYong.favorable).toEqual(['水', '木', '金'])
    expect(full.xiYong.avoid).toEqual(['土', '火'])
    expect(full.xiYong.primaryFavorable).toBe('水')
    expect(full.xiYong.yongShenTenGod).toBe('七杀') // 建禄月劫另取用神,机制用神
    const fire = full.xiYong.conflicts.find((c) => c.element === '火')
    expect(fire).toBeDefined()
    expect(fire!.resolution).toBe('气候已足不需补')
    expect(fire!.note).toContain('火候已足')
  })
})

describe('喜忌:杀格反回归(格神七杀永不在喜用)', () => {
  it('甲日主申月食制成格:喜食伤(火),格神金在忌神中', () => {
    const full = xi(['庚申', '庚申', '甲亥', '丙戌'])
    expect(full.pattern.category).toBe('杀格')
    expect(full.xiYong.yongShenTenGod).toBe('食神')
    expect(full.xiYong.favorable).not.toContain('金') // 格神元素绝不在喜用
    expect(full.xiYong.favorable).toContain('火') // 食伤制杀
    expect(full.xiYong.avoid).toContain('金')
    // 调候表庚金与格局忌神冲突 → 格局优先剔除
    const jin = full.xiYong.conflicts.find((c) => c.element === '金')
    expect(jin).toBeDefined()
    expect(jin!.resolution).toBe('格局优先剔除')
  })
})

describe('喜忌:从格/化格(只论化/从)', () => {
  it('从杀格 2002-01-17:喜从神金+生从神土,忌印水食伤火', () => {
    const full = analyze(calculateBazi(makeInput({ year: 2002, month: 1, day: 17, hour: 10 })))
    expect(full.pattern.category).toBe('从杀格')
    expect(full.xiYong.favorable).toEqual(['金', '土'])
    expect(full.xiYong.avoid).toEqual(['水', '火'])
  })

  it('化土格 2000-01-17:喜化神土+泄秀金,忌克化神木', () => {
    const full = analyze(calculateBazi(makeInput({ year: 2000, month: 1, day: 17 })))
    expect(full.pattern.category).toBe('化土格')
    expect(full.xiYong.favorable).toEqual(['土', '金'])
    expect(full.xiYong.avoid).toEqual(['木'])
  })
})

describe('喜忌:气候极端调候列第一', () => {
  it('金寒水冷官格:救治火列第一,印木第二', () => {
    const full = xi(['癸酉', '癸子', '丙申', '乙未'])
    expect(full.tiaoHou.type).toBe('金寒水冷')
    expect(full.xiYong.primaryFavorable).toBe('火')
    expect(full.xiYong.favorable).toEqual(['火', '木', '金'])
    expect(full.xiYong.avoid).toEqual(['土', '水'])
  })

  it('火炎土燥财格:救治水列第一', () => {
    const full = xi(['丙寅', '丙辰', '甲子', '戊辰'])
    expect(full.tiaoHou.type).toBe('火炎土燥')
    expect(full.xiYong.primaryFavorable).toBe('水')
    expect(full.xiYong.favorable).toEqual(['水', '火', '金'])
  })
})

describe('喜忌:寒暖适中格局用神列第一', () => {
  it('金水伤官喜见官(寒暖适中):官火列第一', () => {
    const full = xi(['丁丑', '癸子', '庚申', '丁亥'])
    expect(full.tiaoHou.type).toBe('寒暖适中')
    expect(full.xiYong.yongShenTenGod).toBe('官星')
    expect(full.xiYong.primaryFavorable).toBe('火')
  })

  it('官格不成格(寒暖适中):补救财金列第一', () => {
    const full = xi(['癸丑', '癸子', '丙子', '癸巳'])
    expect(full.tiaoHou.type).toBe('寒暖适中')
    expect(full.xiYong.yongShenTenGod).toBeNull()
    expect(full.xiYong.favorable).toEqual(['金', '木'])
  })
})
