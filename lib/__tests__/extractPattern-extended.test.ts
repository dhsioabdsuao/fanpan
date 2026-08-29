// ─────────────────────────────────────────────────────────────
// S3a 取格层扩展测试:覆盖全部分支 + 判定轨迹(judgementTrace)断言
// 【格局规格书 §0.4】每个命盘必须记录判定轨迹。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'
import { extractPattern } from '../bage/extractPattern'
import { buildChartFromPillars } from './testChart'

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return { year: 2000, month: 6, day: 15, hour: 10, minute: 0, gender: 'male', isLunar: false, ...overrides }
}

describe('extractPattern 化格分支', () => {
  it('2000-01-17 → 化土格,轨迹含化格检查明细', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const r = extractPattern(bazi)
    expect(r.category).toBe('化土格')
    expect(r.patternGodTenGod).toBeNull() // 化格无传统格神十神
    expect(r.judgementTrace[0]).toContain('【化格】')
    expect(r.judgementTrace[0]).toContain('取化土格')
    expect(r.judgementTrace[0]).toContain('✓') // 各步均命中
  })

  it('普通正格命盘:化格未成,轨迹记录未成原因', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 6, day: 15, hour: 14, minute: 30 }))
    const r = extractPattern(bazi)
    expect(r.judgementTrace[0]).toContain('【化格】未成化')
    expect(r.judgementTrace[0]).toContain('✗')
  })
})

describe('extractPattern 从格分支', () => {
  it('2002-01-17 → 从杀格,轨迹记录化格未成→从杀各步', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 1, day: 17, hour: 10 }))
    const r = extractPattern(bazi)
    expect(r.category).toBe('从杀格')
    expect(r.patternGodTenGod).toBeNull()
    expect(r.judgementTrace[0]).toContain('【化格】未成化')
    expect(r.judgementTrace[1]).toContain('【从杀】')
    expect(r.judgementTrace[1]).toContain('取从杀格')
  })

  it('1992-08-08 06:00 → 从财格', () => {
    const bazi = calculateBazi(makeInput({ year: 1992, month: 8, day: 8, hour: 6 }))
    const r = extractPattern(bazi)
    expect(r.category).toBe('从财格')
    expect(r.judgementTrace[2]).toContain('【从财】')
    expect(r.judgementTrace[2]).toContain('取从财格')
  })

  it('从杀未成:轨迹记录具体失败步骤(月令不支持)', () => {
    // 壬水日主(官杀=土),无根(四支藏干无壬癸),透戊己官杀,
    // 但月支寅不在土之旺相月[辰戌丑未巳午] → 月令扶从神✗
    const bazi = buildChartFromPillars({ pillars: ['戊午', '己寅', '壬戌', '丁巳'] })
    const r = extractPattern(bazi)
    const congShaLine = r.judgementTrace.find((t) => t.startsWith('【从杀】'))
    expect(congShaLine).toBeDefined()
    expect(congShaLine!).toContain('日主无根✓')
    expect(congShaLine!).toContain('月令扶从神✗')
  })
})

describe('extractPattern 化刃为印特例', () => {
  it('戊土+午月+透丙丁+寅午戌火局 → 印格', () => {
    const bazi = buildChartFromPillars({ pillars: ['丙寅', '庚午', '戊戌', '丁巳'] })
    const r = extractPattern(bazi)
    expect(r.category).toBe('印格')
    expect(r.patternGodTenGod).toBe('偏印') // 丙透为偏印
    expect(r.judgementTrace.some((t) => t.includes('【化刃为印】'))).toBe(true)
  })
})

describe('extractPattern 比劫分支(阳刃/建禄月劫)', () => {
  it('甲日主卯月(刃位)→ 阳刃格,用官杀庚', () => {
    const bazi = buildChartFromPillars({ pillars: ['庚申', '辛卯', '甲子', '壬寅'] })
    const r = extractPattern(bazi)
    expect(r.category).toBe('阳刃格')
    expect(r.yongShen).toBe('庚')
    expect(r.patternGodTenGod).toBe('劫财') // 卯本气乙对甲为劫财
    expect(r.judgementTrace.some((t) => t.includes('【阳刃】'))).toBe(true)
  })

  it('壬午 甲辰 戊午 己未 → 建禄月劫格,另取用神甲(七杀)', () => {
    const bazi = buildChartFromPillars({ pillars: ['壬午', '甲辰', '戊午', '己未'] })
    const r = extractPattern(bazi)
    expect(r.category).toBe('建禄月劫格')
    expect(r.luJieYongShenTenGod).toBe('七杀')
    expect(r.patternGodTenGod).toBe('比肩') // 辰本气戊对戊为比肩
    const jianLuLine = r.judgementTrace.find((t) => t.includes('【建禄月劫】'))
    expect(jianLuLine).toContain('取甲(七杀)')
  })

  it('建禄月劫无财官杀食可取', () => {
    // 戊日主午月? 午本气丁=正印 → 分支B。改用:己日主午月(午本气丁=偏印)→ 分支B。
    // 构造真比劫当令且透干无财官杀食:戊日主辰月,天干全比劫/印
    const bazi = buildChartFromPillars({ pillars: ['戊辰', '戊辰', '戊子', '戊午'] })
    const r = extractPattern(bazi)
    expect(r.category).toBe('建禄月劫格')
    expect(r.luJieYongShenTenGod).toBeNull()
    expect(r.judgementTrace.some((t) => t.includes('无财官杀食可取'))).toBe(true)
  })
})

describe('extractPattern 八格分支', () => {
  it('透干取格:甲日主辰月,本气戊(偏财)透干 → 偏财格', () => {
    const bazi = buildChartFromPillars({ pillars: ['戊子', '戊辰', '甲子', '壬申'] })
    const r = extractPattern(bazi)
    expect(r.category).toBe('财格')
    expect(r.displayName).toBe('偏财格')
    expect(r.origin).toBe('透干')
    expect(r.patternGodTenGod).toBe('偏财')
    expect(r.judgementTrace.some((t) => t.includes('【透干取格】') && t.includes('取偏财格'))).toBe(true)
  })

  it('会支取格:甲日主戌月,寅午戌火局 → 食神格', () => {
    const bazi = buildChartFromPillars({ pillars: ['甲寅', '丙戌', '甲午', '甲辰'] })
    const r = extractPattern(bazi)
    expect(r.category).toBe('食神格')
    expect(r.origin).toBe('会支')
    expect(r.patternElement).toBe('火')
    expect(r.patternGodTenGod).toBe('食神')
    expect(r.judgementTrace.some((t) => t.includes('【会支取格】') && t.includes('取食神格'))).toBe(true)
  })

  it('本气取格:甲日主辰月,不透不会 → 偏财格', () => {
    const bazi = buildChartFromPillars({ pillars: ['庚子', '庚辰', '甲子', '辛未'] })
    const r = extractPattern(bazi)
    expect(r.category).toBe('财格')
    expect(r.displayName).toBe('偏财格')
    expect(r.origin).toBe('不透不会')
    expect(r.patternGodTenGod).toBe('偏财')
    expect(r.judgementTrace.some((t) => t.includes('【本气取格】'))).toBe(true)
  })
})

describe('extractPattern 轨迹结构断言(级联命中即停)', () => {
  it('化格命中:轨迹仅一条,直接取化格', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const r = extractPattern(bazi)
    expect(r.judgementTrace).toHaveLength(1)
    expect(r.judgementTrace[0]).toContain('取化土格')
  })

  it('从杀命中:化格未成 → 从杀取格,无从财条目', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 1, day: 17, hour: 10 }))
    const r = extractPattern(bazi)
    expect(r.judgementTrace).toHaveLength(2)
    expect(r.judgementTrace[0]).toContain('【化格】未成化')
    expect(r.judgementTrace[1]).toContain('取从杀格')
  })

  it('从财命中:化格未成 → 从杀未成 → 从财取格', () => {
    const bazi = calculateBazi(makeInput({ year: 1992, month: 8, day: 8, hour: 6 }))
    const r = extractPattern(bazi)
    expect(r.judgementTrace).toHaveLength(3)
    expect(r.judgementTrace[0]).toContain('【化格】未成化')
    expect(r.judgementTrace[1]).toContain('【从杀】未成从')
    expect(r.judgementTrace[2]).toContain('取从财格')
  })

  it('正格:化格/从杀/从财均未成,再走分流与八格分支,末条含取格结论', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 6, day: 15, hour: 14, minute: 30 }))
    const r = extractPattern(bazi)
    expect(r.judgementTrace[0]).toContain('【化格】未成化')
    expect(r.judgementTrace[1]).toContain('【从杀】未成从')
    expect(r.judgementTrace[2]).toContain('【从财】未成从')
    expect(r.judgementTrace[3]).toContain('【分流】')
    expect(r.judgementTrace[r.judgementTrace.length - 1]).toContain('取')
  })
})
