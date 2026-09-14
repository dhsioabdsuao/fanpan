import { describe, expect, it } from 'vitest'
import { getXunKong } from '@/lib/bazi-utils'

describe('getXunKong(旬空)', () => {
  // 各旬旬空对照(lunar-typescript Yun.getXunKong 同义)
  const cases: [string, string][] = [
    ['甲子', '戌亥'],
    ['乙丑', '戌亥'],
    ['癸酉', '戌亥'],
    ['甲戌', '申酉'],
    ['乙亥', '申酉'],
    ['甲午', '辰巳'],
    ['庚子', '辰巳'],
    ['癸卯', '辰巳'],
    ['甲辰', '寅卯'],
    ['戊午', '子丑'],
    ['己未', '子丑'],
    ['甲寅', '子丑'],
    ['癸亥', '子丑'],
  ]
  it.each(cases)('%s 旬空 %s', (gz, kong) => {
    expect(getXunKong(gz)).toBe(kong)
  })

  it('非法干支返回空串', () => {
    expect(getXunKong('')).toBe('')
    expect(getXunKong('甲甲')).toBe('')
  })
})
