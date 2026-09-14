import { describe, expect, it } from 'vitest'
import { buildDaYunTableData, yearGanZhi } from '../dayunExpand'
import type { PostDraft } from '../types'

describe('yearGanZhi(60 甲子,1984=甲子锚点)', () => {
  const cases: [number, string][] = [
    [1984, '甲子'],
    [2026, '丙午'],
    [2000, '庚辰'],
    [2008, '戊子'],
    [1949, '己丑'],
    [2043, '癸亥'],
    [1983, '癸亥'],
  ]
  it.each(cases)('%d → %s', (year, gz) => {
    expect(yearGanZhi(year)).toBe(gz)
  })

  it('60 年一循环', () => {
    expect(yearGanZhi(1984)).toBe(yearGanZhi(2044))
    expect(yearGanZhi(2026)).toBe(yearGanZhi(1966))
  })
})

// 四柱:庚辰(年) 甲申(月) 戊午(日) 己未(时)
// 2004=甲申(伏吟月柱)、2005=乙酉(与年柱庚辰天合地合:乙庚合、酉辰合)
const draft: PostDraft = {
  gender: 'male',
  baziBrief: '庚辰 甲申 戊午 己未',
  pillars: {
    year: { stem: '庚', branch: '辰', stemElement: '金', branchElement: '土', hiddenStems: ['戊', '乙', '癸'], tenGod: '偏财', naYin: '白蜡金' },
    month: { stem: '甲', branch: '申', stemElement: '木', branchElement: '金', hiddenStems: ['庚', '壬', '戊'], tenGod: '七杀', naYin: '泉中水' },
    day: { stem: '戊', branch: '午', stemElement: '土', branchElement: '火', hiddenStems: ['丁', '己'], tenGod: null, naYin: '天上火' },
    hour: { stem: '己', branch: '未', stemElement: '土', branchElement: '土', hiddenStems: ['己', '丁', '乙'], tenGod: '劫财', naYin: '天上火' },
  },
  dayMaster: '戊',
  dayMasterElement: '土',
  pattern: { displayName: '正印格', outcome: '成格', summary: '摘要' },
  strength: { level: '中和' },
  xiYong: { favorable: ['火', '土'], avoid: ['水'], yongShenTenGod: null },
  shensha: [],
  daYun: {
    startSolar: { year: 1997, month: 4, day: 5 },
    isForward: false,
    decades: [
      { startYear: 2004, startAge: 3, ganZhi: '丙寅' },
      { startYear: 2024, startAge: 23, ganZhi: '甲子' },
    ],
  },
}

describe('buildDaYunTableData', () => {
  it('无大运信息返回 null', () => {
    expect(buildDaYunTableData({ ...draft, daYun: null })).toBeNull()
  })

  it('起运信息与日主透传', () => {
    const data = buildDaYunTableData(draft)!
    expect(data.startSolar).toEqual({ year: 1997, month: 4, day: 5 })
    expect(data.isForward).toBe(false)
    expect(data.dayMaster).toBe('戊')
  })

  it('每个大运十年补全:起止年份/虚岁、旬空、10 个流年', () => {
    const data = buildDaYunTableData(draft)!
    expect(data.decades).toHaveLength(2)

    const first = data.decades[0]
    expect(first.index).toBe(0)
    expect(first.startYear).toBe(2004)
    expect(first.endYear).toBe(2013)
    expect(first.startAge).toBe(3)
    expect(first.endAge).toBe(12)
    expect(first.xunKong).toBe('戌亥') // 丙寅在甲子旬
    expect(first.liuNian).toHaveLength(10)
    expect(first.liuNian[0]).toMatchObject({ year: 2004, age: 3, ganZhi: '甲申' })
    expect(first.liuNian[9]).toMatchObject({ year: 2013, age: 12, ganZhi: '癸巳' })

    const second = data.decades[1]
    expect(second.xunKong).toBe('戌亥') // 甲子在甲子旬
    expect(second.liuNian[0]).toMatchObject({ year: 2024, age: 23, ganZhi: '甲辰' })
  })

  it('流年干支与 yearGanZhi 逐位一致', () => {
    const data = buildDaYunTableData(draft)!
    for (const d of data.decades) {
      for (const ln of d.liuNian) {
        expect(ln.ganZhi).toBe(yearGanZhi(ln.year))
      }
    }
  })

  it('流年注解结构化断言:伏吟、天合地合、岁运并临', () => {
    const data = buildDaYunTableData(draft)!
    const first = data.decades[0]
    // 2004 甲申 = 月柱甲申 → 伏吟
    const fuYin = first.liuNian.find((ln) => ln.year === 2004)!.annotations
    expect(fuYin.some((a) => a.type === '伏吟')).toBe(true)
    // 2005 乙酉:乙庚合、酉辰合 → 与年柱庚辰天合地合
    const he = first.liuNian.find((ln) => ln.year === 2005)!.annotations
    expect(he.some((a) => a.type === '天合地合')).toBe(true)
    // 2024 甲辰 = 大运甲子?否 → 无岁运并临;2024 大运为甲子,流年甲辰
    const second = data.decades[1]
    expect(second.liuNian[0].annotations.some((a) => a.type === '岁运并临')).toBe(false)
  })

  it('不改动入参(纯函数)', () => {
    const snapshot = JSON.parse(JSON.stringify(draft))
    buildDaYunTableData(draft)
    expect(draft).toEqual(snapshot)
  })

  it('时柱为 null 时安全(无崩溃、其余注解照常)', () => {
    const noHour: PostDraft = { ...draft, pillars: { ...draft.pillars, hour: null } }
    const data = buildDaYunTableData(noHour)!
    const fuYin = data.decades[0].liuNian.find((ln) => ln.year === 2004)!.annotations
    expect(fuYin.some((a) => a.type === '伏吟')).toBe(true)
  })
})
