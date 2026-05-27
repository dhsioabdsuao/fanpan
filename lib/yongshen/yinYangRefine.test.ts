import { describe, it, expect } from 'vitest'
import { refineYinYang } from './yinYangRefine'
import type { BaziResult, Pillar, ElementType } from '@/types/bazi'
import type { FlowFactPack } from '@/lib/flow'
import type { ElementForceEntry } from '@/lib/flow/types'
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
  yearStem: string, yearBranch: string,
  monthStem: string, monthBranch: string,
  dayStem: string, dayBranch: string,
  hourStem: string, hourBranch: string,
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

type ForceOverride = Partial<Pick<ElementForceEntry, 'force' | 'yangForce' | 'yinForce'>>

function mockFactPack(overrides: Partial<Record<ElementType, ForceOverride>> = {}): FlowFactPack {
  const defaults = { force: 20, yangForce: 10, yinForce: 10 }
  const forces = {} as Record<ElementType, ElementForceEntry>
  for (const el of ['金', '木', '水', '火', '土'] as ElementType[]) {
    const ov = overrides[el] ?? {}
    forces[el] = {
      element: el,
      force: ov.force ?? defaults.force,
      yangForce: ov.yangForce ?? defaults.yangForce,
      yinForce: ov.yinForce ?? defaults.yinForce,
    }
  }
  const total = Object.values(forces).reduce((s, f) => s + f.force, 0)
  return { elementForce: { forces, average: total / 5 } } as unknown as FlowFactPack
}

function findGan(ratings: ReturnType<typeof refineYinYang>, gan: string) {
  const r = ratings.find((r) => r.gan === gan)
  if (!r) throw new Error(`Gan ${gan} not found`)
  return r
}

// ── 测试 ──

describe('refineYinYang', () => {
  it('1. 戊土偏强 + 火炎土燥：庚金食神补缺，壬水现成', () => {
    // 壬午/甲辰/戊午/己未 — 命局无金，壬水透年干
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    // 金力为 0（补缺），其他五行有正常力量
    const factPack = mockFactPack({
      金: { force: 0, yangForce: 0, yinForce: 0 },
      水: { force: 30, yangForce: 18, yinForce: 12 },
      木: { force: 25, yangForce: 15, yinForce: 10 },
      火: { force: 25, yangForce: 12, yinForce: 13 },
      土: { force: 20, yangForce: 10, yinForce: 10 },
    })
    const scores: Record<ElementType, number> = { 金: 3, 木: 2, 水: 3, 火: -3, 土: -3 }

    const result = refineYinYang(bazi, factPack, scores)

    // 庚金：3 + 0.5食神 + 0.5补缺 = 4.0
    const geng = findGan(result, '庚')
    expect(geng.score).toBe(4.0)
    expect(geng.reason).toContain('食神')
    expect(geng.reason).toContain('补缺')

    // 辛金：3 + 0伤官 + 0.5补缺 = 3.5
    const xin = findGan(result, '辛')
    expect(xin.score).toBe(3.5)
    expect(xin.reason).toContain('补缺')

    // 壬水：3 + 0偏财 + 0.3现成 = 3.3
    const ren = findGan(result, '壬')
    expect(ren.score).toBe(3.3)
    expect(ren.reason).toContain('现成')

    // 甲木：2 + 0.5七杀 + 0.3现成 = 2.8
    const jia = findGan(result, '甲')
    expect(jia.score).toBe(2.8)
    expect(jia.reason).toContain('七杀')
    expect(jia.reason).toContain('现成')

    // 乙木：2 + 0正官 = 2.0
    const yi = findGan(result, '乙')
    expect(yi.score).toBe(2.0)

    // 丙/丁火 → 负分不调整
    expect(findGan(result, '丙').score).toBe(-3)
    expect(findGan(result, '丁').score).toBe(-3)

    // 戊/己土 → 负分不调整
    expect(findGan(result, '戊').score).toBe(-3)
    expect(findGan(result, '己').score).toBe(-3)
  })

  it('2. 庚金偏弱 + 平衡：正印优先于偏印', () => {
    // 庚金日主，生扶场景
    const bazi = makeBazi('甲', '寅', '甲', '寅', '庚', '申', '甲', '寅')
    const factPack = mockFactPack()
    const scores: Record<ElementType, number> = { 金: 2, 木: -3, 水: -2, 火: -3, 土: 3 }

    const result = refineYinYang(bazi, factPack, scores)

    // 己土(base=3, 正印)：3 + 0.5 = 3.5
    expect(findGan(result, '己').score).toBe(3.5)
    expect(findGan(result, '己').reason).toContain('正印')

    // 戊土(base=3, 偏印)：3 + 0 = 3.0
    expect(findGan(result, '戊').score).toBe(3.0)

    // 庚金(base=2, 比肩)：2 + 0.3 = 2.3
    expect(findGan(result, '庚').score).toBe(2.3)
    expect(findGan(result, '庚').reason).toContain('比肩')

    // 辛金(base=2, 劫财)：2 + 0 = 2.0
    expect(findGan(result, '辛').score).toBe(2.0)
  })

  it('3. 乙木偏强 + 阳金过重：阴金辛优先于阳金庚', () => {
    // 乙木日主，克泄耗场景。命局无金天干（避免现成干扰）
    const bazi = makeBazi('丙', '寅', '丙', '寅', '乙', '卯', '丙', '寅')
    // 金 yangForce 80 vs yinForce 20 → 阴金补 +0.2
    const factPack = mockFactPack({
      金: { force: 100, yangForce: 80, yinForce: 20 },
    })
    const scores: Record<ElementType, number> = { 金: 3, 木: -3, 水: 0, 火: 2, 土: 0 }

    const result = refineYinYang(bazi, factPack, scores)

    // 庚金(正官)：3 + 0正官 = 3.0
    const geng = findGan(result, '庚')
    expect(geng.score).toBe(3.0)

    // 辛金(七杀)：3 + 0.5七杀 + 0.2阴补 = 3.7
    const xin = findGan(result, '辛')
    expect(xin.score).toBe(3.7)
    expect(xin.reason).toContain('七杀')
    expect(xin.reason).toContain('阴补')
    expect(xin.score).toBeGreaterThan(geng.score)
  })

  it('4. 日主中和：所有基础分 0，仅剩原局微调', () => {
    const bazi = makeBazi('丁', '卯', '己', '酉', '丁', '亥', '辛', '亥')
    const factPack = mockFactPack()
    const scores: Record<ElementType, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }

    const result = refineYinYang(bazi, factPack, scores)

    // 所有基础分应接近 0
    for (const r of result) {
      // 可能有细微的 被制 减分，但绝对值 < 0.5
      expect(Math.abs(r.score)).toBeLessThan(0.5)
    }
  })

  it('5. 补缺验证：命局无金，score>0 时 庚辛获得补缺标记', () => {
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    const factPack = mockFactPack({
      金: { force: 0, yangForce: 0, yinForce: 0 },
    })
    const scores: Record<ElementType, number> = { 金: 3, 木: 0, 水: 0, 火: 0, 土: 0 }

    const result = refineYinYang(bazi, factPack, scores)

    expect(findGan(result, '庚').reason).toContain('补缺')
    expect(findGan(result, '辛').reason).toContain('补缺')
    // 金 force=0，补缺 +0.5
    expect(findGan(result, '庚').score).toBe(3 + 0.5 + 0.5) // base 3 + 食神0.5 + 补缺0.5
  })

  it('6. 现成验证：壬水透出年柱，获得现成加权', () => {
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    const factPack = mockFactPack()
    const scores: Record<ElementType, number> = { 金: 0, 木: 0, 水: 3, 火: 0, 土: 0 }

    const result = refineYinYang(bazi, factPack, scores)

    // 壬水在年柱透出 → 现成+0.3
    expect(findGan(result, '壬').reason).toContain('现成')
    expect(findGan(result, '壬').score).toBe(3 + 0.3) // base 3 + 现成0.3
    // 癸水不在命局透出 → 无现成
    expect(findGan(result, '癸').reason).not.toContain('现成')
    expect(findGan(result, '癸').score).toBe(3)
  })
})
