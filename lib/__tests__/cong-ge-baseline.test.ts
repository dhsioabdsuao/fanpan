// ─────────────────────────────────────────────────────────────
// S0 基线锁定:从格/化格命盘的完整状态
//
// 目的:记录 8 张命盘在当前代码(commit ac2eab2)下的完整判定状态——
// 四柱、从格判定、强弱、取格路由(含化格遮蔽从格的情形)、成败。
// S2(强弱重写+从格解耦)与 S3(取格/成败体检)的改动必须以本文件为对照:
// 每处期望值的改动都必须经过人工确认后有意为之,不得静默翻转。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import type { BaziInput } from '@/types/bazi'
import { extractPattern } from '../bage/extractPattern'
import { assessOutcome } from '../bage/assessOutcome'
import { determineStrength } from '../strength/determineStrength'
import { isCongSha, isCongCai } from '../bage/congGe'

interface BaselineCase {
  tag: string
  input: Partial<BaziInput>
  pillars: string          // '年干年支 月干月支 日干日支 时干时支'
  congSha: string | null   // isCongSha 返回的格局名
  congCai: string | null   // isCongCai 返回的格局名
  pattern: string          // extractPattern 最终路由的格局
  outcome: '成格' | '不成格' | '破格'
  strength: '身强' | '中和' | '身弱'
}

const CASES: BaselineCase[] = [
  {
    // 既有测试:真从杀格,三透七杀,巳酉丑合金局
    tag: '真从杀(2002-01-17)',
    input: { year: 2002, month: 1, day: 17, hour: 10 },
    pillars: '辛巳 辛丑 乙酉 辛巳',
    congSha: '从杀格', congCai: null,
    pattern: '从杀格', outcome: '成格', strength: '身弱',
  },
  {
    // 既有测试:壬癸印星虚浮无根,仍判真从杀(0.598 悬线命盘,S2 重点对照)
    tag: '真从杀·印虚浮(2003-01-12)',
    input: { year: 2003, month: 1, day: 12, hour: 10 },
    pillars: '壬午 癸丑 乙酉 辛巳',
    congSha: '从杀格', congCai: null,
    pattern: '从杀格', outcome: '成格', strength: '身弱',
  },
  {
    // 既有测试:假从财(印星有根)
    tag: '假从财·印有根(2005-05-09)',
    input: { year: 2005, month: 5, day: 9, hour: 10 },
    pillars: '乙酉 辛巳 癸巳 丁巳',
    congSha: null, congCai: null,
    pattern: '财格', outcome: '成格', strength: '身弱',
  },
  {
    // 既有测试名"假从财",实际当前代码判 isCongSha=从杀格,路由被化火格遮蔽
    tag: '假从财·实为从杀(2018-06-20)',
    input: { year: 2018, month: 6, day: 20, hour: 10 },
    pillars: '戊戌 戊午 癸未 丁巳',
    congSha: '从杀格', congCai: null,
    pattern: '化火格', outcome: '成格', strength: '身弱',
  },
  {
    // S0 新扫描:从财格成立且路由为从财格
    tag: '从财(1992-08-08)',
    input: { year: 1992, month: 8, day: 8, hour: 6 },
    pillars: '壬申 戊申 丙辰 辛卯',
    congSha: null, congCai: '从财格',
    pattern: '从财格', outcome: '成格', strength: '身弱',
  },
  {
    // S0 新扫描:从财判定成立,但被化火格遮蔽(化格优先级高于从格)
    tag: '从财·被化火遮蔽(1994-03-08)',
    input: { year: 1994, month: 3, day: 8, hour: 12 },
    pillars: '甲戌 丁卯 癸巳 戊午',
    congSha: null, congCai: '从财格',
    pattern: '化火格', outcome: '成格', strength: '身弱',
  },
  {
    // S0 新扫描:从杀判定成立,但被化金格遮蔽
    tag: '从杀·被化金遮蔽(1993-09-01)',
    input: { year: 1993, month: 9, day: 1, hour: 12 },
    pillars: '癸酉 庚申 乙酉 壬午',
    congSha: '从杀格', congCai: null,
    pattern: '化金格', outcome: '成格', strength: '身弱',
  },
  {
    // S0 新扫描:从杀格成立且路由为从杀格
    tag: '从杀(2008-08-15)',
    input: { year: 2008, month: 8, day: 15, hour: 6 },
    pillars: '戊子 庚申 丁亥 癸卯',
    congSha: '从杀格', congCai: null,
    pattern: '从杀格', outcome: '成格', strength: '身弱',
  },
]

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return { year: 2000, month: 6, day: 15, hour: 10, minute: 0, gender: 'male', isLunar: false, ...overrides }
}

function pillarsOf(bazi: ReturnType<typeof calculateBazi>): string {
  const p = bazi.pillars
  return `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour.stem}${p.hour.branch}`
}

describe('S0 基线锁定:从格/化格命盘完整状态', () => {
  for (const c of CASES) {
    it(`${c.tag} → 四柱=${c.pillars}, 路由=${c.pattern}, ${c.outcome}, ${c.strength}`, () => {
      const bazi = calculateBazi(makeInput(c.input))

      // 1. 四柱精确锁定(排盘层回归,任何排盘变化先在此暴露)
      expect(pillarsOf(bazi)).toBe(c.pillars)

      // 2. 从格判定(单元层,S2 解耦后此处期望必须经确认后有意修改)
      const sha = isCongSha(bazi)
      expect(sha?.name ?? null).toBe(c.congSha)
      const cai = isCongCai(bazi)
      expect(cai?.name ?? null).toBe(c.congCai)

      // 3. 强弱(S2 加模糊带后,身弱/中和边界可能有意变化)
      const str = determineStrength(bazi)
      expect(str.level).toBe(c.strength)

      // 4. 取格路由(化格>从格>化刃为印>八格 级联的最终结果)
      const pat = extractPattern(bazi)
      expect(pat.category).toBe(c.pattern)

      // 5. 成败
      const ao = assessOutcome(bazi, pat)
      expect(ao.outcome).toBe(c.outcome)
    })
  }
})
