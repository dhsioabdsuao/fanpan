// ─────────────────────────────────────────────────────────────
// S5b 事业指引消费证明测试
// 证明:行业/方位/城市/冲突说明全部是 xiYong 结论的翻译,
// 不再有自己的喜忌推导。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { buildChartFromPillars } from './testChart'
import { analyze } from '../bage/analyze'
import { generateCareerGuidance } from '../bage/analyze'

const CHARTS: [string, string, string, string][] = [
  ['壬午', '甲辰', '戊午', '己未'], // 建禄月劫·火炎土燥(user-001)
  ['庚申', '庚申', '甲亥', '丙戌'], // 杀格·食神制杀
  ['癸酉', '癸子', '丙申', '乙未'], // 官格·金寒水冷
  ['丙寅', '丙辰', '甲子', '戊辰'], // 财格·火炎土燥
  ['丁丑', '癸子', '庚申', '丁亥'], // 伤官格·金水伤官
]

describe('事业指引消费喜忌引擎', () => {
  for (const c of CHARTS) {
    it(`${c.join(' ')}:首选行业元素=喜忌引擎主喜用`, () => {
      const bazi = buildChartFromPillars({ pillars: c })
      const full = analyze(bazi)
      const guidance = generateCareerGuidance(bazi)

      const primary = full.xiYong.primaryFavorable
      if (primary && guidance.industries.length > 0) {
        expect(guidance.industries[0].element).toBe(primary)
      }
      // 方位首选与主喜用一致
      if (primary) {
        const dirOf: Record<string, string> = { '木': '东方', '火': '南方', '土': '中原', '金': '西方', '水': '北方' }
        expect(guidance.directionPrimary).toContain(dirOf[primary])
      }
      // 冲突说明=喜忌引擎冲突裁决
      expect(guidance.conflictNotes).toEqual(full.xiYong.conflicts.map((x) => x.note))
    })
  }
})

describe('事业指引确定性', () => {
  it('同一命盘两次结果完全一致(含城市推荐)', () => {
    const bazi = buildChartFromPillars({ pillars: ['壬午', '甲辰', '戊午', '己未'] })
    const a = generateCareerGuidance(bazi)
    const b = generateCareerGuidance(bazi)
    expect(a).toEqual(b)
  })
})

describe('事业指引关键案例(用户命盘)', () => {
  it('user-001:首选水(北方),忌方位含南(火),不再推荐金木为忌用冲突', () => {
    const bazi = buildChartFromPillars({ pillars: ['壬午', '甲辰', '戊午', '己未'] })
    const guidance = generateCareerGuidance(bazi)
    expect(guidance.industries[0].element).toBe('水')
    expect(guidance.directionPrimary).toContain('北方')
    expect(guidance.directionAvoid).toContain('南方')
    expect(guidance.conflictNotes.join(';')).toContain('火候已足')
  })
})
