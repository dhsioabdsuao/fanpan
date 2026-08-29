// ─────────────────────────────────────────────────────────────
// S5b 体质倾向测试(消费统一管线)
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { buildChartFromPillars } from './testChart'
import { analyze } from '../bage/analyze'
import { generateHealthGuidance } from '../bage/healthGuidance'

describe('体质倾向', () => {
  it('user-001(火炎土燥,土4金0):体质综述偏燥,脾胃偏旺,肺与大肠偏弱', () => {
    const bazi = buildChartFromPillars({ pillars: ['壬午', '甲辰', '戊午', '己未'] })
    const full = analyze(bazi)
    const h = generateHealthGuidance(bazi)

    // 消费证明:结论与统一管线一致
    expect(full.tiaoHou.type).toBe('火炎土燥')
    expect(h.summary).toContain('清热养阴')

    const tu = h.organs.find((o) => o.element === '土')!
    expect(tu.status).toBe('偏旺')
    const jin = h.organs.find((o) => o.element === '金')!
    expect(jin.status).toBe('偏弱') // 金=0
  })

  it('同一命盘两次结果一致(确定性)', () => {
    const bazi = buildChartFromPillars({ pillars: ['壬午', '甲辰', '戊午', '己未'] })
    expect(generateHealthGuidance(bazi)).toEqual(generateHealthGuidance(bazi))
  })

  it('金寒水冷命盘:综述偏寒凉,建议温补', () => {
    const bazi = buildChartFromPillars({ pillars: ['癸酉', '癸子', '丙申', '乙未'] })
    const full = analyze(bazi)
    const h = generateHealthGuidance(bazi)
    expect(full.tiaoHou.type).toBe('金寒水冷')
    expect(h.summary).toContain('温阳散寒')
    expect(h.wellness.diet).toContain('温补')
  })
})
