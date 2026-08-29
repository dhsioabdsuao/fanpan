// ─────────────────────────────────────────────────────────────
// S3b 成败层扩展测试:八格×三态矩阵 + 结构化 conditions 断言
// 期望值按《格局规格书》第四章逐条手工推导。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'
import { extractPattern } from '../bage/extractPattern'
import { assessOutcome } from '../bage/assessOutcome'
import { buildChartFromPillars } from './testChart'

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return { year: 2000, month: 6, day: 15, hour: 10, minute: 0, gender: 'male', isLunar: false, ...overrides }
}

function assess(pillars: [string, string, string, string]) {
  const bazi = buildChartFromPillars({ pillars })
  const pat = extractPattern(bazi)
  return { bazi, pat, ao: assessOutcome(bazi, pat) }
}

function cond(ao: ReturnType<typeof assessOutcome>, label: string) {
  return ao.conditions.find((c) => c.label === label)
}

describe('官格', () => {
  it('成格:印护官(丙日主子月,癸官乙印并透)', () => {
    const { pat, ao } = assess(['癸酉', '癸子', '丙申', '乙未'])
    expect(pat.category).toBe('官格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '印护官')!.met).toBe(true)
    expect(cond(ao, '财生官')!.met).toBe(false) // 申藏庚不成局,财不活跃
    expect(cond(ao, '无伤官见官')!.met).toBe(true)
  })

  it('不成格:孤官无辅(丙日主子月,无财无印)', () => {
    const { pat, ao } = assess(['癸丑', '癸子', '丙子', '癸巳'])
    expect(pat.category).toBe('官格')
    expect(ao.outcome).toBe('不成格')
    expect(cond(ao, '财生官')!.met).toBe(false)
    expect(cond(ao, '印护官')!.met).toBe(false)
  })

  it('破格:伤官见官无救(丁日主亥月,壬官戊伤并透无财印救)', () => {
    const { pat, ao } = assess(['壬午', '壬亥', '丁巳', '戊申'])
    expect(pat.category).toBe('官格')
    expect(ao.outcome).toBe('破格')
    expect(cond(ao, '无伤官见官')!.met).toBe(false)
  })
})

describe('杀格', () => {
  it('成格:食神制杀+身强担杀条件(甲日主申月透丙食)', () => {
    const { pat, ao } = assess(['庚申', '庚申', '甲亥', '丙戌'])
    expect(pat.category).toBe('杀格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '食神制杀')!.met).toBe(true)
    const layerCond = cond(ao, '身强担杀')
    expect(layerCond).toBeDefined() // 食制成格必有层次参考条件
  })

  it('破格:财党杀无制化(甲日主申月,庚杀戊财并透)', () => {
    const { pat, ao } = assess(['庚申', '庚申', '甲午', '戊辰'])
    expect(pat.category).toBe('杀格')
    expect(ao.outcome).toBe('破格')
    expect(cond(ao, '无财党杀')!.met).toBe(false)
    expect(cond(ao, '食神制杀')!.met).toBe(false)
    expect(cond(ao, '印星化杀')!.met).toBe(false)
  })
})

describe('财格', () => {
  it('成格:食伤生财(甲日主辰月,丙戊并透)', () => {
    const { pat, ao } = assess(['丙寅', '丙辰', '甲子', '戊辰'])
    expect(pat.category).toBe('财格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '食伤生财')!.met).toBe(true)
  })

  it('破格:比劫夺财(甲日主辰月,比肩并透无通关)', () => {
    const { pat, ao } = assess(['甲寅', '戊辰', '甲子', '甲午'])
    expect(pat.category).toBe('财格')
    expect(ao.outcome).toBe('破格')
    expect(cond(ao, '无比劫夺财')!.met).toBe(false)
  })
})

describe('印格', () => {
  it('成格:官杀生印+泄秀(甲日主子月,庚癸丙并透)', () => {
    const { pat, ao } = assess(['庚辰', '癸子', '甲亥', '丙戌'])
    expect(pat.category).toBe('印格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '官杀生印')!.met).toBe(true)
    expect(cond(ao, '食伤泄秀')!.met).toBe(true)
  })
})

describe('食神格', () => {
  it('成格:食神生财(甲日主巳月,丙食戊财并透)', () => {
    const { pat, ao } = assess(['丙寅', '丙巳', '甲子', '戊辰'])
    expect(pat.category).toBe('食神格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '食神生财')!.met).toBe(true)
  })

  it('破格:枭神夺食无财制(甲日主巳月,丙食壬枭并透)', () => {
    const { pat, ao } = assess(['丙寅', '壬巳', '甲子', '壬申'])
    expect(pat.category).toBe('食神格')
    expect(ao.outcome).toBe('破格')
    expect(cond(ao, '无枭神夺食')!.met).toBe(false)
  })
})

describe('伤官格', () => {
  it('成格:金水伤官喜见官+tiaoHouSpecial 标记(庚日主子月,癸伤丁官并透,无巳午)', () => {
    const { pat, ao } = assess(['丁丑', '癸子', '庚申', '丁亥'])
    expect(pat.category).toBe('伤官格')
    expect(ao.tiaoHouSpecial).toBe('金水伤官喜见官')
    expect(ao.outcome).toBe('成格')
  })

  it('破格:伤官见官无救(丙日主未月,己伤癸官并透)', () => {
    const { pat, ao } = assess(['壬辰', '己未', '丙申', '癸巳'])
    expect(pat.category).toBe('伤官格')
    expect(ao.outcome).toBe('破格')
    expect(cond(ao, '无伤官见官')!.met).toBe(false)
  })
})

describe('建禄月劫格', () => {
  it('成格·层次受损:透杀被合绊制约(用户命盘 壬午 甲辰 戊午 己未)', () => {
    const { pat, ao } = assess(['壬午', '甲辰', '戊午', '己未'])
    expect(pat.category).toBe('建禄月劫格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '杀有制约')!.met).toBe(true) // 甲己合绊
    expect(ao.reason).toContain('层次受损')
  })

  it('不成格:无财官杀食可取(戊日主辰月,天干纯比劫)', () => {
    const { pat, ao } = assess(['戊辰', '戊辰', '戊子', '戊午'])
    expect(pat.category).toBe('建禄月劫格')
    expect(ao.outcome).toBe('不成格')
    expect(cond(ao, '有另取用神')!.met).toBe(false)
  })

  it('破格:透杀无制(甲日主寅月,庚杀透无食无印无合绊)', () => {
    const { pat, ao } = assess(['庚申', '庚寅', '甲子', '戊辰'])
    expect(pat.category).toBe('建禄月劫格')
    expect(ao.outcome).toBe('破格')
    expect(cond(ao, '杀有制约')!.met).toBe(false)
  })
})

describe('阳刃格', () => {
  it('成格:官煞制刃(甲日主卯月,庚辛并透)', () => {
    const { pat, ao } = assess(['庚申', '辛卯', '甲子', '壬寅'])
    expect(pat.category).toBe('阳刃格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '官煞制刃')!.met).toBe(true)
    expect(cond(ao, '无伤官破制')!.met).toBe(true)
  })

  it('破格:阳刃无官煞制(甲日主卯月,无官杀)', () => {
    const { pat, ao } = assess(['甲寅', '甲卯', '甲子', '丙寅'])
    expect(pat.category).toBe('阳刃格')
    expect(ao.outcome).toBe('破格')
    expect(cond(ao, '官煞制刃')!.met).toBe(false)
  })
})

describe('从格/化格 conditions', () => {
  it('从杀格:真从杀格条件+财生杀相神', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 1, day: 17, hour: 10 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    expect(pat.category).toBe('从杀格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '真从杀格')!.met).toBe(true)
  })

  it('化土格:化气纯粹+生扶化神', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    expect(pat.category).toBe('化土格')
    expect(ao.outcome).toBe('成格')
    expect(cond(ao, '化气纯粹')!.met).toBe(true)
    expect(cond(ao, '生扶化神')).toBeDefined()
  })
})

describe('conditions 通用断言', () => {
  const charts: [string, string, string, string][] = [
    ['庚申', '壬申', '乙卯', '丙戌'],
    ['癸丑', '癸子', '丙子', '癸巳'],
    ['庚申', '庚申', '乙巳', '丙戌'],
    ['庚申', '庚申', '甲寅', '丙寅'],
    ['丙寅', '丙辰', '甲子', '戊辰'],
    ['壬午', '甲辰', '戊午', '己未'],
    ['庚申', '辛卯', '甲子', '壬寅'],
  ]
  for (const p of charts) {
    it(`${p.join(' ')}:conditions 非空、每条含 label/desc/met、与结论一致`, () => {
      const { ao } = assess(p)
      expect(ao.conditions.length).toBeGreaterThan(0)
      for (const c of ao.conditions) {
        expect(c.label).toBeTruthy()
        expect(c.desc).toBeTruthy()
        expect(typeof c.met).toBe('boolean')
      }
      // 破格必有破格类条件未满足;成格必有至少一个成格条件满足
      if (ao.outcome === '破格') {
        expect(ao.conditions.some((c) => !c.met)).toBe(true)
      }
      if (ao.outcome === '成格') {
        expect(ao.conditions.some((c) => c.met)).toBe(true)
      }
    })
  }
})
