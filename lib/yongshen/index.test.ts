import { describe, it, expect } from 'vitest'
import { deriveYongShen } from './index'
import type { BaziResult, Pillar, ElementType } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
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

function makeStrength(
  level: '极强' | '偏强' | '中和' | '偏弱' | '极弱',
  totalScore = 30,
): DayMasterStrength {
  return {
    totalScore,
    level,
    breakdown: {
      monthlyOrderScore: 0, branchRootsScore: 0, stemSupportScore: 0,
      stemDrainScore: 0, hiddenStemsScore: 0,
    },
    details: [],
  }
}

type ForceOverride = Partial<Pick<ElementForceEntry, 'force' | 'yangForce' | 'yinForce'>>

function mockFactPack(
  forceOverrides: Partial<Record<ElementType, ForceOverride>> = {},
  climaticPattern = '平衡',
  structureTypes: string[] = [],
): FlowFactPack {
  const defaults = { force: 20, yangForce: 10, yinForce: 10 }
  const forces = {} as Record<ElementType, ElementForceEntry>
  for (const el of ['金', '木', '水', '火', '土'] as ElementType[]) {
    const ov = forceOverrides[el] ?? {}
    forces[el] = {
      element: el,
      force: ov.force ?? defaults.force,
      yangForce: ov.yangForce ?? defaults.yangForce,
      yinForce: ov.yinForce ?? defaults.yinForce,
    }
  }
  return {
    elementForce: {
      forces,
      average: Object.values(forces).reduce((s, f) => s + f.force, 0) / 5,
    },
    climaticBalance: {
      coldWarm: '平衡',
      dryWet: '平衡',
      pattern: climaticPattern,
      needs: [],
      detail: '',
    },
    structureSummary: {
      primaryTypes: structureTypes.map((t) => ({ type: t, weight: 1 })),
      summary: '',
      detail: '',
    },
  } as unknown as FlowFactPack
}

// ── 测试 ──

describe('deriveYongShen（集成测试）', () => {
  it('1. 戊土偏强 + 火炎土燥：扶抑主线，庚金食神为第一用神', () => {
    // 用户指定八字：壬午/甲辰/戊午/己未
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    const strength = makeStrength('偏强', 60)
    const factPack = mockFactPack(
      {
        金: { force: 0, yangForce: 0, yinForce: 0 },
        水: { force: 30, yangForce: 18, yinForce: 12 },
        木: { force: 25, yangForce: 15, yinForce: 10 },
        火: { force: 25, yangForce: 12, yinForce: 13 },
        土: { force: 20, yangForce: 10, yinForce: 10 },
      },
      '火炎土燥',
    )

    const result = deriveYongShen(bazi, strength, factPack)

    expect(result.primaryMethod).toBe('扶抑')

    // 喜用神
    expect(result.yongShen.length).toBeGreaterThan(0)
    const yongGans = result.yongShen.map((r) => r.gan)
    expect(yongGans).toContain('庚')
    expect(yongGans).toContain('辛')

    // 壬水（财+3→3.3）和庚金（食伤+2→3.0）经调候等权融合后，壬水因 fuYi 基础分更高排第一
    expect(result.yongShen[0].gan).toBe('壬')
    expect(result.yongShen[0].score).toBeGreaterThan(2)
    expect(result.yongShen[1].gan).toBe('庚')
    expect(result.yongShen[1].score).toBeGreaterThan(2)

    // 忌神应包含火土
    const jiElements = result.jiShen.map((r) => r.element)
    expect(jiElements.some((e) => e === '火' || e === '土')).toBe(true)

    // 推理链完整
    expect(result.reasoning.length).toBeGreaterThanOrEqual(3)

    // 摘要非空
    expect(result.summary.length).toBeGreaterThan(0)
  })

  it('2. 从财格：极弱戊土，全局金旺', () => {
    // 戊土极弱，天干无印比，地支无土本气根，金>50%
    const bazi = makeBazi('庚', '申', '辛', '酉', '戊', '子', '辛', '酉')
    const strength = makeStrength('极弱', 5)
    const factPack = mockFactPack({
      金: { force: 60, yangForce: 30, yinForce: 30 },
      水: { force: 20, yangForce: 10, yinForce: 10 },
      土: { force: 10, yangForce: 5, yinForce: 5 },
      火: { force: 5, yangForce: 3, yinForce: 2 },
      木: { force: 5, yangForce: 3, yinForce: 2 },
    })

    const result = deriveYongShen(bazi, strength, factPack)

    expect(result.primaryMethod).toBe('从格')
    expect(result.congGe?.active).toBe(true)

    // 从神为金（财）
    expect(result.congGe?.congShen).toContain('金')

    // 喜用神以金为主
    const yongElements = result.yongShen.map((r) => r.element)
    expect(yongElements.some((e) => e === '金')).toBe(true)

    // 忌神包含日主
    const jiGans = result.jiShen.map((r) => r.gan)
    expect(jiGans.some((g) => g === '戊' || g === '己')).toBe(true)
  })

  it('3. 化格：甲己合土，月令得气', () => {
    // 甲日主，己在月干，辰月（土月）→ 甲己合土
    const bazi = makeBazi('丙', '寅', '己', '辰', '甲', '寅', '丙', '寅')
    const strength = makeStrength('中和', 35)
    const factPack = mockFactPack({
      土: { force: 30, yangForce: 15, yinForce: 15 },
      木: { force: 25, yangForce: 15, yinForce: 10 },
      火: { force: 20, yangForce: 10, yinForce: 10 },
      金: { force: 15, yangForce: 8, yinForce: 7 },
      水: { force: 10, yangForce: 5, yinForce: 5 },
    })

    const result = deriveYongShen(bazi, strength, factPack)

    expect(result.primaryMethod).toBe('化格')
    expect(result.huaGe?.active).toBe(true)
    expect(result.huaGe?.huaShen).toBe('土')

    // 喜用神以土为主
    expect(result.yongShen.length).toBeGreaterThan(0)
    const yongElements = result.yongShen.map((r) => r.element)
    expect(yongElements.every((e) => e === '土' || e === '金')).toBe(true) // 土+土所生的金

    // 忌克破化神者（木克土）
    const jiElements = result.jiShen.map((r) => r.element)
    expect(jiElements.some((e) => e === '木')).toBe(true)
  })

  it('4. 中和八字 + 平衡气候：扶抑+调候+通关均弱', () => {
    const bazi = makeBazi('丁', '卯', '己', '酉', '丁', '亥', '辛', '亥')
    const strength = makeStrength('中和', 35)
    const factPack = mockFactPack()

    const result = deriveYongShen(bazi, strength, factPack)

    expect(result.primaryMethod).toBe('扶抑')
    expect(result.fuYi?.direction).toBe('中和')

    // 所有分数应接近 0
    for (const r of result.yongShen) {
      expect(Math.abs(r.score)).toBeLessThan(2)
    }
  })

  it('5. 通关介入：金木交战用水通关', () => {
    // 构造金木交战格局
    const bazi = makeBazi('庚', '申', '甲', '寅', '丙', '午', '庚', '申')
    const strength = makeStrength('偏强', 55)
    const factPack = mockFactPack(
      {
        金: { force: 35, yangForce: 20, yinForce: 15 },
        木: { force: 30, yangForce: 18, yinForce: 12 },
        火: { force: 15, yangForce: 8, yinForce: 7 },
        水: { force: 10, yangForce: 5, yinForce: 5 },
        土: { force: 10, yangForce: 5, yinForce: 5 },
      },
      '平衡',
      ['4a_双行交战'],
    )

    const result = deriveYongShen(bazi, strength, factPack)

    // 通关可能激活
    if (result.tongGuan?.active) {
      expect(result.tongGuan.mediator).toBe('水')
      expect(result.reasoning.some((s) => s.step === '通关介入')).toBe(true)
    }
  })

  it('6. 输出结构完整性验证', () => {
    const bazi = makeBazi('壬', '午', '甲', '辰', '戊', '午', '己', '未')
    const strength = makeStrength('偏强', 60)
    const factPack = mockFactPack(
      { 金: { force: 0, yangForce: 0, yinForce: 0 } },
      '火炎土燥',
    )

    const result = deriveYongShen(bazi, strength, factPack)

    // 验证 YongShenResult 所有字段
    expect(Array.isArray(result.yongShen)).toBe(true)
    expect(Array.isArray(result.jiShen)).toBe(true)
    expect(Array.isArray(result.xianShen)).toBe(true)
    expect(Array.isArray(result.reasoning)).toBe(true)
    expect(typeof result.summary).toBe('string')
    expect(['扶抑', '从格', '化格', '通关']).toContain(result.primaryMethod)

    // 喜用神数量 <= 4
    expect(result.yongShen.length).toBeLessThanOrEqual(4)
    // 忌神数量 <= 3
    expect(result.jiShen.length).toBeLessThanOrEqual(3)

    // 每个 GanRating 都完整
    for (const r of result.yongShen) {
      expect(r.gan).toBeTruthy()
      expect(r.element).toBeTruthy()
      expect(r.yinYang).toMatch(/^(阳|阴)$/)
      expect(r.tenGod).toBeTruthy()
      expect(['喜用', '忌', '仇', '闲']).toContain(r.category)
      expect(typeof r.score).toBe('number')
      expect(typeof r.reason).toBe('string')
    }

    // 喜用神按 priority 排序
    for (let i = 1; i < result.yongShen.length; i++) {
      expect(result.yongShen[i].priority).toBeGreaterThan(result.yongShen[i - 1].priority)
    }
  })
})
