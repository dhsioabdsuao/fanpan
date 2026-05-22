import { describe, it, expect } from 'vitest'
import { calculateDayMasterStrength } from './index'
import type { BaziResult, Pillar } from '@/types/bazi'
import { getStemElement, getBranchElement, getHiddenStems, getTenGod } from '@/lib/bazi-utils'

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

describe('calculateDayMasterStrength', () => {
  it('1. 偏强案例: 日主得令 + 多根 + 多生扶', () => {
    // 甲寅 丁卯 甲寅 乙亥 → 甲日主,卯月(旺月40),多根(寅+卯+亥),多生扶
    const bazi = makeBazi('甲', '寅', '丁', '卯', '甲', '寅', '乙', '亥')
    const result = calculateDayMasterStrength(bazi)
    expect(result.totalScore).toBeGreaterThanOrEqual(50)
    expect(result.totalScore).toBeLessThan(75)
    expect(result.level).toBe('偏强')
    expect(result.breakdown.monthlyOrderScore).toBeGreaterThan(0)
    expect(result.breakdown.branchRootsScore).toBeGreaterThan(0)
    expect(result.breakdown.stemSupportScore).toBeGreaterThan(0)
  })

  it('2. 偏弱案例: 日主失令但有根', () => {
    // 甲寅 戊辰 甲子 庚午 → 甲木生于辰月(死月10分),有根但少,克泄重
    const bazi = makeBazi('甲', '寅', '戊', '辰', '甲', '子', '庚', '午')
    const result = calculateDayMasterStrength(bazi)
    expect(result.totalScore).toBeGreaterThanOrEqual(10)
    expect(result.totalScore).toBeLessThan(25)
    expect(result.level).toBe('偏弱')
  })

  it('3. 中和案例: 日主适度平衡', () => {
    // 甲申 丁卯 甲戌 丙寅 → 甲木生于卯月(旺月),但官杀财齐全,卯戌合减力
    const bazi = makeBazi('甲', '申', '丁', '卯', '甲', '戌', '丙', '寅')
    const result = calculateDayMasterStrength(bazi)
    expect(result.totalScore).toBeGreaterThanOrEqual(25)
    expect(result.totalScore).toBeLessThan(50)
    expect(result.level).toBe('中和')
  })

  it('4. 极弱案例: 日主失令,根浅,官杀重', () => {
    // 甲申 庚午 甲戌 辛未 → 甲木生于午月(休月15分),根浅官杀重
    const bazi = makeBazi('甲', '申', '庚', '午', '甲', '戌', '辛', '未')
    const result = calculateDayMasterStrength(bazi)
    expect(result.totalScore).toBeLessThan(10)
    expect(result.level).toBe('极弱')
  })

  it('5. 极弱案例: 完全失令,无根', () => {
    // 甲申 辛酉 甲戌 戊辰 → 甲木生于酉月(囚月5分),无根全是克泄
    const bazi = makeBazi('甲', '申', '辛', '酉', '甲', '戌', '戊', '辰')
    const result = calculateDayMasterStrength(bazi)
    expect(result.totalScore).toBeLessThan(10)
    expect(result.level).toBe('极弱')
    // 月令应该是囚月(官杀月)≈5分,被合调整
    expect(result.breakdown.monthlyOrderScore).toBeLessThanOrEqual(5)
  })

  it('6. 月支被冲案例: 验证冲根减半', () => {
    // 丙寅 甲寅 丙寅 丙申 → 寅申冲,月支寅被时支申冲,冲突调整=0.5
    const bazi = makeBazi('丙', '寅', '甲', '寅', '丙', '寅', '丙', '申')
    const result = calculateDayMasterStrength(bazi)

    const monthDetail = result.details.find(
      (d) => d.factor === '月令' && d.conflictAdjust === 0.5,
    )
    expect(monthDetail).toBeDefined()

    const monthRoot = result.details.find(
      (d) => d.factor === '地支通根' && d.source.includes('月支寅') && d.conflictAdjust === 0.5,
    )
    expect(monthRoot).toBeDefined()
  })

  it('7. 月支被合案例: 验证合根减弱', () => {
    // 甲寅 丙寅 乙亥 丁丑 → 寅亥合,月支寅被日支亥合
    const bazi = makeBazi('甲', '寅', '丙', '寅', '乙', '亥', '丁', '丑')
    const result = calculateDayMasterStrength(bazi)

    const monthDetail = result.details.find(
      (d) => d.factor === '月令' && d.conflictAdjust === 0.8,
    )
    expect(monthDetail).toBeDefined()

    const monthRoot = result.details.find(
      (d) => d.factor === '地支通根' && d.source.includes('月支寅') && d.conflictAdjust === 0.8,
    )
    expect(monthRoot).toBeDefined()
  })

  it('8. 通根多个本气根: 验证封顶 25', () => {
    // 甲寅 甲寅 甲寅 甲寅 → 4个本气根,未调整前>25 → cap 25
    const bazi = makeBazi('甲', '寅', '甲', '寅', '甲', '寅', '甲', '寅')
    const result = calculateDayMasterStrength(bazi)
    expect(result.breakdown.branchRootsScore).toBe(25)
  })

  it('9. 天干被克: 验证生扶天干被克减半', () => {
    // 甲日主,月干壬(偏印),年干戊(克壬水)
    const bazi = makeBazi('戊', '子', '壬', '子', '甲', '子', '丙', '子')
    const result = calculateDayMasterStrength(bazi)

    const monthSupport = result.details.find(
      (d) => d.factor === '天干生扶' && d.source.includes('月干壬'),
    )
    expect(monthSupport).toBeDefined()
    expect(monthSupport!.conflictAdjust).toBe(0.5)
  })

  it('10. 四季土月: 甲木生于辰月,月令死月,藏干另算', () => {
    // 甲木生于辰月: 辰本气戊(土,财) → 死月 10分
    const bazi = makeBazi('丙', '辰', '壬', '辰', '甲', '子', '丁', '卯')
    const result = calculateDayMasterStrength(bazi)

    // 月令分应为10(死月),不分冲合则不变
    expect(result.breakdown.monthlyOrderScore).toBeLessThanOrEqual(10)

    // 辰里乙木(中气)应在通根项目中算(余气根 3分)
    const chenRoot = result.details.find(
      (d) => d.factor === '地支通根' && d.source.includes('辰') && d.source.includes('乙'),
    )
    expect(chenRoot).toBeDefined()
  })

  it('11. 完整推导链: 验证 details 数组有每个因素的完整推导步骤', () => {
    const bazi = makeBazi('甲', '寅', '丁', '卯', '甲', '寅', '乙', '亥')
    const result = calculateDayMasterStrength(bazi)

    const factors = new Set(result.details.map((d) => d.factor))
    expect(factors.has('月令')).toBe(true)
    expect(factors.has('地支通根')).toBe(true)
    expect(factors.has('天干生扶')).toBe(true)

    for (const detail of result.details) {
      expect(detail.source).toBeTruthy()
      expect(typeof detail.rawScore).toBe('number')
      expect(detail.positionWeight).toBeGreaterThan(0)
      expect(detail.positionWeight).toBeLessThanOrEqual(1)
      expect([0.5, 0.8, 1.0]).toContain(detail.conflictAdjust)
      expect(typeof detail.finalScore).toBe('number')
    }
  })

  it('12. 边界值: 验证分类在边界正确', () => {
    // 构造极弱命局验证边界分类
    const bazi = makeBazi('庚', '申', '辛', '酉', '甲', '申', '壬', '申')
    const result = calculateDayMasterStrength(bazi)
    expect(result.totalScore).toBeLessThan(25)
    expect(['偏弱', '极弱']).toContain(result.level)
  })

  it('13. 极强案例: 日主极旺', () => {
    // 丙日主,寅午戌全,全是木火生扶,无克泄
    const bazi = makeBazi('甲', '寅', '丙', '午', '丙', '戌', '甲', '午')
    const result = calculateDayMasterStrength(bazi)
    // 这种命局应该比较强
    expect(result.totalScore).toBeGreaterThanOrEqual(60)
    expect(['极强', '偏强']).toContain(result.level)
  })

  it('14. 克泄耗被克减半: 验证七杀被克', () => {
    // 甲日主,月干庚(七杀),年干丙(克庚金,火克金)
    const bazi = makeBazi('丙', '寅', '庚', '申', '甲', '子', '壬', '辰')
    const result = calculateDayMasterStrength(bazi)

    const monthDrain = result.details.find(
      (d) => d.factor === '天干克泄耗' && d.source.includes('月干庚') && d.conflictAdjust === 0.5,
    )
    expect(monthDrain).toBeDefined()
  })
})
