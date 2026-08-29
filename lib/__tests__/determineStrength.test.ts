// ─────────────────────────────────────────────────────────────
// S2 强弱判定测试(强弱规格书 v1.1)
//
// 期望值全部手工推导:权重表见 lib/strength/determineStrength.ts
// (旺相休囚死分值 3/2/1/0.5/0;天干权重 1.0/1.5/1.0;地支位置权重
//  0.5/0.8/1.0/0.6 × 藏干深浅 1.0/0.6/0.3;合会局三会+3/三合+2,帮扶×1.5;
//  得势 ±20%;比值阈值 0.6/1.3/1.5,模糊带 ±0.05)。
// 模糊带命盘经随机搜索获得,预期值下方标注"旧规则结论"以证明模糊带生效。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { buildChartFromPillars } from './testChart'
import { determineStrength } from '../strength/determineStrength'
import { isCongSha } from '../bage/congGe'

interface StrengthCase {
  label: string
  pillars: [string, string, string, string]
  level: '身强' | '中和' | '身弱'
  deLing?: boolean
  deDi?: boolean
  deShi?: '得势' | '失势' | '均衡'
}

// ═══ 12 个月月令矩阵:甲木日主,四支同月支,天干全乙(劫财) ═══
// 得令=季节旺相休囚死:春旺/冬相 → 得令;夏休/秋死 → 失令
// 得地=甲木之根:寅(禄)卯(旺)亥(长生)为强根;辰巳午未申酉戌子丑无根
const MONTH_MATRIX: StrengthCase[] = [
  { label: '甲木寅月(春旺+禄根+得势)', pillars: ['乙寅', '乙寅', '甲寅', '乙寅'], level: '身强', deLing: true, deDi: true, deShi: '得势' },
  { label: '甲木卯月(春旺+帝旺根+得势)', pillars: ['乙卯', '乙卯', '甲卯', '乙卯'], level: '身强', deLing: true, deDi: true, deShi: '得势' },
  { label: '甲木辰月(春旺+无根+得势→得令得势)', pillars: ['乙辰', '乙辰', '甲辰', '乙辰'], level: '身强', deLing: true, deDi: false, deShi: '得势' },
  { label: '甲木巳月(夏休+无根+失势→三不帮)', pillars: ['乙巳', '乙巳', '甲巳', '乙巳'], level: '身弱', deLing: false, deDi: false, deShi: '失势' },
  { label: '甲木午月(夏休+无根+失势→三不帮)', pillars: ['乙午', '乙午', '甲午', '乙午'], level: '身弱', deLing: false, deDi: false, deShi: '失势' },
  { label: '甲木未月(夏休+无根+均衡→身弱)', pillars: ['乙未', '乙未', '甲未', '乙未'], level: '身弱', deLing: false, deDi: false, deShi: '均衡' },
  { label: '甲木申月(秋死+无根+得势→身弱)', pillars: ['乙申', '乙申', '甲申', '乙申'], level: '身弱', deLing: false, deDi: false, deShi: '得势' },
  { label: '甲木酉月(秋死+无根+得势→身弱)', pillars: ['乙酉', '乙酉', '甲酉', '乙酉'], level: '身弱', deLing: false, deDi: false, deShi: '得势' },
  { label: '甲木戌月(秋死+无根+失势→三不帮)', pillars: ['乙戌', '乙戌', '甲戌', '乙戌'], level: '身弱', deLing: false, deDi: false, deShi: '失势' },
  { label: '甲木亥月(冬相+长生根+得势→三全帮)', pillars: ['乙亥', '乙亥', '甲亥', '乙亥'], level: '身强', deLing: true, deDi: true, deShi: '得势' },
  { label: '甲木子月(冬相+无根+得势→得令得势)', pillars: ['乙子', '乙子', '甲子', '乙子'], level: '身强', deLing: true, deDi: false, deShi: '得势' },
  { label: '甲木丑月(冬相+无根+得势→得令得势)', pillars: ['乙丑', '乙丑', '甲丑', '乙丑'], level: '身强', deLing: true, deDi: false, deShi: '得势' },
]

// ═══ 模糊带窗口:旧规则判强/弱、新规则归中和 ═══
const BAND_CASES: StrengthCase[] = [
  {
    // 得令(冬木相)+得地(申中壬? 否——甲无根? 实际:deLing=true/deDi=true/失势)
    // 比值 3.9/6.4 = 0.609 ∈ [0.6, 0.65) → 旧规则身强,新规则中和
    // 注:申子辰三合水局(正官)计入克泄耗
    label: '模糊带·得令得地比值0.609(旧:身强)',
    pillars: ['戊子', '丁亥', '甲申', '甲辰'],
    level: '中和', deLing: true, deDi: true, deShi: '失势',
  },
  {
    // 失令+失地,比值 5.2/3.5 = 1.486 ∈ (1.45, 1.5] → 旧规则身弱,新规则中和
    label: '模糊带·失令失地比值1.486(旧:身弱)',
    pillars: ['壬戌', '癸午', '癸丑', '壬丑'],
    level: '中和', deLing: false, deDi: false, deShi: '得势',
  },
  {
    // 失令+得地+得势,比值 4.5/3.4 = 1.324 ∈ [1.3, 1.35) → 旧规则身强,新规则中和
    label: '模糊带·得地得势比值1.324(旧:身强)',
    pillars: ['辛辰', '庚辰', '癸子', '甲亥'],
    level: '中和', deLing: false, deDi: true, deShi: '得势',
  },
  {
    // 兜底分支,比值 3.1/5.2 = 0.596 ∈ (0.55, 0.6] → 旧规则身弱,新规则中和
    label: '模糊带·兜底比值0.596(旧:身弱)',
    pillars: ['丁未', '戊子', '辛巳', '壬寅'],
    level: '中和', deLing: false, deDi: true, deShi: '失势',
  },
]

// ═══ 常规分支 ═══
const NORMAL_CASES: StrengthCase[] = [
  {
    // 得令+得地,比值 4.1/4.7 = 0.872 ≥ 0.65 → 身强
    label: '得令得地比值0.872 → 身强',
    pillars: ['癸亥', '庚未', '己巳', '己寅'],
    level: '身强', deLing: true, deDi: true, deShi: '均衡',
  },
  {
    // 失令+得地+得势,比值 5.8/2.5 = 2.32 ≥ 1.35 → 身强
    label: '失令得地得势比值2.32 → 身强',
    pillars: ['辛未', '己子', '庚丑', '辛巳'],
    level: '身强', deLing: false, deDi: true, deShi: '得势',
  },
  {
    // 三要素全帮(春木旺+禄根+全比劫)
    label: '三要素全帮 → 身强',
    pillars: ['甲寅', '甲寅', '甲寅', '甲寅'],
    level: '身强', deLing: true, deDi: true, deShi: '得势',
  },
  {
    // 三要素全不帮(秋木死+无根+全七杀)
    label: '三要素全不帮 → 身弱',
    pillars: ['庚申', '庚申', '甲申', '庚申'],
    level: '身弱', deLing: false, deDi: false, deShi: '失势',
  },
  {
    // 得令+无根+失势,兜底比值 2.61/6.4 = 0.408 ≤ 0.55 → 身弱
    label: '得令无根失势 → 身弱',
    pillars: ['庚辰', '庚辰', '甲辰', '庚辰'],
    level: '身弱', deLing: true, deDi: false, deShi: '失势',
  },
]

describe('determineStrength 月令矩阵(12 月)', () => {
  for (const c of MONTH_MATRIX) {
    it(c.label, () => {
      const r = determineStrength(buildChartFromPillars({ pillars: c.pillars }))
      expect(r.level).toBe(c.level)
      if (c.deLing !== undefined) expect(r.deLing).toBe(c.deLing)
      if (c.deDi !== undefined) expect(r.deDi).toBe(c.deDi)
      if (c.deShi !== undefined) expect(r.deShi).toBe(c.deShi)
    })
  }
})

describe('determineStrength 模糊带(±0.05 归中和)', () => {
  for (const c of BAND_CASES) {
    it(c.label, () => {
      const r = determineStrength(buildChartFromPillars({ pillars: c.pillars }))
      expect(r.level).toBe('中和')
      if (c.deLing !== undefined) expect(r.deLing).toBe(c.deLing)
      if (c.deDi !== undefined) expect(r.deDi).toBe(c.deDi)
      if (c.deShi !== undefined) expect(r.deShi).toBe(c.deShi)
      // 理由串必须包含 → 中和
      expect(r.reason).toContain('→ 中和')
    })
  }
})

describe('determineStrength 常规分支', () => {
  for (const c of NORMAL_CASES) {
    it(c.label, () => {
      const r = determineStrength(buildChartFromPillars({ pillars: c.pillars }))
      expect(r.level).toBe(c.level)
      if (c.deLing !== undefined) expect(r.deLing).toBe(c.deLing)
      if (c.deDi !== undefined) expect(r.deDi).toBe(c.deDi)
      if (c.deShi !== undefined) expect(r.deShi).toBe(c.deShi)
    })
  }
})

describe('determineStrength 根分类', () => {
  it('戊土四午:午中己土为禄位强根 → 得地', () => {
    const r = determineStrength(buildChartFromPillars({ pillars: ['乙午', '乙午', '戊午', '乙午'] }))
    expect(r.deDi).toBe(true)
    expect(r.reason).toContain('强根')
  })
  it('甲木四辰:辰中乙木为中气微根 → 不得地', () => {
    const r = determineStrength(buildChartFromPillars({ pillars: ['庚辰', '庚辰', '甲辰', '庚辰'] }))
    expect(r.deDi).toBe(false)
  })
  it('甲木四亥:亥为甲之长生 → 强根得地', () => {
    const r = determineStrength(buildChartFromPillars({ pillars: ['乙亥', '乙亥', '甲亥', '乙亥'] }))
    expect(r.deDi).toBe(true)
    expect(r.reason).toContain('强根')
  })
})

describe('S2 从格解耦回归(从格判定不依赖强弱)', () => {
  it('辛寅 辛戌 壬未 戊戌:强弱=中和,仍判从杀格(旧代码因身弱门槛必判 null)', () => {
    const bazi = buildChartFromPillars({ pillars: ['辛寅', '辛戌', '壬未', '戊戌'] })
    const lv = determineStrength(bazi).level
    expect(lv).toBe('中和') // 无根+失势,比值 3.34/5.67=0.589 落模糊带
    const sha = isCongSha(bazi)
    expect(sha).not.toBeNull()
    expect(sha!.name).toBe('从杀格')
  })

  it('既有从格命盘不受解耦影响(与 S0 基线一致)', () => {
    const bazi = buildChartFromPillars({ pillars: ['辛巳', '辛丑', '乙酉', '辛巳'] })
    expect(isCongSha(bazi)!.name).toBe('从杀格')
    const bazi2 = buildChartFromPillars({ pillars: ['壬午', '癸丑', '乙酉', '辛巳'] })
    expect(isCongSha(bazi2)!.name).toBe('从杀格')
  })
})
