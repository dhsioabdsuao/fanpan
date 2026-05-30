import { describe, it, expect } from 'vitest'
import type { BaziResult } from '@/types/bazi'
import {
  getMonthHiddenStems,
  buildStemPool,
  detectTransparency,
  isStemCombo,
  isStemClash,
  isBranchClash,
  isBranchHarm,
} from './helpers'

// 构建一个最小可用的 BaziResult 用于测试
function makeBazi(
  yearStem: string, yearBranch: string,
  monthStem: string, monthBranch: string,
  dayStem: string, dayBranch: string,
  hourStem: string, hourBranch: string,
): BaziResult {
  return {
    pillars: {
      year: {
        stem: yearStem, branch: yearBranch,
        stemElement: '木', branchElement: '水', hiddenStems: [],
      },
      month: {
        stem: monthStem, branch: monthBranch,
        stemElement: '木', branchElement: '土', hiddenStems: [],
      },
      day: {
        stem: dayStem, branch: dayBranch,
        stemElement: '土', branchElement: '土', hiddenStems: [],
      },
      hour: {
        stem: hourStem, branch: hourBranch,
        stemElement: '土', branchElement: '火', hiddenStems: [],
      },
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

describe('getMonthHiddenStems', () => {
  it('辰 → [戊(本气), 乙(中气), 癸(余气)] 顺序正确', () => {
    const result = getMonthHiddenStems('辰')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ stem: '戊', position: '本气' })
    expect(result[1]).toEqual({ stem: '乙', position: '中气' })
    expect(result[2]).toEqual({ stem: '癸', position: '余气' })
  })

  it('子 → [癸(本气)]', () => {
    const result = getMonthHiddenStems('子')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ stem: '癸', position: '本气' })
  })

  it('午 → [丁(本气), 己(中气)]', () => {
    const result = getMonthHiddenStems('午')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ stem: '丁', position: '本气' })
    expect(result[1]).toEqual({ stem: '己', position: '中气' })
  })

  it('寅 → [甲(本气), 丙(中气), 戊(余气)]', () => {
    const result = getMonthHiddenStems('寅')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ stem: '甲', position: '本气' })
    expect(result[1]).toEqual({ stem: '丙', position: '中气' })
    expect(result[2]).toEqual({ stem: '戊', position: '余气' })
  })
})

describe('buildStemPool', () => {
  it('命局1(壬午/甲辰/戊午/己未)：天干池={壬年,甲月,己时}，不含日干戊', () => {
    const bazi = makeBazi(
      '壬', '午', // year
      '甲', '辰', // month
      '戊', '午', // day —— 日干戊，应被排除
      '己', '未', // hour
    )
    const pool = buildStemPool(bazi)

    // stems 列表
    expect(pool.stems).toEqual(['壬', '甲', '己'])

    // 不含日干
    expect(pool.stems).not.toContain('戊')

    // entries 柱位正确
    const yearEntry = pool.entries.find((e) => e.pillar === 'year')
    expect(yearEntry?.stem).toBe('壬')

    const monthEntry = pool.entries.find((e) => e.pillar === 'month')
    expect(monthEntry?.stem).toBe('甲')

    const hourEntry = pool.entries.find((e) => e.pillar === 'hour')
    expect(hourEntry?.stem).toBe('己')

    // byPillar
    expect(pool.byPillar.year).toBe('壬')
    expect(pool.byPillar.month).toBe('甲')
    expect(pool.byPillar.hour).toBe('己')
  })
})

describe('detectTransparency', () => {
  it('命局1 辰月藏[戊,乙,癸] vs 天干池{壬,甲,己} → 全不透，返回空', () => {
    const hiddenStems = getMonthHiddenStems('辰') // [戊本, 乙中, 癸余]
    const bazi = makeBazi(
      '壬', '午',
      '甲', '辰',
      '戊', '午',
      '己', '未',
    )
    const pool = buildStemPool(bazi) // {壬, 甲, 己}

    const result = detectTransparency(hiddenStems, pool)
    expect(result).toHaveLength(0)
  })

  it('寅月藏[甲,丙,戊]，天干池含甲 → 甲透出', () => {
    const hiddenStems = getMonthHiddenStems('寅') // [甲本, 丙中, 戊余]
    const bazi = makeBazi(
      '甲', '寅', // 年干甲透
      '庚', '寅', // 月支寅
      '戊', '午',
      '壬', '戌',
    )
    const pool = buildStemPool(bazi) // {甲, 庚, 壬}

    const result = detectTransparency(hiddenStems, pool)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      hiddenStem: '甲',
      position: '本气',
      expressedOn: 'year',
    })
  })

  it('午月藏[丁,己]，天干池含丁(年)、己(时) → 两个都透出，本气丁排前', () => {
    const hiddenStems = getMonthHiddenStems('午') // [丁本, 己中]
    const bazi = makeBazi(
      '丁', '丑', // 年干丁，透午月本气
      '壬', '午', // 月支午
      '丙', '辰',
      '己', '酉', // 时干己，透午月中气
    )
    const pool = buildStemPool(bazi) // {丁, 壬, 己}

    const result = detectTransparency(hiddenStems, pool)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      hiddenStem: '丁',
      position: '本气',
      expressedOn: 'year',
    })
    expect(result[1]).toMatchObject({
      hiddenStem: '己',
      position: '中气',
      expressedOn: 'hour',
    })
  })

  it('月干与藏干同名 → 透于月干（透干检测含月干本身）', () => {
    const hiddenStems = getMonthHiddenStems('酉') // [辛本]
    const bazi = makeBazi(
      '庚', '申',
      '辛', '酉', // 月干辛 = 酉月本气 → 透于月干
      '戊', '子',
      '辛', '酉',
    )
    const pool = buildStemPool(bazi) // {庚, 辛, 辛}

    const result = detectTransparency(hiddenStems, pool)
    expect(result).toHaveLength(2) // 月干辛 + 时干辛 都透
    expect(result[0]).toMatchObject({
      hiddenStem: '辛',
      position: '本气',
      expressedOn: 'month',
    })
  })
})

describe('isStemCombo', () => {
  it('甲己合 → true', () => {
    expect(isStemCombo('甲', '己')).toBe(true)
    expect(isStemCombo('己', '甲')).toBe(true)
  })

  it('丙辛合 → true', () => {
    expect(isStemCombo('丙', '辛')).toBe(true)
  })

  it('戊己 → 不合（戊癸合，非戊己）', () => {
    expect(isStemCombo('戊', '己')).toBe(false)
  })

  it('戊癸合 → true', () => {
    expect(isStemCombo('戊', '癸')).toBe(true)
  })
})

describe('isStemClash', () => {
  it('甲庚冲 → true', () => {
    expect(isStemClash('甲', '庚')).toBe(true)
    expect(isStemClash('庚', '甲')).toBe(true)
  })

  it('乙辛冲 → true', () => {
    expect(isStemClash('乙', '辛')).toBe(true)
  })

  it('丙壬冲 → true', () => {
    expect(isStemClash('丙', '壬')).toBe(true)
  })

  it('丁癸冲 → true', () => {
    expect(isStemClash('丁', '癸')).toBe(true)
  })

  it('戊己 → 不冲（土无天干冲）', () => {
    expect(isStemClash('戊', '己')).toBe(false)
  })

  it('甲己 → 合但不冲', () => {
    expect(isStemClash('甲', '己')).toBe(false)
  })

  it('戊甲 → 不冲', () => {
    expect(isStemClash('戊', '甲')).toBe(false)
  })
})

describe('isBranchClash', () => {
  it('子午冲 → true', () => {
    expect(isBranchClash('子', '午')).toBe(true)
    expect(isBranchClash('午', '子')).toBe(true)
  })

  it('丑未冲 → true', () => {
    expect(isBranchClash('丑', '未')).toBe(true)
  })

  it('寅申冲 → true', () => {
    expect(isBranchClash('寅', '申')).toBe(true)
  })

  it('卯酉冲 → true', () => {
    expect(isBranchClash('卯', '酉')).toBe(true)
  })

  it('辰戌冲 → true', () => {
    expect(isBranchClash('辰', '戌')).toBe(true)
  })

  it('巳亥冲 → true', () => {
    expect(isBranchClash('巳', '亥')).toBe(true)
  })

  it('子丑 → 不冲（子丑合，非冲）', () => {
    expect(isBranchClash('子', '丑')).toBe(false)
  })

  it('寅卯 → 不冲', () => {
    expect(isBranchClash('寅', '卯')).toBe(false)
  })
})

describe('isBranchHarm', () => {
  it('子未害 → true', () => {
    expect(isBranchHarm('子', '未')).toBe(true)
    expect(isBranchHarm('未', '子')).toBe(true)
  })

  it('丑午害 → true', () => {
    expect(isBranchHarm('丑', '午')).toBe(true)
  })

  it('寅巳害 → true', () => {
    expect(isBranchHarm('寅', '巳')).toBe(true)
  })

  it('卯辰害 → true', () => {
    expect(isBranchHarm('卯', '辰')).toBe(true)
  })

  it('申亥害 → true', () => {
    expect(isBranchHarm('申', '亥')).toBe(true)
  })

  it('酉戌害 → true', () => {
    expect(isBranchHarm('酉', '戌')).toBe(true)
  })

  it('子丑 → 不害（子丑合，非害）', () => {
    expect(isBranchHarm('子', '丑')).toBe(false)
  })

  it('寅申 → 不害（寅申冲，非害）', () => {
    expect(isBranchHarm('寅', '申')).toBe(false)
  })
})
