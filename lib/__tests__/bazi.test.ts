import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'
import { extractPattern } from '../bage/extractPattern'
import { assessOutcome } from '../bage/assessOutcome'
import { isJinShuiShangGuan, isHuaRenWeiYin, isShangGuanStrong, isYinYouGen } from '../bage/helpers'
import { getTiaoHouYongShen } from '../bage/tiaoHou'
import { generateAnalysis } from '../bage/generateAnalysis'
import { determineStrength } from '../strength/determineStrength'
import { isCongSha, isCongCai } from '../bage/congGe'
import { isHuaGe, getHuaQiDayMaster, recalculateShiShen } from '../bage/huaGe'
import type { HuaQiShiShenResult } from '../bage/huaGe'
import { analyzeWuXingLiuTong } from '../bage/liuTong'
import { getAllShenSha } from '../bage/shensha'
import type { ShenSha } from '../bage/shensha'

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

// ── 调候特例：金水伤官喜见官 ──

describe('isJinShuiShangGuan', () => {
  it('金日主(庚) + 丑月 + 无巳午 → true', () => {
    // 1998-01-13: 丁丑 癸丑 庚申 庚辰
    const b = calculateBazi(makeInput({ year: 1998, month: 1, day: 13, hour: 8 }))
    expect(b.dayMasterElement).toBe('金')
    expect(b.pillars.month.branch).toBe('丑')
    expect(isJinShuiShangGuan(b)).toBe(true)
  })

  it('非金日主 → false', () => {
    // 2000-06-15: 甲木日主
    const b = calculateBazi(makeInput({ year: 2000, month: 6, day: 15, hour: 10 }))
    expect(b.dayMasterElement).not.toBe('金')
    expect(isJinShuiShangGuan(b)).toBe(false)
  })

  it('金日主 + 午月 → false', () => {
    // 2020-06-06: 庚金日主 + 午月
    const b = calculateBazi(makeInput({ year: 2020, month: 6, day: 6, hour: 10 }))
    expect(b.dayMasterElement).toBe('金')
    expect(b.pillars.month.branch).toBe('午')
    expect(isJinShuiShangGuan(b)).toBe(false)
  })

})

describe('assessOutcome 金水伤官喜见官', () => {
  it('1998-01-13 丁丑 癸丑 庚申 庚辰 → 成格, 金水伤官喜见官', () => {
    const b = calculateBazi(makeInput({ year: 1998, month: 1, day: 13, hour: 8 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('伤官格')

    const ao = assessOutcome(b, pat)
    expect(ao.outcome).toBe('成格')
    expect(ao.reason).toContain('金水伤官喜见官')
    expect(ao.reason).toContain('格局反贵')
  })

  it('2016-12-05 丙申 己亥 辛酉 壬辰 → 成格, 伤官佩印 + 金水伤官喜见官', () => {
    const b = calculateBazi(makeInput({ year: 2016, month: 12, day: 5, hour: 8 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('伤官格')

    const ao = assessOutcome(b, pat)
    expect(ao.outcome).toBe('成格')
    expect(ao.reason).toContain('伤官佩印')
    expect(ao.reason).toContain('金水伤官喜见官')
  })
})

// ── 调候特例：阳刃格化刃为印 ──

describe('isHuaRenWeiYin', () => {
  it('戊土日主 + 午月 + 丁透干 + 三合寅午戌 → true', () => {
    // 1998-06-20: 戊寅 戊午 戊戌 丁巳
    const b = calculateBazi(makeInput({ year: 1998, month: 6, day: 20, hour: 10 }))
    expect(b.dayMaster).toBe('戊')
    expect(b.pillars.month.branch).toBe('午')
    expect(isHuaRenWeiYin(b)).toBe(true)
  })

  it('非戊土日主 → false', () => {
    // 2002-06-20: 丙火日主 + 午月
    const b = calculateBazi(makeInput({ year: 2002, month: 6, day: 20, hour: 10 }))
    expect(b.dayMaster).not.toBe('戊')
    expect(isHuaRenWeiYin(b)).toBe(false)
  })

  it('戊土日主 + 午月 + 无火局 → false', () => {
    // 1990-06-12: 庚午 壬午 戊申 丙辰（无寅午戌/巳午未合局）
    const b = calculateBazi(makeInput({ year: 1990, month: 6, day: 12, hour: 8 }))
    expect(b.dayMaster).toBe('戊')
    expect(b.pillars.month.branch).toBe('午')
    expect(isHuaRenWeiYin(b)).toBe(false)
  })

  it('戊土日主 + 非午月 → false', () => {
    // 1998-07-20: 戊土日主 + 未月
    const b = calculateBazi(makeInput({ year: 1998, month: 7, day: 20, hour: 10 }))
    expect(b.dayMaster).toBe('戊')
    expect(b.pillars.month.branch).not.toBe('午')
    expect(isHuaRenWeiYin(b)).toBe(false)
  })
})

describe('extractPattern 化刃为印', () => {
  it('1998-06-20 戊寅 戊午 戊戌 丁巳 → 化刃为印, 印格/正印格', () => {
    const b = calculateBazi(makeInput({ year: 1998, month: 6, day: 20, hour: 10 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('印格')
    expect(pat.displayName).toBe('正印格')
    expect(pat.patternGod).toContain('化火印')
    expect(pat.origin).toBe('比劫当令')
    expect(pat.yongShen).toBe('丁')
  })

  it('1990-06-12 庚午 壬午 戊申 丙辰 → 无火局, 普通印格不化刃', () => {
    const b = calculateBazi(makeInput({ year: 1990, month: 6, day: 12, hour: 8 }))
    const pat = extractPattern(b)
    // 仍然是印格，但不是化刃为印
    expect(pat.category).toBe('印格')
    expect(pat.patternGod).not.toContain('化火印')
    expect(pat.origin).toBe('不透不会')
  })
})

// ── 调候特例：食神格弃食就煞而透印 ──

describe('assessOutcome 食神格弃食就煞而透印', () => {
  it('1990-02-16 庚午 戊寅 壬子 甲辰 → 成格, 弃食就煞而透印', () => {
    // 壬日主食神格(寅月甲木食神), 七杀戊透月干, 偏印庚透年干, 无财
    const b = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('食神格')

    const ao = assessOutcome(b, pat)
    expect(ao.outcome).toBe('成格')
    expect(ao.reason).toContain('弃食就煞而透印')
    expect(ao.reason).toContain('杀印相生')
    expect(ao.xiangShen?.god).toBe('印星')
    expect(ao.xiangShen?.role).toBe('化杀生身')
  })

  it('1991-02-11 辛未 庚寅 壬子 甲辰 → 破格, 有偏印无杀 → 枭神夺食', () => {
    // 壬日主食神格, 偏印透干但无七杀 → 枭神夺食破格，不触发弃食就煞
    const b = calculateBazi(makeInput({ year: 1991, month: 2, day: 11, hour: 8 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('食神格')

    const ao = assessOutcome(b, pat)
    expect(ao.outcome).toBe('破格')
    expect(ao.reason).toContain('枭神夺食')
    expect(ao.reason).not.toContain('弃食就煞')
  })
})

// ── 伤官格强弱门槛：isShangGuanStrong / isYinYouGen ──

describe('isShangGuanStrong', () => {
  it('伤官透干 + 地支有强根 → true', () => {
    // 2016-12-05 08:00 辛酉日, 壬水伤官透干, 壬长生在申(年支) → 有根
    const b = calculateBazi(makeInput({ year: 2016, month: 12, day: 5, hour: 8 }))
    expect(isShangGuanStrong(b)).toBe(true)
  })

  it('伤官透干但无强根/不成局 → false', () => {
    // 1991-04-12 09:00 壬子日, 乙木伤官透时干, 乙禄卯/长生午/旺寅
    // 地支未/辰/子/巳 — 无卯/午/寅 → 无强根
    const b = calculateBazi(makeInput({ year: 1991, month: 4, day: 12, hour: 9 }))
    // 日主壬, 伤官乙透时干
    expect(isShangGuanStrong(b)).toBe(false)
  })

  it('伤官未透干 → false', () => {
    // 2000-06-15: 甲木日主, 伤官丁火未透干
    const b = calculateBazi(makeInput({ year: 2000, month: 6, day: 15, hour: 10 }))
    expect(isShangGuanStrong(b)).toBe(false)
  })
})

describe('isYinYouGen', () => {
  it('印透干 + 地支有强根 → true', () => {
    // 2016-12-05 08:00: 己土印透月干, 己长生在酉(日支) → 有根
    const b = calculateBazi(makeInput({ year: 2016, month: 12, day: 5, hour: 8 }))
    expect(isYinYouGen(b)).toBe(true)
  })

  it('印透干但无强根 → false', () => {
    // 1998-01-13 08:00: 戊土印透月干, 戊长生寅/禄巳/旺午
    // 地支丑/丑/申/辰 — 无寅/巳/午 → 无强根
    const b = calculateBazi(makeInput({ year: 1998, month: 1, day: 13, hour: 8 }))
    expect(isYinYouGen(b)).toBe(false)
  })
})

describe('assessOutcome 伤官格强弱门槛', () => {
  it('2016-12-05 辛酉 → 伤官旺 + 印有根 → 成格, 伤官佩印', () => {
    const b = calculateBazi(makeInput({ year: 2016, month: 12, day: 5, hour: 8 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('伤官格')

    const ao = assessOutcome(b, pat)
    expect(ao.outcome).toBe('成格')
    expect(ao.reason).toContain('伤官佩印')
  })

  it('1991-04-12 壬子 → 伤官透干但不旺 → 不成格', () => {
    // 乙木伤官透时干, 但无强根/不成局, 印有根但伤官不旺 → 佩印乏力
    const b = calculateBazi(makeInput({ year: 1991, month: 4, day: 12, hour: 9 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('伤官格')

    const ao = assessOutcome(b, pat)
    expect(ao.outcome).toBe('不成格')
    expect(ao.reason).toContain('伤官不旺')
    expect(ao.reason).toContain('佩印乏力')
  })

  it('1993-04-18 庚午 → 伤官旺 + 中和 → 成格, 伤官带杀无财', () => {
    // 庚金日主, 癸水伤官透年干, 癸禄在子(时支) → 伤官旺
    // 日主中和, 满足带杀前置条件
    const b = calculateBazi(makeInput({ year: 1993, month: 4, day: 18, hour: 23 }))
    const pat = extractPattern(b)
    expect(pat.category).toBe('伤官格')

    const ao = assessOutcome(b, pat)
    expect(ao.outcome).toBe('成格')
    expect(ao.reason).toContain('伤官带杀无财')
  })
})

// ── 调候查表：getTiaoHouYongShen（《穷通宝鉴》逐月完整表）──

const ALL_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const

describe('getTiaoHouYongShen', () => {
  it('甲木逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['丙', '癸'], 卯: ['庚', '丙', '丁'], 辰: ['庚', '丁', '壬'],
      巳: ['癸', '丁', '庚'], 午: ['壬', '庚', '丁'], 未: ['癸', '丁', '壬'],
      申: ['庚', '丁', '壬'], 酉: ['庚', '丁', '丙'], 戌: ['庚', '甲', '丁'],
      亥: ['庚', '丁', '丙'], 子: ['丁', '庚', '丙'], 丑: ['丁', '庚', '丙'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('甲', b), `甲木${b}月`).toEqual(expected[b])
    }
  })

  it('乙木逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['丙', '癸'], 卯: ['丙', '癸'], 辰: ['癸', '丙', '戊'],
      巳: ['癸'], 午: ['癸', '丙'], 未: ['癸', '丙'],
      申: ['丙', '癸', '己'], 酉: ['癸', '丙', '丁'], 戌: ['癸', '辛'],
      亥: ['丙', '戊'], 子: ['丙'], 丑: ['丙'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('乙', b), `乙木${b}月`).toEqual(expected[b])
    }
  })

  it('丙火逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['壬', '庚'], 卯: ['壬', '己'], 辰: ['壬', '甲'],
      巳: ['壬', '庚', '癸'], 午: ['壬', '庚'], 未: ['壬', '庚'],
      申: ['壬', '戊'], 酉: ['壬', '癸'], 戌: ['甲', '壬'],
      亥: ['甲', '戊', '庚'], 子: ['甲', '戊', '庚'], 丑: ['壬', '甲'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('丙', b), `丙火${b}月`).toEqual(expected[b])
    }
  })

  it('丁火逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['甲', '庚'], 卯: ['庚', '甲'], 辰: ['甲', '庚'],
      巳: ['甲', '庚'], 午: ['壬', '庚', '癸'], 未: ['甲', '壬', '庚'],
      申: ['甲', '庚', '丙'], 酉: ['甲', '庚', '丙'], 戌: ['甲', '庚', '戊'],
      亥: ['甲', '庚'], 子: ['甲', '庚'], 丑: ['甲', '庚'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('丁', b), `丁火${b}月`).toEqual(expected[b])
    }
  })

  it('戊土逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['丙', '甲', '癸'], 卯: ['丙', '甲', '癸'], 辰: ['甲', '丙', '癸'],
      巳: ['甲', '丙', '癸'], 午: ['壬', '甲', '丙'], 未: ['癸', '丙', '甲'],
      申: ['丙', '癸', '甲'], 酉: ['丙', '癸'], 戌: ['甲', '丙', '癸'],
      亥: ['甲', '丙'], 子: ['丙', '甲'], 丑: ['丙', '甲'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('戊', b), `戊土${b}月`).toEqual(expected[b])
    }
  })

  it('己土逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['丙', '庚', '甲'], 卯: ['甲', '癸', '丙'], 辰: ['丙', '癸', '甲'],
      巳: ['癸', '丙'], 午: ['癸', '丙'], 未: ['癸', '丙'],
      申: ['丙', '癸'], 酉: ['丙', '癸'], 戌: ['甲', '丙', '癸'],
      亥: ['丙', '甲', '戊'], 子: ['丙', '甲', '戊'], 丑: ['丙', '甲', '戊'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('己', b), `己土${b}月`).toEqual(expected[b])
    }
  })

  it('庚金逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['丙', '戊', '甲'], 卯: ['丁', '甲', '丙'], 辰: ['甲', '丁', '壬'],
      巳: ['壬', '丙', '戊'], 午: ['壬', '癸'], 未: ['丁', '甲'],
      申: ['丁', '甲'], 酉: ['丁', '甲', '丙'], 戌: ['甲', '壬'],
      亥: ['丁', '丙'], 子: ['丙', '甲'], 丑: ['丙', '丁', '甲'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('庚', b), `庚金${b}月`).toEqual(expected[b])
    }
  })

  it('辛金逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['己', '壬', '庚'], 卯: ['壬', '甲'], 辰: ['壬', '甲'],
      巳: ['壬', '甲', '癸'], 午: ['壬', '己', '癸'], 未: ['壬', '庚', '甲'],
      申: ['壬', '甲', '戊'], 酉: ['壬', '甲'], 戌: ['壬', '甲'],
      亥: ['壬', '丙'], 子: ['丙', '戊', '壬'], 丑: ['丙', '壬', '戊'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('辛', b), `辛金${b}月`).toEqual(expected[b])
    }
  })

  it('壬水逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['庚', '丙', '戊'], 卯: ['戊', '辛', '庚'], 辰: ['甲', '庚'],
      巳: ['壬', '辛', '庚'], 午: ['癸', '庚', '辛'], 未: ['辛', '甲'],
      申: ['戊', '丁'], 酉: ['甲', '庚'], 戌: ['甲', '丙'],
      亥: ['戊', '丙', '庚'], 子: ['戊', '丙'], 丑: ['丙', '甲'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('壬', b), `壬水${b}月`).toEqual(expected[b])
    }
  })

  it('癸水逐月调候', () => {
    const expected: Record<string, string[]> = {
      寅: ['辛', '丙'], 卯: ['庚', '辛'], 辰: ['丙', '辛', '甲'],
      巳: ['辛'], 午: ['庚', '辛', '癸'], 未: ['庚', '辛', '癸'],
      申: ['丁'], 酉: ['辛', '丙'], 戌: ['辛', '甲', '壬'],
      亥: ['庚', '辛', '戊'], 子: ['丙', '辛'], 丑: ['丙', '丁'],
    }
    for (const b of ALL_BRANCHES) {
      expect(getTiaoHouYongShen('癸', b), `癸水${b}月`).toEqual(expected[b])
    }
  })
})

// ── 调候诊断接入格局解析文案 ──

describe('generateAnalysis 调候建议', () => {
  it('甲木午月 → 发展建议含调候内容', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 6, day: 15 }))
    const pattern = extractPattern(bazi)
    const outcome = assessOutcome(bazi, pattern)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern, outcome, strength })

    expect(result.analysis).toContain('从五行调候的角度看')
    expect(result.analysis).toContain('甲木生于午月')
    expect(result.analysis).toContain('壬、庚、丁')
    expect(result.analysis).toContain('水（学习/沟通）')
    expect(result.analysis).toContain('金（技术/专业技能）')
    expect(result.analysis).toContain('火（展示/分享）')
  })

  it('甲木子月 → 发展建议含调候内容', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 12, day: 12 }))
    const pattern = extractPattern(bazi)
    const outcome = assessOutcome(bazi, pattern)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern, outcome, strength })

    expect(result.analysis).toContain('从五行调候的角度看')
    expect(result.analysis).toContain('甲木生于子月')
    expect(result.analysis).toContain('丁、庚、丙')
  })
})

// ── 从格判定：isCongSha / isCongCai（《滴天髓》原文·任铁樵注）──

describe('从格判定', () => {
  it('真从杀格：乙木日主，三透七杀，巳酉丑合金局', () => {
    const bazi = calculateBazi(makeInput({ year: 2002, month: 1, day: 17 }))
    const result = isCongSha(bazi)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('从杀格')
    expect(result!.reason).toContain('官杀强旺')
  })

  it('假从杀格：透七杀+会金局，但天干透印星化杀', () => {
    const bazi = calculateBazi(makeInput({ year: 2003, month: 1, day: 12 }))
    const result = isCongSha(bazi)
    expect(result).toBeNull()
  })

  it('真从财格：癸水日主，透偏财，三巳火局', () => {
    const bazi = calculateBazi(makeInput({ year: 2005, month: 5, day: 9 }))
    const result = isCongCai(bazi)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('从财格')
    expect(result!.reason).toContain('财星强旺')
  })

  it('假从财格：透财+会火局，但官杀透干无食伤制，财党杀', () => {
    const bazi = calculateBazi(makeInput({ year: 2018, month: 6, day: 20 }))
    const result = isCongCai(bazi)
    expect(result).toBeNull()
  })
})

// ── 化格判定：isHuaGe / getHuaQiDayMaster（《滴天髓》原文·任铁樵注）──

describe('化格判定', () => {
  it('getHuaQiDayMaster 五组合化映射', () => {
    expect(getHuaQiDayMaster('甲', '己')).toBe('戊')
    expect(getHuaQiDayMaster('己', '甲')).toBe('己')
    expect(getHuaQiDayMaster('乙', '庚')).toBe('辛')
    expect(getHuaQiDayMaster('庚', '乙')).toBe('庚')
    expect(getHuaQiDayMaster('丙', '辛')).toBe('壬')
    expect(getHuaQiDayMaster('辛', '丙')).toBe('癸')
    expect(getHuaQiDayMaster('丁', '壬')).toBe('乙')
    expect(getHuaQiDayMaster('壬', '丁')).toBe('甲')
    expect(getHuaQiDayMaster('戊', '癸')).toBe('丙')
    expect(getHuaQiDayMaster('癸', '戊')).toBe('丁')
    expect(getHuaQiDayMaster('甲', '庚')).toBeNull()
  })

  it('真化格：甲己化土，化神透干有根，无克破', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const result = isHuaGe(bazi)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('化土格')
    expect(result!.huaShen).toBe('土')
  })

  it('假化格（化神无根）：乙庚合金，但地支无金根', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 2, day: 7 }))
    const result = isHuaGe(bazi)
    expect(result).toBeNull()
  })

  it('假化格（有克破）：甲己化土有根，但天干透甲木克土', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 8, day: 24 }))
    const result = isHuaGe(bazi)
    expect(result).toBeNull()
  })
})

// ── 化气后十神重排：recalculateShiShen ──

describe('recalculateShiShen', () => {
  it('甲己化土：新日主戊，天干十神正确', () => {
    // 2000-01-17: 甲木日主 + 己土合神 → 化土格, 新日主戊
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const result = recalculateShiShen(bazi, '戊')

    expect(result.newDayMaster).toBe('戊')
    expect(result.huaElement).toBe('土')

    // 四柱：己卯 丁丑 甲戌 己巳
    // 从新日主戊(土)看:
    // 年己(土,阴) → 劫财
    // 月丁(火,阴) → 正印(火生土, 阴阳不同)
    // 日甲(木,阳) → 七杀(木克土, 同为阳)
    // 时己(土,阴) → 劫财
    expect(result.stemTenGods.year).toBe('劫财')
    expect(result.stemTenGods.month).toBe('正印')
    expect(result.stemTenGods.day).toBe('七杀')
    expect(result.stemTenGods.hour).toBe('劫财')

    // 藏干验证(日支戌: 戊辛丁)
    // 从戊看: 戊=比肩, 辛=伤官(土生金,阴), 丁=正印
    const dayHidden = result.hiddenTenGods['day']
    expect(dayHidden).toEqual(['比肩', '伤官', '正印'])
  })

  it('乙庚化金：新日主辛，天干十神正确', () => {
    // 2000-02-07: 乙木日主 + 庚金合神 → 此命例假化(无根)，但单独测函数
    const bazi = calculateBazi(makeInput({ year: 2000, month: 2, day: 7 }))
    const result = recalculateShiShen(bazi, '辛')

    expect(result.newDayMaster).toBe('辛')
    expect(result.huaElement).toBe('金')

    // 四柱：庚辰 戊寅 乙未 辛巳
    // 从新日主辛(金)看:
    // 年庚(金,阳) → 劫财(同金, 阴阳不同)
    // 月戊(土,阳) → 正印(土生金, 阴阳不同)
    // 日乙(木,阴) → 偏财(金克木, 阴阳相同)
    // 时辛(金,阴) → 比肩(同金, 同阴)
    expect(result.stemTenGods.year).toBe('劫财')
    expect(result.stemTenGods.month).toBe('正印')
    expect(result.stemTenGods.day).toBe('偏财')
    expect(result.stemTenGods.hour).toBe('比肩')
  })
})

// ── 化气十神重排集成测试 ──

describe('extractPattern 化气十神重排', () => {
  it('真化格(甲己化土) → huaQiShiShen 不为 null，十神正确', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const pat = extractPattern(bazi)

    expect(pat.category).toBe('化土格')
    expect(pat.huaQiShiShen).not.toBeNull()

    const hq = pat.huaQiShiShen!
    expect(hq.newDayMaster).toBe('戊')
    expect(hq.huaElement).toBe('土')
    // 合作伙伴干为己，从新日主戊看己为劫财
    expect(hq.stemTenGods.year).toBe('劫财')
  })

  it('假化格(无根) → huaQiShiShen 为 null，走八格', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 2, day: 7 }))
    const pat = extractPattern(bazi)

    // 假化不触发，走八格
    expect(pat.category).not.toBe('化金格')
    expect(pat.huaQiShiShen).toBeNull()
  })

  it('假化格(克破) → huaQiShiShen 为 null，走八格', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 8, day: 24 }))
    const pat = extractPattern(bazi)

    expect(pat.category).not.toBe('化土格')
    expect(pat.huaQiShiShen).toBeNull()
  })
})

describe('assessOutcome + generateAnalysis 化格集成', () => {
  it('真化格 → 成格，用神文案含化神信息', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const pat = extractPattern(bazi)
    expect(pat.category).toBe('化土格')

    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('成格')
    expect(ao.reason).toContain('化气纯粹')

    const strength = determineStrength(bazi)
    const analysis = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    // 取格原因含新日主信息
    expect(analysis.analysis).toContain('甲(木)合化为土，新日主戊(土)')

    // 用神为化神
    expect(analysis.analysis).toContain('用神为化神土')

    // 总结文案
    expect(analysis.summary).toBeTruthy()
  })

  it('假化格 → 不触发化格，走正常八格流程', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 2, day: 7 }))
    const pat = extractPattern(bazi)
    // 假化走八格
    expect(pat.huaQiShiShen).toBeNull()
    expect(pat.origin).not.toBe('化格')

    const ao = assessOutcome(bazi, pat)
    const strength = determineStrength(bazi)
    const analysis = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    // 不应包含化神相关文案
    expect(analysis.analysis).not.toContain('化神')
    expect(analysis.analysis).not.toContain('新日主')
  })
})

// ── 五行流通诊断：analyzeWuXingLiuTong ──

describe('analyzeWuXingLiuTong', () => {
  it('火炎土燥：2000-06-15 → 堵在土，通关为金', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 6, day: 15 }))
    const result = analyzeWuXingLiuTong(bazi)

    expect(result.source).toBe('土')
    expect(result.blockage).toBe('土')
    expect(result.tongGuan).toBe('金')
    expect(result.description).toContain('土')
    expect(result.description).toContain('金')
  })

  it('金寒水冷：1998-01-13 → 堵在水，通关为木', () => {
    const bazi = calculateBazi(makeInput({ year: 1998, month: 1, day: 13, hour: 8 }))
    const result = analyzeWuXingLiuTong(bazi)

    expect(result.blockage).toBe('水')
    expect(result.tongGuan).toBe('木')
    expect(result.description).toContain('水')
    expect(result.description).toContain('木')
  })

  it('流通顺畅：1990-02-15 → blockage=null, tongGuan=null', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 15 }))
    const result = analyzeWuXingLiuTong(bazi)

    expect(result.blockage).toBeNull()
    expect(result.tongGuan).toBeNull()
    expect(result.description).toContain('顺畅')
  })
})

// ── 五行流通诊断接入解析文案 ──

describe('generateAnalysis 流通诊断', () => {
  it('火炎土燥(2000-06-15) → 文案含淤堵诊断和通关建议', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 6, day: 15 }))
    const pattern = extractPattern(bazi)
    const outcome = assessOutcome(bazi, pattern)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern, outcome, strength })

    expect(result.analysis).toContain('流通诊断')
    expect(result.analysis).toContain('土')
    expect(result.analysis).toContain('淤堵')
    expect(result.analysis).toContain('通关用神为金')
    expect(result.analysis).toContain('技术、专业技能')
  })

  it('流通顺畅(1990-02-15) → 文案含流通顺畅诊断', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 15 }))
    const pattern = extractPattern(bazi)
    const outcome = assessOutcome(bazi, pattern)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern, outcome, strength })

    expect(result.analysis).toContain('流通诊断')
    expect(result.analysis).toContain('无明显的淤堵')
    expect(result.analysis).not.toContain('通关用神')
  })
})

// ── 相神机制文案区分度 ──

describe('generateAnalysis 相神机制区分度', () => {
  it('印星化杀机制 → 文案含春风化雨、层次清高', () => {
    // 1990-02-16 食神格·弃食就煞透印 → xiangShen=印星·化杀生身
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    expect(ao.xiangShen?.role).toBe('化杀生身')
    expect(result.analysis).toContain('春风化雨')
    expect(result.analysis).toContain('层次清高')
  })
})

// ── 层次评估：成格条件逐条分解 ──

describe('generateAnalysis 成格条件分解', () => {
  it('成格(食神格·弃食就煞) → 列出条件且标记已满足', () => {
    // 1990-02-16 食神格, 弃食就煞而透印 → 杀印相生成格
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('成格')

    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    // 应包含成格条件列表
    expect(result.analysis).toContain('成格条件为')
    // 应标记满足的具体条件
    expect(result.analysis).toContain('满足')
    expect(result.analysis).toContain('弃食就煞')
    expect(result.analysis).toContain('故格局成立')
  })

  it('成格(化土格) → 列出化格条件且标记已满足', () => {
    // 2000-01-17 甲己化土, 化气纯粹成格
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const pat = extractPattern(bazi)
    expect(pat.category).toBe('化土格')
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('成格')

    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    expect(result.analysis).toContain('成格条件为')
    expect(result.analysis).toContain('满足')
    expect(result.analysis).toContain('日主合化')
    expect(result.analysis).toContain('化神透干')
    expect(result.analysis).toContain('故格局成立')
  })

  it('不成格(伤官格·伤官不旺) → 列出未满足的条件', () => {
    // 1991-04-12 伤官格, 伤官不旺 → 不成格
    const bazi = calculateBazi(makeInput({ year: 1991, month: 4, day: 12, hour: 9 }))
    const pat = extractPattern(bazi)
    expect(pat.category).toBe('伤官格')
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('不成格')

    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    // 应列出成格条件
    expect(result.analysis).toContain('成格条件为')
    // 应提示有未满足
    expect(result.analysis).toContain('未满足')
    // 应提示大运可补齐
    expect(result.analysis).toContain('大运流年')
  })

  it('破格(食神格·枭神夺食) → 列出破格触发条件', () => {
    // 1991-02-11 食神格, 枭神夺食破格
    const bazi = calculateBazi(makeInput({ year: 1991, month: 2, day: 11, hour: 8 }))
    const pat = extractPattern(bazi)
    expect(pat.category).toBe('食神格')
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('破格')

    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    expect(result.analysis).toContain('格局破败')
    expect(result.analysis).toContain('破格条件')
    expect(result.analysis).toContain('枭神夺食')
  })
})

// ── 关键建议：结合格局+流通 ──

function getKeyAdviceText(result: { analysis: string }): string {
  const marker = '**💡 关键建议**：'
  const idx = result.analysis.indexOf(marker)
  return idx >= 0 ? result.analysis.slice(idx + marker.length) : ''
}

describe('generateAnalysis 关键建议', () => {
  it('食神格+流通堵点(1990-02-16) → 建议含格局特征和淤堵信息', () => {
    // 食神格·弃食就煞而透印, blockage=土, tongGuan=金
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    const pat = extractPattern(bazi)
    expect(pat.category).toBe('食神格')
    const ao = assessOutcome(bazi, pat)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const advice = getKeyAdviceText(result)
    expect(advice).toContain('食神代表创造力与享受')
    expect(advice).toContain('能量在土处淤堵')
    expect(advice).toContain('技术')
  })

  it('正财格+流通顺畅(1982-05-10) → 建议含流通顺畅、无淤堵', () => {
    // 正财格·成格, blockage=null
    const bazi = calculateBazi(makeInput({ year: 1982, month: 5, day: 10, hour: 8 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const advice = getKeyAdviceText(result)
    expect(advice).toContain('财星代表价值与目标')
    expect(advice).toContain('五行流通顺畅')
    expect(advice).not.toContain('淤堵')
  })

  it('正印格+破格+流通顺畅(1980-02-14) → 建议含格局破损提示', () => {
    // 正印格·破格, blockage=null
    const bazi = calculateBazi(makeInput({ year: 1980, month: 2, day: 14, hour: 8 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('破格')
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const advice = getKeyAdviceText(result)
    expect(advice).toContain('印星代表学习与思考')
    expect(advice).toContain('格局破损')
  })

  it('两个同格局不同流通的命局 → 建议有区分', () => {
    // 两个建禄月劫格：一个有堵点(2000-02-07), 一个无堵点(1980-04-15)
    const b1 = calculateBazi(makeInput({ year: 2000, month: 2, day: 7, hour: 8 }))
    const b2 = calculateBazi(makeInput({ year: 1980, month: 4, day: 15, hour: 8 }))

    const p1 = extractPattern(b1)
    const p2 = extractPattern(b2)
    expect(p1.category).toBe('建禄月劫格')
    expect(p2.category).toBe('建禄月劫格')

    const r1 = generateAnalysis({ bazi: b1, pattern: p1, outcome: assessOutcome(b1, p1), strength: determineStrength(b1) })
    const r2 = generateAnalysis({ bazi: b2, pattern: p2, outcome: assessOutcome(b2, p2), strength: determineStrength(b2) })

    const a1 = getKeyAdviceText(r1)
    const a2 = getKeyAdviceText(r2)

    // 格局特征相同
    expect(a1).toContain('建禄月劫代表独立自主')
    expect(a2).toContain('建禄月劫代表独立自主')

    // 一个淤堵，一个顺畅
    expect(a1).toContain('淤堵')
    expect(a2).not.toContain('淤堵')

    // 建议不同
    expect(a1).not.toBe(a2)
  })
})

// ── 关键提醒：所有命局触发 + 融合格局和流通 ──

function getWarningText(result: { analysis: string }): string {
  const marker = '**关键提醒**：'
  const idx = result.analysis.indexOf(marker)
  if (idx < 0) return ''
  const endIdx = result.analysis.indexOf('**💡 关键建议**', idx)
  return endIdx > idx
    ? result.analysis.slice(idx + marker.length, endIdx).trim()
    : result.analysis.slice(idx + marker.length).trim()
}

describe('generateAnalysis 关键提醒（全格局触发）', () => {
  it('成格(食神格·1990-02-16) → 含格局智慧和淤堵信息', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('成格')
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const warning = getWarningText(result)
    expect(warning).toBeTruthy()
    expect(warning).toContain('创造力')
    expect(warning).toContain('淤堵')
    expect(warning).toContain('技术、专业技能')
  })

  it('不成格(伤官格·1991-04-12) → 含格局智慧+不成格提示', () => {
    const bazi = calculateBazi(makeInput({ year: 1991, month: 4, day: 12, hour: 9 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('不成格')
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const warning = getWarningText(result)
    expect(warning).toBeTruthy()
    expect(warning).toContain('才华需要出口')
    expect(warning).toContain('时候未到')
  })

  it('破格(食神格·1991-02-11) → 含格局智慧+破格警示', () => {
    const bazi = calculateBazi(makeInput({ year: 1991, month: 2, day: 11, hour: 8 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    expect(ao.outcome).toBe('破格')
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const warning = getWarningText(result)
    expect(warning).toBeTruthy()
    expect(warning).toContain('创造力')
    expect(warning).toContain('格局破损')
    expect(warning).toContain('韧性')
  })

  it('正财格+流通顺畅(1982-05-10) → 含流畅提醒', () => {
    const bazi = calculateBazi(makeInput({ year: 1982, month: 5, day: 10, hour: 8 }))
    const pat = extractPattern(bazi)
    const ao = assessOutcome(bazi, pat)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const warning = getWarningText(result)
    expect(warning).toBeTruthy()
    expect(warning).toContain('财富')
    expect(warning).toContain('流通顺畅')
    expect(warning).toContain('福气')
  })

  it('化土格(2000-01-17) → 含转变主题', () => {
    const bazi = calculateBazi(makeInput({ year: 2000, month: 1, day: 17 }))
    const pat = extractPattern(bazi)
    expect(pat.category).toBe('化土格')
    const ao = assessOutcome(bazi, pat)
    const strength = determineStrength(bazi)
    const result = generateAnalysis({ bazi, pattern: pat, outcome: ao, strength })

    const warning = getWarningText(result)
    expect(warning).toBeTruthy()
    expect(warning).toContain('转变')
  })
})

// ── 神煞查表：getAllShenSha ──

describe('getAllShenSha', () => {
  it('返回数组，每条记录包含必要字段', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    const result = getAllShenSha(bazi)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    for (const s of result) {
      expect(s.name).toBeTruthy()
      expect(['贵人', '凶星', '泛星']).toContain(s.category)
      expect(['年柱', '月柱', '日柱', '时柱']).toContain(s.pillar)
      expect(s.description).toBeTruthy()
      expect(s.basis).toMatch(/渊海子平|三命通会|季节法|纳音法/)
    }
  })

  it('按柱位排序（年→月→日→时）', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    const result = getAllShenSha(bazi)
    const order: Record<string, number> = { '年柱': 0, '月柱': 1, '日柱': 2, '时柱': 3 }
    for (let i = 1; i < result.length; i++) {
      expect(order[result[i - 1].pillar]).toBeLessThanOrEqual(order[result[i].pillar])
    }
  })

  it('天乙贵人：甲日主(2023-07-15) → 天乙在月柱未', () => {
    // 甲日主, 天乙在丑/未。月柱己未 → 未=天乙
    const bazi = calculateBazi(makeInput({ year: 2023, month: 7, day: 15, hour: 8 }))
    expect(bazi.dayMaster).toBe('甲')
    expect(bazi.pillars.month.branch).toBe('未')
    const result = getAllShenSha(bazi)
    const tianYi = result.filter((s) => s.name === '天乙贵人')
    expect(tianYi.length).toBeGreaterThanOrEqual(1)
    expect(tianYi.some((s) => s.pillar === '月柱')).toBe(true)
  })

  it('文昌贵人：庚日主(2026-07-15 22时) → 文昌在亥，时柱见之', () => {
    // 庚日主, 文昌在亥。时柱地支为亥。
    const bazi = calculateBazi(makeInput({ year: 2026, month: 7, day: 15, hour: 22 }))
    expect(bazi.dayMaster).toBe('庚')
    expect(bazi.pillars.hour.branch).toBe('亥')
    const result = getAllShenSha(bazi)
    const wenChang = result.filter((s) => s.name === '文昌贵人')
    expect(wenChang.length).toBeGreaterThanOrEqual(1)
    expect(wenChang.some((s) => s.pillar === '时柱')).toBe(true)
  })

  it('桃花：申子辰年(2024甲辰) → 桃花在酉', () => {
    // 年支辰 → 桃花在酉。月柱地支为酉。
    const bazi = calculateBazi(makeInput({ year: 2024, month: 9, day: 15, hour: 8 }))
    expect(bazi.pillars.year.branch).toBe('辰')
    expect(bazi.pillars.month.branch).toBe('酉')
    const result = getAllShenSha(bazi)
    const taoHua = result.filter((s) => s.name === '桃花')
    expect(taoHua.length).toBeGreaterThanOrEqual(1)
    expect(taoHua.some((s) => s.pillar === '月柱')).toBe(true)
  })

  it('驿马：2019-02-05 → 年柱见驿马', () => {
    // 年支亥, 日支酉 → 驿马(y)=巳, 驿马(d)=亥。年柱=亥 → 驿马在年柱
    const bazi = calculateBazi(makeInput({ year: 2019, month: 2, day: 5, hour: 8 }))
    expect(bazi.pillars.year.branch).toBe('亥')
    const result = getAllShenSha(bazi)
    const yiMa = result.filter((s) => s.name === '驿马')
    expect(yiMa.length).toBeGreaterThanOrEqual(1)
    expect(yiMa.some((s) => s.pillar === '年柱')).toBe(true)
  })

  it('华盖：亥卯未年(2023癸卯) → 华盖在未', () => {
    // 年支卯 → 华盖在未。月柱己未。
    const bazi = calculateBazi(makeInput({ year: 2023, month: 7, day: 15, hour: 8 }))
    expect(bazi.pillars.year.branch).toBe('卯')
    expect(bazi.pillars.month.branch).toBe('未')
    const result = getAllShenSha(bazi)
    const huaGai = result.filter((s) => s.name === '华盖')
    expect(huaGai.length).toBeGreaterThanOrEqual(1)
    expect(huaGai.some((s) => s.pillar === '月柱')).toBe(true)
  })

  it('羊刃：壬日主 → 羊刃在子', () => {
    // 1990-02-16 壬子日 → 羊刃在日柱
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    expect(bazi.dayMaster).toBe('壬')
    const result = getAllShenSha(bazi)
    const yangRen = result.filter((s) => s.name === '羊刃')
    expect(yangRen.length).toBeGreaterThanOrEqual(1)
    expect(yangRen.some((s) => s.pillar === '日柱')).toBe(true)
  })

  it('孤鸾煞：壬子日 → 命中孤鸾', () => {
    const bazi = calculateBazi(makeInput({ year: 1990, month: 2, day: 16, hour: 8 }))
    expect(bazi.dayMaster + bazi.pillars.day.branch).toBe('壬子')
    const result = getAllShenSha(bazi)
    const guLuan = result.find((s) => s.name === '孤鸾煞')
    expect(guLuan).toBeTruthy()
    expect(guLuan!.pillar).toBe('日柱')
  })
})

