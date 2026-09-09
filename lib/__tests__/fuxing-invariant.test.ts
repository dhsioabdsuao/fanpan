// 副星(藏干十神)展示不变量守护
//
// 副星 = 每柱地支藏干对应的十神(主星 = 天干十神)。
// Web 的 FuXingBlock 直接按序配对 pillars[key].hiddenStems 与
// tenGods[keyBranch](lib/bazi.ts 按 map 构造保证逐位对应)。
// 本测试锁定该不变量与具体对应值,防止未来 tenGods 结构变化
// 悄悄破坏展示(UI 为纯展示,无 lib 逻辑改动,故只需不变量测试)。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'

// 金标准命例输入(与 bazi.golden.test.ts 对齐:庚辰 壬午 甲辰 庚午,日主甲)
const INPUT = {
  year: 2000,
  month: 6,
  day: 15,
  hour: 12,
  minute: 0,
  gender: 'male' as const,
  isLunar: false,
}

describe('副星(藏干十神)展示不变量', () => {
  const bazi = calculateBazi(INPUT)

  it('每柱 branch 十神数组与藏干数组长度一致(逐位对应)', () => {
    for (const key of ['year', 'month', 'day', 'hour'] as const) {
      const stems = bazi.pillars[key].hiddenStems
      const gods = bazi.tenGods[`${key}Branch`]
      expect(gods.length).toBe(stems.length)
    }
  })

  it('具体对应值正确(日主甲,命例庚辰 壬午 甲辰 庚午:辰→戊偏财/乙劫财/癸正印,午→丁伤官/己正财)', () => {
    expect(bazi.tenGods.yearBranch).toEqual(['偏财', '劫财', '正印']) // 年支辰
    expect(bazi.tenGods.monthBranch).toEqual(['伤官', '正财']) // 月支午
    expect(bazi.tenGods.dayBranch).toEqual(['偏财', '劫财', '正印']) // 日支辰
    expect(bazi.tenGods.hourBranch).toEqual(['伤官', '正财']) // 时支午
  })

  it('藏干本身与金标准一致(辰:戊乙癸,午:丁己)', () => {
    expect(bazi.pillars.year.hiddenStems).toEqual(['戊', '乙', '癸'])
    expect(bazi.pillars.month.hiddenStems).toEqual(['丁', '己'])
  })
})
