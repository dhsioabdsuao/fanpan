// 手机号掩码
import { describe, it, expect } from 'vitest'
import { maskPhone, defaultNickname } from '../mask'

describe('maskPhone', () => {
  it('13812345678 → 138****5678', () => {
    expect(maskPhone('13812345678')).toBe('138****5678')
  })

  it('各号段均正常掩码', () => {
    expect(maskPhone('19900001111')).toBe('199****1111')
    expect(maskPhone('15012345678')).toBe('150****5678')
  })

  it('非 11 位大陆手机号原样返回(异常数据不硬遮)', () => {
    expect(maskPhone('12345')).toBe('12345')
    expect(maskPhone('')).toBe('')
  })
})

describe('defaultNickname', () => {
  it('生成「命友·」前缀掩码昵称', () => {
    expect(defaultNickname('13812345678')).toBe('命友·138****5678')
  })
})
