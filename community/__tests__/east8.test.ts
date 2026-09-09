// 东八区日期键
import { describe, it, expect } from 'vitest'
import { todayEast8 } from '../east8'

describe('todayEast8', () => {
  it('UTC 时刻映射为东八区日期', () => {
    // 2026-08-29T16:30:00Z = 北京 2026-08-30 00:30
    expect(todayEast8(Date.UTC(2026, 7, 29, 16, 30))).toBe('2026-08-30')
    // 2026-08-29T15:59:00Z = 北京 2026-08-29 23:59
    expect(todayEast8(Date.UTC(2026, 7, 29, 15, 59))).toBe('2026-08-29')
    // 跨年:2026-12-31T16:00:00Z = 北京 2027-01-01 00:00
    expect(todayEast8(Date.UTC(2026, 11, 31, 16, 0))).toBe('2027-01-01')
  })
})
