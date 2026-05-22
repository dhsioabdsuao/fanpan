import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return {
    year: 2000,
    month: 6,
    day: 15,
    hour: 10,
    minute: 0,
    gender: 'male',
    isLunar: false,
    ...overrides,
  }
}

describe('calculateBazi', () => {
  // 测试1: 立春前换年
  it('立春前年柱应为上一年', () => {
    const result = calculateBazi(makeInput({
      year: 1990, month: 2, day: 3, hour: 10, minute: 0,
    }))
    expect(result.pillars.year.stem).toBe('己')
    expect(result.pillars.year.branch).toBe('巳')
  })

  // 测试2: 立春后换年
  it('立春后年柱应为新一年', () => {
    const result = calculateBazi(makeInput({
      year: 1990, month: 2, day: 5, hour: 10, minute: 0,
    }))
    expect(result.pillars.year.stem).toBe('庚')
    expect(result.pillars.year.branch).toBe('午')
  })

  // 测试3: 节气换月
  it('惊蛰前后月柱应不同', () => {
    // 2000年惊蛰为3月5日14:42，10:00仍在寅月
    const before = calculateBazi(makeInput({
      year: 2000, month: 3, day: 5, hour: 10, minute: 0,
    }))
    // 3月6日已过惊蛰，进入卯月
    const after = calculateBazi(makeInput({
      year: 2000, month: 3, day: 6, hour: 10, minute: 0,
    }))
    expect(before.pillars.month.stem).not.toBe(after.pillars.month.stem)
    expect(before.pillars.month.branch).not.toBe(after.pillars.month.branch)
    // 惊蛰前为寅月，惊蛰后为卯月
    expect(before.pillars.month.branch).toBe('寅')
    expect(after.pillars.month.branch).toBe('卯')
  })

  // 测试4: 晚子时（23:00-23:59 日柱进位算次日）
  it('晚子时日柱应为次日', () => {
    const result = calculateBazi(makeInput({
      year: 2000, month: 6, day: 15, hour: 23, minute: 30,
    }))
    // 6月15日日柱为甲辰，6月16日为乙巳。晚子时应为乙巳
    expect(result.pillars.day.stem).toBe('乙')
    expect(result.pillars.day.branch).toBe('巳')
    // 时柱为子时，由乙日干起丙子
    expect(result.pillars.hour.stem).toBe('丙')
    expect(result.pillars.hour.branch).toBe('子')
  })

  // 测试5: 早子时（0:00-0:59 日柱算当日）
  it('早子时日柱应为当日', () => {
    const result = calculateBazi(makeInput({
      year: 2000, month: 6, day: 15, hour: 0, minute: 30,
    }))
    expect(result.pillars.day.stem).toBe('甲')
    expect(result.pillars.day.branch).toBe('辰')
    // 时柱子时，由甲日干起甲子
    expect(result.pillars.hour.stem).toBe('甲')
    expect(result.pillars.hour.branch).toBe('子')
  })

  // 测试6: 农历输入能正确转公历并排盘
  it('农历输入应正确转换并排盘', () => {
    // 农历1990年正月初一 → 公历1990-01-27
    const result = calculateBazi(makeInput({
      year: 1990, month: 1, day: 1, hour: 10, minute: 0,
      isLunar: true,
    }))
    // 不应报错，应有有效输出
    expect(result.pillars.year.stem).toBeTruthy()
    expect(result.pillars.month.stem).toBeTruthy()
    expect(result.pillars.day.stem).toBeTruthy()
    expect(result.pillars.hour.stem).toBeTruthy()
    // 验证公历日期正确
    expect(result.solarDate).toContain('1990年1月27日')
    // 验证农历日期显示（库返回短格式如"正"、"初一"）
    expect(result.lunarDate).toContain('年')
    expect(result.lunarDate).toContain('初')
  })

  // 测试7: 农历闰月——闰四月 vs 普通四月的对照验证
  it('农历闰四月应正确排盘（公历5月23日，月柱辛巳）', () => {
    // 2020年闰四月初一 → 公历 2020-05-23
    const result = calculateBazi(makeInput({
      year: 2020, month: 4, day: 1, hour: 10, minute: 0,
      isLunar: true,
      isLeapMonth: true,
    }))
    // 公历应为 2020-05-23
    expect(result.solarDate).toContain('2020年5月23日')
    // 年柱庚子
    expect(result.pillars.year.stem).toBe('庚')
    expect(result.pillars.year.branch).toBe('子')
    // 月柱辛巳（立夏后芒种前）
    expect(result.pillars.month.stem).toBe('辛')
    expect(result.pillars.month.branch).toBe('巳')
    // 日主应有值
    expect(result.dayMaster).toBeTruthy()
    // 农历日期应包含"闰"
    expect(result.lunarDate).toContain('闰')
  })

  it('农历普通四月应对应公历4月23日，月柱庚辰', () => {
    // 2020年（普通）四月初一 → 公历 2020-04-23（清明后立夏前）
    const result = calculateBazi(makeInput({
      year: 2020, month: 4, day: 1, hour: 10, minute: 0,
      isLunar: true,
      isLeapMonth: false,
    }))
    // 公历应为 2020-04-23
    expect(result.solarDate).toContain('2020年4月23日')
    // 年柱庚子
    expect(result.pillars.year.stem).toBe('庚')
    expect(result.pillars.year.branch).toBe('子')
    // 月柱庚辰（清明后立夏前）
    expect(result.pillars.month.stem).toBe('庚')
    expect(result.pillars.month.branch).toBe('辰')
    // 日主应有值
    expect(result.dayMaster).toBeTruthy()
    // 农历日期不应包含"闰"
    expect(result.lunarDate).not.toContain('闰')
  })

  // 测试8: 已知案例验证——甲子年立春前最后一天
  it('甲子年立春前年柱应为癸亥', () => {
    // 1984年2月2日为甲子年立春前最后一天，年柱应为癸亥
    const result = calculateBazi(makeInput({
      year: 1984, month: 2, day: 2, hour: 0, minute: 0,
    }))
    expect(result.pillars.year.stem).toBe('癸')
    expect(result.pillars.year.branch).toBe('亥')
  })

  describe('阶段4: 常规日期完整四柱验证', () => {
    // 测试9: 1990-06-15 14:30 男 — 算法输出(已验证正确): 年庚午月壬午日辛亥时乙未
    // 用户曾报告期望: 日柱庚申、时柱癸未，经三方验证(JS Date / Python / 万年历锚点)确认算法正确
    it('1990-06-15 14:30 男 → 年庚午月壬午日辛亥时乙未', () => {
      const result = calculateBazi(makeInput({
        year: 1990, month: 6, day: 15, hour: 14, minute: 30,
      }))
      expect(result.pillars.year.stem).toBe('庚')
      expect(result.pillars.year.branch).toBe('午')
      expect(result.pillars.month.stem).toBe('壬')
      expect(result.pillars.month.branch).toBe('午')
      expect(result.pillars.day.stem).toBe('辛')
      expect(result.pillars.day.branch).toBe('亥')
      expect(result.pillars.hour.stem).toBe('乙')
      expect(result.pillars.hour.branch).toBe('未')
    })

    // 测试10: 2024-01-01 12:00 — 立春前年柱癸卯，大雪后子月
    it('2024-01-01 12:00 → 年癸卯月甲子日甲子时庚午', () => {
      const result = calculateBazi(makeInput({
        year: 2024, month: 1, day: 1, hour: 12, minute: 0,
      }))
      expect(result.pillars.year.stem).toBe('癸')
      expect(result.pillars.year.branch).toBe('卯')
      expect(result.pillars.month.stem).toBe('甲')
      expect(result.pillars.month.branch).toBe('子')
      expect(result.pillars.day.stem).toBe('甲')
      expect(result.pillars.day.branch).toBe('子')
      expect(result.pillars.hour.stem).toBe('庚')
      expect(result.pillars.hour.branch).toBe('午')
    })

    // 测试11: 1985-08-20 08:00 男
    it('1985-08-20 08:00 → 年乙丑月甲申日辛卯时壬辰', () => {
      const result = calculateBazi(makeInput({
        year: 1985, month: 8, day: 20, hour: 8, minute: 0,
      }))
      expect(result.pillars.year.stem).toBe('乙')
      expect(result.pillars.year.branch).toBe('丑')
      expect(result.pillars.month.stem).toBe('甲')
      expect(result.pillars.month.branch).toBe('申')
      expect(result.pillars.day.stem).toBe('辛')
      expect(result.pillars.day.branch).toBe('卯')
      expect(result.pillars.hour.stem).toBe('壬')
      expect(result.pillars.hour.branch).toBe('辰')
    })

    // 测试12: 2010-12-25 16:00 女
    it('2010-12-25 16:00 → 年庚寅月戊子日己酉时壬申', () => {
      const result = calculateBazi(makeInput({
        year: 2010, month: 12, day: 25, hour: 16, minute: 0,
        gender: 'female',
      }))
      expect(result.pillars.year.stem).toBe('庚')
      expect(result.pillars.year.branch).toBe('寅')
      expect(result.pillars.month.stem).toBe('戊')
      expect(result.pillars.month.branch).toBe('子')
      expect(result.pillars.day.stem).toBe('己')
      expect(result.pillars.day.branch).toBe('酉')
      expect(result.pillars.hour.stem).toBe('壬')
      expect(result.pillars.hour.branch).toBe('申')
    })
  })
})
