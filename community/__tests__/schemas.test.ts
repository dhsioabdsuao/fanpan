// 社区 schema:通过/拒绝样例
import { describe, it, expect } from 'vitest'
import {
  LoginFormSchema,
  QuestionSchema,
  QuestionFormSchema,
  AnnotationSchema,
  ReportReasonSchema,
} from '../schemas'

describe('LoginFormSchema', () => {
  it('合法登录表单通过', () => {
    expect(
      LoginFormSchema.safeParse({ phone: '13812345678', code: '123456', agreed: true }).success,
    ).toBe(true)
  })

  it('拒绝:手机号不合法 / 验证码非 6 位 / 未勾选协议', () => {
    expect(LoginFormSchema.safeParse({ phone: '12345', code: '123456', agreed: true }).success).toBe(false)
    expect(LoginFormSchema.safeParse({ phone: '13812345678', code: '123', agreed: true }).success).toBe(false)
    expect(LoginFormSchema.safeParse({ phone: '13812345678', code: '123456', agreed: false }).success).toBe(false)
  })
})

describe('QuestionSchema', () => {
  it('5-200 字通过(空白不计)', () => {
    expect(QuestionSchema.safeParse('求看事业方向').success).toBe(true)
    expect(QuestionSchema.safeParse('  求看事业方向  ').success).toBe(true)
    expect(QuestionSchema.safeParse('命'.repeat(200)).success).toBe(true)
  })

  it('边界外拒绝', () => {
    expect(QuestionSchema.safeParse('事业').success).toBe(false)
    expect(QuestionSchema.safeParse('命'.repeat(201)).success).toBe(false)
  })
})

describe('QuestionFormSchema', () => {
  it('对象形态与 QuestionSchema 规则一致', () => {
    expect(QuestionFormSchema.safeParse({ question: '求看事业方向' }).success).toBe(true)
    expect(QuestionFormSchema.safeParse({ question: '事业' }).success).toBe(false)
  })
})

describe('AnnotationSchema', () => {
  it('10-500 字通过', () => {
    expect(AnnotationSchema.safeParse('此局身强火炎土燥喜用金水').success).toBe(true)
  })

  it('边界外拒绝', () => {
    expect(AnnotationSchema.safeParse('批注太短').success).toBe(false)
    expect(AnnotationSchema.safeParse('命'.repeat(501)).success).toBe(false)
  })
})

describe('ReportReasonSchema', () => {
  it('枚举内通过,枚举外拒绝', () => {
    expect(ReportReasonSchema.safeParse('广告营销').success).toBe(true)
    expect(ReportReasonSchema.safeParse('随便写的理由').success).toBe(false)
  })
})
