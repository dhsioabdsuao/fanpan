// ─────────────────────────────────────────────────────────────
// S5a 叙事层测试:声明→标志对照表
// 原则(AGENTS.md):文案里的每个机制/气候论断必须对应一个结构化真值;
// 文案中出现某论断 ⇒ 对应条件为真(无虚假论断)。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'
import { buildChartFromPillars } from './testChart'
import { analyze } from '../bage/analyze'
import { generateNarrative } from '../bage/narrative'

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return { year: 2000, month: 6, day: 15, hour: 10, minute: 0, gender: 'male', isLunar: false, ...overrides }
}

function narrate(pillars: [string, string, string, string]) {
  const full = analyze(buildChartFromPillars({ pillars }))
  return { full, text: generateNarrative(full) }
}

// 论断 → 结构化真值 对照表
const CLAIM_FLAGS: { claim: string; kind: 'condition' | 'climate'; flag: string }[] = [
  { claim: '伤官佩印', kind: 'condition', flag: '伤官佩印' },
  { claim: '伤官生财', kind: 'condition', flag: '伤官生财' },
  { claim: '食神生财', kind: 'condition', flag: '食神生财' },
  { claim: '食神制杀', kind: 'condition', flag: '食神制杀' },
  { claim: '印绶化杀', kind: 'condition', flag: '印星化杀' },
  { claim: '官杀生印', kind: 'condition', flag: '官杀生印' },
  { claim: '火炎土燥', kind: 'climate', flag: '火炎土燥' },
  { claim: '金寒水冷', kind: 'climate', flag: '金寒水冷' },
]

const TEST_CHARTS: [string, string, string, string][] = [
  ['壬午', '甲辰', '戊午', '己未'], // 建禄月劫·合绊制杀
  ['庚申', '庚申', '甲亥', '丙戌'], // 杀格·食神制杀
  ['戊寅', '戊午', '甲子', '丙申'], // 伤官格·伤官生财
  ['庚辰', '癸子', '甲亥', '丙戌'], // 印格·官杀生印
  ['丁丑', '癸子', '庚申', '丁亥'], // 伤官格·金水伤官喜见官
  ['癸丑', '癸子', '丙子', '癸巳'], // 官格不成格
]

describe('叙事声明→标志对照表(无虚假论断)', () => {
  for (const c of TEST_CHARTS) {
    it(`${c.join(' ')}:文案中的每个机制/气候论断都有结构化真值支撑`, () => {
      const { full, text } = narrate(c)
      for (const { claim, kind, flag } of CLAIM_FLAGS) {
        if (!text.includes(claim)) continue
        if (kind === 'climate') {
          expect(full.tiaoHou.type, `文案声称「${claim}」但调候层判定为 ${full.tiaoHou.type}`).toBe(flag)
        } else {
          const met = full.outcome.conditions.some((cc) => cc.label === flag && cc.met)
          expect(met, `文案声称「${claim}」但成败层条件「${flag}」未满足`).toBe(true)
        }
      }
    })
  }
})

describe('叙事正向断言(机制成立时必有对应叙事)', () => {
  it('杀格食神制杀:文案含「食神制杀」', () => {
    const { text } = narrate(['庚申', '庚申', '甲亥', '丙戌'])
    expect(text).toContain('食神制杀')
  })
  it('伤官格伤官生财:文案含「伤官生财」', () => {
    const { text } = narrate(['戊寅', '戊午', '甲子', '丙申'])
    expect(text).toContain('伤官生财')
  })
  it('印格官杀生印:文案含「官杀生印」', () => {
    const { text } = narrate(['庚辰', '癸子', '甲亥', '丙戌'])
    expect(text).toContain('官杀生印')
  })
})

describe('叙事不再自判(旧代码的虚假论断已消除)', () => {
  it('不成格·伤官佩印乏力(1991-04-12):文案不含「伤官佩印」', () => {
    const bazi = calculateBazi(makeInput({ year: 1991, month: 4, day: 12, hour: 9 }))
    const full = analyze(bazi)
    const text = generateNarrative(full)
    // 结构化:佩印条件确实未满足
    expect(full.outcome.conditions.some((c) => c.label === '伤官佩印' && c.met)).toBe(false)
    // 旧代码会因"伤官格+印透"硬写佩印叙事,新代码必须没有
    expect(text).not.toContain('伤官佩印')
  })

  it('同一命盘两次叙事结果一致(确定性)', () => {
    const a = narrate(['壬午', '甲辰', '戊午', '己未'])
    const b = narrate(['壬午', '甲辰', '戊午', '己未'])
    expect(a.text).toBe(b.text)
  })
})
