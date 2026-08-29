// 金标准命例测试:断言"最终应当判定的结果"。
// draft 命例自动跳过;source 为 user-confirmed 的命例是全流程验收线。

import { describe, it, expect } from 'vitest'
import { GOLDEN_CASES } from './goldens'
import { buildChartFromPillars } from './testChart'
import { extractPattern } from '../bage/extractPattern'
import { assessOutcome } from '../bage/assessOutcome'
import { determineStrength } from '../strength/determineStrength'
import { countWuXing, getTiaoHouType, getTiaoHouYongShen } from '../bage/tiaoHou'
import { analyzeWuXingLiuTong } from '../bage/liuTong'
import { analyze } from '../bage/analyze'

describe('金标准命例', () => {
  for (const c of GOLDEN_CASES) {
    const confirmed = c.source !== 'draft'
    const run = confirmed ? it : it.skip

    run(`${c.id} ${c.label}`, () => {
      const bazi = buildChartFromPillars({ pillars: c.pillars, gender: c.gender })

      // L1 五行计数
      expect(countWuXing(bazi)).toEqual(c.expected.elementCount)

      // L2 取格
      const pat = extractPattern(bazi)
      expect(pat.category).toBe(c.expected.patternCategory)

      // L4 成败
      const ao = assessOutcome(bazi, pat)
      expect(ao.outcome).toBe(c.expected.outcome)

      // L3 强弱
      expect(determineStrength(bazi).level).toBe(c.expected.strengthLevel)

      // L5 调候
      expect(getTiaoHouType(bazi)).toBe(c.expected.tiaoHouType)
      expect(getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch))
        .toEqual(c.expected.tiaoHouGods)

      // L6 流通
      const lt = analyzeWuXingLiuTong(bazi)
      if (c.expected.liuTongBlockage) expect(lt.blockage).toBe(c.expected.liuTongBlockage)
      if (c.expected.liuTongTongGuan) expect(lt.tongGuan).toBe(c.expected.liuTongTongGuan)
    })
  }
})

// L7 喜忌总览:S4 已实现 computeXiYong,金标准激活。
// 期望值经用户确认(2026-08-29),修完后必须全绿。
describe('金标准命例:L7 喜忌总览(已激活)', () => {
  for (const c of GOLDEN_CASES) {
    const run = c.source !== 'draft' ? it : it.skip
    run(`${c.id} ${c.label}`, () => {
      const xi = c.expected.xiYong
      if (!xi) return
      const full = analyze(buildChartFromPillars({ pillars: c.pillars, gender: c.gender }))
      expect(full.xiYong.favorable).toEqual(xi.favorable)
      expect(full.xiYong.avoid).toEqual(xi.avoid)
      if (xi.conflictNoteContains) {
        const notes = full.xiYong.conflicts.map((x) => x.note).join(';')
        expect(notes).toContain(xi.conflictNoteContains)
      }
    })
  }
})
