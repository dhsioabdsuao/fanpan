import { describe, it, expect } from 'vitest'
import type { BaziResult } from '@/types/bazi'
import { deriveBage } from './index'

function makeBazi(
  yearStem: string, yearBranch: string,
  monthStem: string, monthBranch: string,
  dayStem: string, dayBranch: string,
  hourStem: string, hourBranch: string,
): BaziResult {
  return {
    pillars: {
      year: { stem: yearStem, branch: yearBranch, stemElement: '木', branchElement: '水', hiddenStems: [] },
      month: { stem: monthStem, branch: monthBranch, stemElement: '木', branchElement: '土', hiddenStems: [] },
      day: { stem: dayStem, branch: dayBranch, stemElement: '土', branchElement: '土', hiddenStems: [] },
      hour: { stem: hourStem, branch: hourBranch, stemElement: '土', branchElement: '火', hiddenStems: [] },
    },
    dayMaster: dayStem,
    dayMasterElement: '土',
    zodiac: '',
    naYin: { year: '', month: '', day: '', hour: '' },
    elementCount: { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 },
    tenGods: {
      yearStem: '', monthStem: '', hourStem: '',
      yearBranch: [], monthBranch: [], dayBranch: [], hourBranch: [],
    },
    solarDate: '',
    lunarDate: '',
    inputInfo: { year: 2000, month: 1, day: 1, hour: 0, minute: 0, gender: 'male', isLunar: false },
    solarTimeAdjustment: null,
  }
}

// ═══════════════════════════════════════════════════════════
// 命局1：壬午 / 甲辰 / 戊午 / 己未
// 戊土日主，辰月 → 建禄格
// ═══════════════════════════════════════════════════════════
describe('命局1：建禄格（戊日主·辰月）', () => {
  const bazi = makeBazi('壬','午', '甲','辰', '戊','午', '己','未')
  const result = deriveBage(bazi)

  it('取格：建禄格，格神戊=比肩', () => {
    expect(result.patternName).toBe('建禄格')
    expect(result.patternGod).toBe('戊')
    expect(result.patternGodType).toBe('比肩')
    expect(result.patternOrigin).toBe('本气不透')
  })

  it('成败：建禄格自成一格(月支辰，无冲)', () => {
    expect(result.success).toBe(true)
    expect(result.successDetail).toContain('自成格局')
    expect(result.failureReasons).toEqual([])
  })

  it('相神：null', () => {
    expect(result.xiangShen).toBeNull()
  })

  it('patternHint：中性，不提成败', () => {
    expect(result.patternHint).toBe('命局立建禄格，月令为日主禄旺之位。')
  })

  it('reasoning：2步', () => {
    expect(result.reasoning).toHaveLength(2)
    expect(result.reasoning[0].step).toBe('取格')
    expect(result.reasoning[1].step).toBe('成败')
  })
})

// ═══════════════════════════════════════════════════════════
// 命局2：甲申 / 甲戌 / 乙酉 / 辛巳
// 乙木日主，戌月（中气辛透时干）→ 七杀格，败格
// ═══════════════════════════════════════════════════════════
describe('命局2：七杀格败格（乙日主·戌月）', () => {
  const bazi = makeBazi('甲','申', '甲','戌', '乙','酉', '辛','巳')
  const result = deriveBage(bazi)

  it('取格：七杀格，中气辛透时干', () => {
    expect(result.patternName).toBe('七杀格')
    expect(result.patternGod).toBe('辛')
    expect(result.patternGodType).toBe('七杀')
    expect(result.patternOrigin).toBe('透干')
  })

  it('成败：七杀无制 → false', () => {
    expect(result.success).toBe(false)
    expect(result.failureReasons).toContain('七杀无制（无食神制杀、无印星化杀）')
  })

  it('相神：null', () => {
    expect(result.xiangShen).toBeNull()
  })

  it('patternHint：只说立格，绝不暗示“败/凶/不好”', () => {
    expect(result.patternHint).toBe('命局立七杀格。')
    // 严禁出现判决词
    expect(result.patternHint).not.toMatch(/败|凶|不好|破|差|弱|下/)
  })

  it('reasoning：2步（取格+成败，无相神）', () => {
    expect(result.reasoning).toHaveLength(2)
    expect(result.reasoning[0].step).toBe('取格')
    expect(result.reasoning[1].step).toBe('成败')
    expect(result.reasoning[1].detail).toContain('七杀无制')
  })
})

// ═══════════════════════════════════════════════════════════
// 命局4：丁卯 / 己酉 / 丁亥 / 辛亥
// 丁火日主，酉月 → 偏财格
// ═══════════════════════════════════════════════════════════
describe('命局4：偏财格（丁日主·酉月）', () => {
  const bazi = makeBazi('丁','卯', '己','酉', '丁','亥', '辛','巳')
  const result = deriveBage(bazi)

  it('取格：偏财格，辛透时干', () => {
    expect(result.patternName).toBe('偏财格')
    expect(result.patternGod).toBe('辛')
    expect(result.patternGodType).toBe('偏财')
    expect(result.patternOrigin).toBe('透干')
  })

  it('patternHint：中性，不判好坏', () => {
    expect(result.patternHint).not.toMatch(/好|坏|凶|败|上|下|富|贵|贫|贱/)
  })

  it('reasoning：有取格+成败', () => {
    expect(result.reasoning.length).toBeGreaterThanOrEqual(2)
    expect(result.reasoning[0].step).toBe('取格')
  })
})

// ═══════════════════════════════════════════════════════════
// 命局5：庚申 / 甲寅 / 丙午 / 庚申
// 丙火日主，寅月 → 偏印格
// ═══════════════════════════════════════════════════════════
describe('命局5：偏印格（丙日主·寅月）', () => {
  const bazi = makeBazi('庚','申', '甲','寅', '丙','午', '庚','申')
  const result = deriveBage(bazi)

  it('取格：偏印格，甲透月干', () => {
    expect(result.patternName).toBe('偏印格')
    expect(result.patternGod).toBe('甲')
    expect(result.patternGodType).toBe('偏印')
    expect(result.patternOrigin).toBe('透干')
  })

  it('patternHint：中性', () => {
    expect(result.patternHint).not.toMatch(/好|坏|凶|败|上|下|富|贵|贫|贱/)
  })

  it('reasoning：有取格+成败', () => {
    expect(result.reasoning.length).toBeGreaterThanOrEqual(2)
    expect(result.reasoning[0].step).toBe('取格')
  })
})

// ═══════════════════════════════════════════════════════════
// 宪法约束验证
// ═══════════════════════════════════════════════════════════
describe('宪法约束：patternHint 全场景合规', () => {
  it('所有命局 patternHint 不含判决词', () => {
    const charts = [
      makeBazi('壬','午','甲','辰','戊','午','己','未'),  // 命局1
      makeBazi('甲','申','甲','戌','乙','酉','辛','巳'),  // 命局2
      makeBazi('丁','卯','己','酉','丁','亥','辛','巳'),  // 命局4
      makeBazi('庚','申','甲','寅','丙','午','庚','申'),  // 命局5
    ]
    const forbidden = /好命|坏命|上等|下等|破败|凶|不好|福薄|贫贱|富贵|差命|弱格/
    for (const bazi of charts) {
      const r = deriveBage(bazi)
      expect(r.patternHint).not.toMatch(forbidden)
      expect(r.patternHint).toMatch(/^命局立/)  // 固定开头
    }
  })
})
