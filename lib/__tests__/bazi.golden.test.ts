// ─────────────────────────────────────────────────────────────
// S1 排盘层金标准(独立预言机验证)
//
// 期望四柱不来自 lunar-typescript,而是由本文件内的独立预言机生成:
//   日柱:儒略日(JDN)推干支,锚点 2000-01-01 = 戊午日(JDN 2451545),
//        该锚点经多方万年历确认,并与既有 5 个三方验证命盘交叉核对;
//   年柱:立春分界(2000 年用已公布时刻 20:40);
//   月柱:节气分界(小寒/立春精确时刻)+ 五虎遁;
//   时柱:五鼠遁,晚子时(23 点)日柱进位次日(应用流派选择)。
// 若 calculateBazi 与预言机不一致,即为排盘 bug,必须修复。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'

// ═══ 独立预言机 ═══

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function jdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

/** 日干支索引:2000-01-01 = 戊午 = 54(甲子 = 0) */
function dayIdx(y: number, m: number, d: number): number {
  return (((jdn(y, m, d) - 2451545 + 54) % 60) + 60) % 60
}

/** 年干支索引:立春分界。2000 立春 = 02-04 20:40(已公布);其余年份样例距 2 月 4 日 ≥11 天 */
function yearIdx(y: number, m: number, d: number, h: number, mi: number): number {
  const liChun = y === 2000 ? new Date(2000, 1, 4, 20, 40) : new Date(y, 1, 4, 16, 0)
  const gy = new Date(y, m - 1, d, h, mi) < liChun ? y - 1 : y
  return (((gy - 4) % 60) + 60) % 60
}

/** 月支索引:节气分界。小寒 2000-01-06 07:33 / 2024-01-06 04:49 */
function monthBranchIdx(y: number, m: number, d: number, h: number, mi: number): number {
  const t = new Date(y, m - 1, d, h, mi)
  const xiaoHan = new Date(y, 0, 6, 5, 0)
  if (m === 1 && t < xiaoHan) return 0 // 子月
  const liChun = y === 2000 ? new Date(2000, 1, 4, 20, 40) : new Date(y, 1, 4, 16, 0)
  if (m === 2 && t < liChun) return 1 // 丑月
  return m % 12
}

/** 五虎遁:甲己之年丙作首 */
function monthStemIdx(yearStemIdx: number, branchIdx: number): number {
  return ((yearStemIdx % 5) * 2 + 2 + (((branchIdx - 2) % 12) + 12) % 12) % 10
}

/** 五鼠遁:甲己还加甲。晚子时(23 点)日柱进位次日 */
function hourGZ(dIdx: number, hour: number): { stem: string; branch: string; usedDayIdx: number } {
  let didx = dIdx
  let hidx: number
  if (hour === 23) { didx = (didx + 1) % 60; hidx = 0 }
  else hidx = ((hour + 1) >> 1) % 12
  const hs = ((didx % 10 % 5) * 2 + hidx) % 10
  return { stem: GAN[hs], branch: ZHI[hidx], usedDayIdx: didx }
}

function oracleChart(y: number, m: number, d: number, h: number, mi: number): string {
  const yi = yearIdx(y, m, d, h, mi)
  const mb = monthBranchIdx(y, m, d, h, mi)
  const ms = monthStemIdx(yi % 10, mb)
  const di = dayIdx(y, m, d)
  const hz = hourGZ(di, h)
  return [
    GAN[yi % 10] + ZHI[yi % 12],
    GAN[ms] + ZHI[mb],
    GAN[hz.usedDayIdx % 10] + ZHI[hz.usedDayIdx % 12],
    hz.stem + hz.branch,
  ].join(' ')
}

// ═══ 金标准样例 ═══

interface PillarGolden {
  label: string
  input: { year: number; month: number; day: number; hour: number; minute: number }
  expected: string // '年 月 日 时'
}

const PILLAR_GOLDENS: PillarGolden[] = [
  // 12 个月月柱矩阵:每月 15 日 12:00,月支寅→卯→…→丑 全序列覆盖
  { label: '2000-01-15(丑月)', input: { year: 2000, month: 1, day: 15, hour: 12, minute: 0 }, expected: '己卯 丁丑 壬申 丙午' },
  { label: '2000-02-15(寅月)', input: { year: 2000, month: 2, day: 15, hour: 12, minute: 0 }, expected: '庚辰 戊寅 癸卯 戊午' },
  { label: '2000-03-15(卯月)', input: { year: 2000, month: 3, day: 15, hour: 12, minute: 0 }, expected: '庚辰 己卯 壬申 丙午' },
  { label: '2000-04-15(辰月)', input: { year: 2000, month: 4, day: 15, hour: 12, minute: 0 }, expected: '庚辰 庚辰 癸卯 戊午' },
  { label: '2000-05-15(巳月)', input: { year: 2000, month: 5, day: 15, hour: 12, minute: 0 }, expected: '庚辰 辛巳 癸酉 戊午' },
  { label: '2000-06-15(午月)', input: { year: 2000, month: 6, day: 15, hour: 12, minute: 0 }, expected: '庚辰 壬午 甲辰 庚午' },
  { label: '2000-07-15(未月)', input: { year: 2000, month: 7, day: 15, hour: 12, minute: 0 }, expected: '庚辰 癸未 甲戌 庚午' },
  { label: '2000-08-15(申月)', input: { year: 2000, month: 8, day: 15, hour: 12, minute: 0 }, expected: '庚辰 甲申 乙巳 壬午' },
  { label: '2000-09-15(酉月)', input: { year: 2000, month: 9, day: 15, hour: 12, minute: 0 }, expected: '庚辰 乙酉 丙子 甲午' },
  { label: '2000-10-15(戌月)', input: { year: 2000, month: 10, day: 15, hour: 12, minute: 0 }, expected: '庚辰 丙戌 丙午 甲午' },
  { label: '2000-11-15(亥月)', input: { year: 2000, month: 11, day: 15, hour: 12, minute: 0 }, expected: '庚辰 丁亥 丁丑 丙午' },
  { label: '2000-12-15(子月)', input: { year: 2000, month: 12, day: 15, hour: 12, minute: 0 }, expected: '庚辰 戊子 丁未 丙午' },
  // 立春边界(2000-02-04 20:40 前后):年柱/月柱同时换
  { label: '立春前 2000-02-04 12:00', input: { year: 2000, month: 2, day: 4, hour: 12, minute: 0 }, expected: '己卯 丁丑 壬辰 丙午' },
  { label: '立春后 2000-02-05 12:00', input: { year: 2000, month: 2, day: 5, hour: 12, minute: 0 }, expected: '庚辰 戊寅 癸巳 戊午' },
  // 小寒边界(1 月初仍为子月)
  { label: '小寒前 2000-01-01 12:00', input: { year: 2000, month: 1, day: 1, hour: 12, minute: 0 }, expected: '己卯 丙子 戊午 戊午' },
  { label: '小寒前 2024-01-01 12:00', input: { year: 2024, month: 1, day: 1, hour: 12, minute: 0 }, expected: '癸卯 甲子 甲子 庚午' },
  // 晚子时:23:30 日柱进位次日,时柱由次日干起子时
  { label: '晚子时 2000-06-15 23:30', input: { year: 2000, month: 6, day: 15, hour: 23, minute: 30 }, expected: '庚辰 壬午 乙巳 丙子' },
  { label: '早子时 2000-06-15 00:30', input: { year: 2000, month: 6, day: 15, hour: 0, minute: 30 }, expected: '庚辰 壬午 甲辰 甲子' },
  { label: '早子时 2000-06-16 00:30', input: { year: 2000, month: 6, day: 16, hour: 0, minute: 30 }, expected: '庚辰 壬午 乙巳 丙子' },
  // 跨年代:不同年份锚点(1952/1977/1990/2003/2024)
  { label: '1952-03-15', input: { year: 1952, month: 3, day: 15, hour: 12, minute: 0 }, expected: '壬辰 癸卯 庚申 壬午' },
  { label: '1977-09-15', input: { year: 1977, month: 9, day: 15, hour: 12, minute: 0 }, expected: '丁巳 己酉 乙亥 壬午' },
  { label: '1990-01-15', input: { year: 1990, month: 1, day: 15, hour: 12, minute: 0 }, expected: '己巳 丁丑 庚辰 壬午' },
  { label: '2003-11-15', input: { year: 2003, month: 11, day: 15, hour: 12, minute: 0 }, expected: '癸未 癸亥 壬辰 丙午' },
  { label: '2024-02-15', input: { year: 2024, month: 2, day: 15, hour: 12, minute: 0 }, expected: '甲辰 丙寅 己酉 庚午' },
  { label: '2024-12-15', input: { year: 2024, month: 12, day: 15, hour: 12, minute: 0 }, expected: '甲辰 丙子 癸丑 戊午' },
]

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return { year: 2000, month: 6, day: 15, hour: 10, minute: 0, gender: 'male', isLunar: false, ...overrides }
}

function pillarsOf(result: ReturnType<typeof calculateBazi>): string {
  const p = result.pillars
  return `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour.stem}${p.hour.branch}`
}

describe('S1 排盘金标准(独立预言机)', () => {
  it('预言机自检:复现全部硬编码期望', () => {
    for (const c of PILLAR_GOLDENS) {
      const got = oracleChart(c.input.year, c.input.month, c.input.day, c.input.hour, c.input.minute)
      expect(got, `${c.label} 预言机与硬编码期望不一致`).toBe(c.expected)
    }
  })

  for (const c of PILLAR_GOLDENS) {
    it(`${c.label} → ${c.expected}`, () => {
      const result = calculateBazi(makeInput(c.input))
      expect(pillarsOf(result)).toBe(c.expected)
    })
  }
})

// ═══ 大运结构断言(方向/首柱由干支序独立推导,不依赖节气精确时刻) ═══

describe('S1 大运方向与首柱(独立推导)', () => {
  // 阳年男顺行、阴年男逆行、阳年女逆行、阴年女顺行
  const CASES: { label: string; input: Partial<BaziInput>; isForward: boolean; firstDecade: string }[] = [
    { label: '阳年男·顺行(2000-06-15 庚辰)', input: { year: 2000, month: 6, day: 15, hour: 10, gender: 'male' }, isForward: true, firstDecade: '癸未' }, // 月柱壬午 → 下一柱
    { label: '阳年女·逆行(2010-12-25 庚寅)', input: { year: 2010, month: 12, day: 25, hour: 16, gender: 'female' }, isForward: false, firstDecade: '丁亥' }, // 月柱戊子 → 上一柱
    { label: '阴年男·逆行(1985-08-20 乙丑)', input: { year: 1985, month: 8, day: 20, hour: 8, gender: 'male' }, isForward: false, firstDecade: '癸未' }, // 月柱甲申 → 上一柱
    { label: '阴年女·顺行(2003-11-15 癸未)', input: { year: 2003, month: 11, day: 15, hour: 12, gender: 'female' }, isForward: true, firstDecade: '甲子' }, // 月柱癸亥 → 下一柱
    { label: '阴年男·逆行(2024-01-01 癸卯)', input: { year: 2024, month: 1, day: 1, hour: 12, gender: 'male' }, isForward: false, firstDecade: '癸亥' }, // 月柱甲子 → 上一柱
    { label: '阳年男·顺行(1990-06-15 庚午)', input: { year: 1990, month: 6, day: 15, hour: 14, minute: 30, gender: 'male' }, isForward: true, firstDecade: '癸未' }, // 月柱壬午 → 下一柱
  ]

  for (const c of CASES) {
    it(c.label, () => {
      const result = calculateBazi(makeInput(c.input))
      const daYun = result.daYun
      expect(daYun).toBeDefined()
      expect(daYun!.isForward).toBe(c.isForward)

      const decades = daYun!.decades
      expect(decades.length).toBeGreaterThanOrEqual(8)
      expect(decades[0].ganZhi).toBe(c.firstDecade)

      // 起运年龄在 0-10 岁之间(顺行:距下一节气 ≤30 天/3;逆行同理)
      expect(decades[0].startAge).toBeGreaterThanOrEqual(0)
      expect(decades[0].startAge).toBeLessThan(10)

      // 大运干支连续:每步与上一步相差一柱,且首柱之后连续 60 甲子序
      const seq = decades.map((d) => d.ganZhi)
      for (let i = 1; i < seq.length; i++) {
        const prev = seq[i - 1]
        const cur = seq[i]
        const step = c.isForward ? 1 : -1
        const expectIdx = (((indexOfGZ(prev) + step) % 60) + 60) % 60
        expect(indexOfGZ(cur), `${prev} → ${cur} 应相差一柱`).toBe(expectIdx)
      }
    })
  }
})

function indexOfGZ(gz: string): number {
  const s = GAN.indexOf(gz[0])
  const b = ZHI.indexOf(gz[1])
  for (let i = 0; i < 60; i++) {
    if (i % 10 === s && i % 12 === b) return i
  }
  return -1
}
