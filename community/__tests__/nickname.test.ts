// 昵称校验:断言 reason 码与 value,不断言文案(AGENTS 规则 2)
import { describe, it, expect } from 'vitest'
import { evaluateNickname, NICKNAME_REJECT_MESSAGES, nicknameRejectMessage } from '../nickname'
import type { NicknameRejectReason } from '../nickname'

/** 断言输入被拒并返回 reason 码(联合类型收窄,合法分支无 reason) */
function reasonOf(input: string): NicknameRejectReason {
  const ev = evaluateNickname(input)
  if (ev.valid) throw new Error(`expected rejection, got value: ${ev.value}`)
  return ev.reason
}

describe('evaluateNickname 合法', () => {
  it('中文昵称通过', () => {
    expect(evaluateNickname('命友')).toEqual({ valid: true, value: '命友' })
  })

  it('首尾空白被 trim', () => {
    expect(evaluateNickname('  玄学大师  ')).toEqual({ valid: true, value: '玄学大师' })
  })

  it('2 字与 12 字边界通过', () => {
    expect(evaluateNickname('甲乙')).toEqual({ valid: true, value: '甲乙' })
    expect(evaluateNickname('甲'.repeat(12))).toEqual({ valid: true, value: '甲'.repeat(12) })
  })

  it('汉字/字母/数字/中点混合通过', () => {
    expect(evaluateNickname('命友·138')).toEqual({ valid: true, value: '命友·138' })
    expect(evaluateNickname('abc123')).toEqual({ valid: true, value: 'abc123' })
    expect(evaluateNickname('Ab·1')).toEqual({ valid: true, value: 'Ab·1' })
  })
})

describe('evaluateNickname 拒绝', () => {
  it('空串与纯空白 → empty', () => {
    expect(reasonOf('')).toBe('empty')
    expect(reasonOf('   ')).toBe('empty')
    expect(reasonOf('\t\n')).toBe('empty')
  })

  it('1 字 → too_short', () => {
    expect(reasonOf('a')).toBe('too_short')
    expect(reasonOf('命')).toBe('too_short')
  })

  it('13 字 → too_long', () => {
    expect(reasonOf('玄'.repeat(13))).toBe('too_long')
  })

  it('非法字符 → invalid_chars', () => {
    expect(reasonOf('命 友')).toBe('invalid_chars') // 内部空格
    expect(reasonOf('hello!')).toBe('invalid_chars')
    expect(reasonOf('😀')).toBe('invalid_chars')
    expect(reasonOf('命友*')).toBe('invalid_chars')
    expect(reasonOf('138****5678')).toBe('invalid_chars')
    // 旧默认昵称(14 字)先命中长度检查——无论如何都会被拒
    expect(reasonOf('命友138****5678')).toBe('too_long')
    expect(reasonOf('ＡＢ')).toBe('invalid_chars') // 全角字母(2 字符,通过长度检查)
  })

  it('纯手机号 → is_phone', () => {
    expect(reasonOf('13812345678')).toBe('is_phone')
    expect(reasonOf('19900001111')).toBe('is_phone')
  })

  it('非手机号格式的纯数字放行(规则:仅拦 1[3-9] 开头 11 位)', () => {
    expect(evaluateNickname('12812345678')).toEqual({ valid: true, value: '12812345678' })
    expect(evaluateNickname('1381234567')).toEqual({ valid: true, value: '1381234567' })
  })

  it('敏感词 → sensitive', () => {
    expect(reasonOf('加微信详聊')).toBe('sensitive')
    expect(reasonOf('约炮')).toBe('sensitive')
    expect(reasonOf('命友约炮')).toBe('sensitive')
  })

  it('检查顺序:长度先于敏感词,字符集先于 is_phone', () => {
    expect(reasonOf('约炮'.repeat(10))).toBe('too_long')
    expect(reasonOf('😀'.repeat(6))).toBe('invalid_chars')
  })
})

describe('NICKNAME_REJECT_MESSAGES', () => {
  it('每个 reason 都有非空文案(不锁措辞)', () => {
    for (const reason of Object.keys(NICKNAME_REJECT_MESSAGES) as NicknameRejectReason[]) {
      expect(nicknameRejectMessage(reason).length).toBeGreaterThan(0)
    }
  })
})
