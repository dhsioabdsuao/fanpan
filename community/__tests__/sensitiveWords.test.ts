// 敏感词:命中/未命中/不误伤命理术语
import { describe, it, expect } from 'vitest'
import { containsSensitive } from '../sensitiveWords'

describe('containsSensitive', () => {
  it('命中敏感词返回该词', () => {
    expect(containsSensitive('此局水旺,适合去澳门博彩吗')).toBe('博彩')
    expect(containsSensitive('加微信详聊,包看八字')).toBe('加微信详聊')
  })

  it('正常命理内容不命中', () => {
    expect(containsSensitive('此局身强火炎土燥,喜金水泄秀,大运见金水为佳')).toBeNull()
  })

  it('单字不误伤:七杀/伤官/食神等术语安全', () => {
    expect(containsSensitive('七杀攻身,宜印化杀')).toBeNull()
    expect(containsSensitive('伤官配印,才思敏捷')).toBeNull()
    expect(containsSensitive('食神生财格,格局清纯')).toBeNull()
  })

  it('空文本不命中', () => {
    expect(containsSensitive('')).toBeNull()
  })
})
