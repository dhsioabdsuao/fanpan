// 防刷规则:长度/去重/冷却/日限/跨日重置/称号资格
import { describe, it, expect } from 'vitest'
import {
  evaluateDraft,
  nextDaily,
  normalizeForCompare,
  ANNOTATION_DAILY_LIMIT,
} from '../antiSpam'

const NOW = 1_700_000_000_000

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    content: '这是一条完全合格的批注内容',
    lastContent: null,
    lastAt: null,
    now: NOW,
    dailyCount: 0,
    lastDate: null,
    today: '2026-08-30',
    postAuthorId: 'post-owner',
    myId: 'me',
    alreadyAnnotated: false,
    ...overrides,
  }
}

describe('evaluateDraft: 长度', () => {
  it('10 字(去空白后)通过,9 字拦截', () => {
    expect(evaluateDraft(ctx({ content: '命局身强火炎土燥喜金' })).ok).toBe(true) // 10 字
    expect(evaluateDraft(ctx({ content: '命局身强火炎土燥喜' })).ok).toBe(false) // 9 字
    const r = evaluateDraft(ctx({ content: '  命局身强火炎土燥喜金  ' }))
    expect(r.ok).toBe(true) // 空白不计入长度
  })

  it('超过 500 字拦截', () => {
    expect(evaluateDraft(ctx({ content: '命'.repeat(501) })).violations).toContain('TOO_LONG')
    expect(evaluateDraft(ctx({ content: '命'.repeat(500) })).violations).not.toContain('TOO_LONG')
  })
})

describe('evaluateDraft: 与上一条去重', () => {
  it('内容相同(仅空白标点差异)拦截', () => {
    const base = '日主戊土得令得地,喜金泄秀、水润局'
    const r = evaluateDraft(
      ctx({ content: '日主戊土,得令得地!喜金泄秀、水润局。', lastContent: base }),
    )
    expect(r.violations).toContain('DUPLICATE')
  })

  it('内容不同放行', () => {
    const r = evaluateDraft(
      ctx({ content: '换个说法:此局火土过旺,宜补金水', lastContent: '日主戊土得令得地' }),
    )
    expect(r.violations).not.toContain('DUPLICATE')
  })
})

describe('evaluateDraft: 冷却与日限', () => {
  it('30 秒内连发拦截,恰好 30 秒放行', () => {
    expect(
      evaluateDraft(ctx({ lastAt: NOW - 29_000 })).violations,
    ).toContain('COOLDOWN')
    expect(
      evaluateDraft(ctx({ lastAt: NOW - 30_000 })).violations,
    ).not.toContain('COOLDOWN')
  })

  it('同日达到上限拦截', () => {
    const r = evaluateDraft(ctx({ dailyCount: ANNOTATION_DAILY_LIMIT, lastDate: '2026-08-30' }))
    expect(r.violations).toContain('DAILY_LIMIT')
  })

  it('跨日(dailyCount 残留昨日)不拦截', () => {
    const r = evaluateDraft(ctx({ dailyCount: ANNOTATION_DAILY_LIMIT, lastDate: '2026-08-29' }))
    expect(r.violations).not.toContain('DAILY_LIMIT')
  })
})

describe('evaluateDraft: 称号资格', () => {
  it('他人帖首条批注计称号', () => {
    const r = evaluateDraft(ctx())
    expect(r.titleEligible).toBe(true)
  })

  it('自帖批注不计称号', () => {
    const r = evaluateDraft(ctx({ postAuthorId: 'me' }))
    expect(r.titleEligible).toBe(false)
  })

  it('同帖第二条不计称号', () => {
    const r = evaluateDraft(ctx({ alreadyAnnotated: true }))
    expect(r.titleEligible).toBe(false)
  })

  it('违规内容整体拦截(ok=false)', () => {
    const r = evaluateDraft(ctx({ content: '太短', postAuthorId: 'me' }))
    expect(r.ok).toBe(false)
  })
})

describe('nextDaily', () => {
  it('同日 +1,跨日归 1', () => {
    expect(nextDaily({ lastDate: '2026-08-30', today: '2026-08-30', dailyCount: 3 })).toEqual({
      date: '2026-08-30',
      count: 4,
    })
    expect(nextDaily({ lastDate: '2026-08-29', today: '2026-08-30', dailyCount: 3 })).toEqual({
      date: '2026-08-30',
      count: 1,
    })
    expect(nextDaily({ lastDate: null, today: '2026-08-30', dailyCount: 0 })).toEqual({
      date: '2026-08-30',
      count: 1,
    })
  })
})

describe('normalizeForCompare', () => {
  it('去除空白与中英文标点', () => {
    expect(normalizeForCompare('身强, 火炎土燥!喜金水。')).toBe('身强火炎土燥喜金水')
  })
})
