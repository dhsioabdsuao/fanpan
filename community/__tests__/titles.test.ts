// 称号阶梯:边界、进度、色 token 映射
import { describe, it, expect } from 'vitest'
import { TITLE_TIERS, titleForCount, tierColorToken } from '../titles'

describe('titleForCount', () => {
  it('0 条无称号,下一阈值是第一档', () => {
    expect(titleForCount(0)).toEqual({
      name: null,
      tier: null,
      nextThreshold: 10,
      progress: 0,
    })
    const mid = titleForCount(5)
    expect(mid.name).toBeNull()
    expect(mid.progress).toBeCloseTo(0.5)
  })

  it.each([
    [9, null],
    [10, '初窥门径·铜'],
    [11, '初窥门径·铜'],
    [49, '初窥门径·铜'],
    [50, '批注学徒·银'],
    [51, '批注学徒·银'],
    [199, '批注学徒·银'],
    [200, '命理师·金'],
    [499, '命理师·金'],
    [500, '曜金大师'],
    [501, '曜金大师'],
  ])('count=%i → name=%s', (count, expectedName) => {
    expect(titleForCount(count).name).toBe(expectedName)
  })

  it('边界处的档位与下一阈值正确', () => {
    const at10 = titleForCount(10)
    expect(at10.tier).toBe('bronze')
    expect(at10.nextThreshold).toBe(50)
    expect(at10.progress).toBe(0)

    const at30 = titleForCount(30)
    expect(at30.progress).toBeCloseTo(0.5)

    const at49 = titleForCount(49)
    expect(at49.nextThreshold).toBe(50)
    expect(at49.progress).toBeCloseTo(39 / 40)

    const apex = titleForCount(500)
    expect(apex.tier).toBe('apex')
    expect(apex.nextThreshold).toBeNull()
    expect(apex.progress).toBe(1)
  })

  it('负数与小数按 0 与向下取整处理', () => {
    expect(titleForCount(-5).name).toBeNull()
    expect(titleForCount(9.9).name).toBeNull()
    expect(titleForCount(10.9).name).toBe('初窥门径·铜')
  })

  it('TITLE_TIERS 阈值严格递增', () => {
    for (let i = 1; i < TITLE_TIERS.length; i++) {
      expect(TITLE_TIERS[i].threshold).toBeGreaterThan(TITLE_TIERS[i - 1].threshold)
    }
  })
})

describe('tierColorToken', () => {
  it('每个档位都有映射的主题色 token', () => {
    expect(tierColorToken('bronze')).toBe('goldMuted')
    expect(tierColorToken('silver')).toBe('goldLight')
    expect(tierColorToken('gold')).toBe('gold')
    expect(tierColorToken('apex')).toBe('glowGold')
  })

  it('与 TITLE_TIERS 的档位一一对应', () => {
    for (const t of TITLE_TIERS) {
      expect(typeof tierColorToken(t.tier)).toBe('string')
    }
  })
})
