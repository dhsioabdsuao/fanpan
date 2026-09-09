// 脱敏选择器:白名单字段全集、出生原始数据绝不出现在草稿里
import { describe, it, expect } from 'vitest'
import { calculateBazi } from '@/lib/bazi'
import { analyze } from '@/lib/bage/analyze'
import type { FullAnalysis } from '@/lib/bage/analyze'
import { buildPostDraft } from '../privacy'
import { PostDraftSchema } from '../schemas'

// 金标准命例输入(与 lib/__tests__/bazi.golden.test.ts 对齐:庚辰 壬午 甲辰 庚午)
const INPUT = {
  year: 2000,
  month: 6,
  day: 15,
  hour: 12,
  minute: 0,
  gender: 'male' as const,
  isLunar: false,
}

const DRAFT_WHITELIST_KEYS = [
  'gender',
  'baziBrief',
  'pillars',
  'dayMaster',
  'dayMasterElement',
  'pattern',
  'strength',
  'xiYong',
  'shensha',
  'daYun',
] as const

/** 真实管线产出的 FullAnalysis(唯一夹具来源,不手写) */
function realFull(): FullAnalysis {
  return analyze(calculateBazi(INPUT))
}

/** 递归收集对象全部键名(数组元素同规则) */
function collectKeys(value: object): string[] {
  const keys: string[] = []
  const walk = (v: unknown) => {
    if (Array.isArray(v)) {
      v.forEach(walk)
    } else if (v !== null && typeof v === 'object') {
      for (const [k, child] of Object.entries(v)) {
        keys.push(k)
        walk(child)
      }
    }
  }
  walk(value)
  return keys
}

describe('buildPostDraft', () => {
  const draft = buildPostDraft(realFull())

  it('输出字段集恰好等于白名单(防字段漂移)', () => {
    expect(Object.keys(draft).sort()).toEqual([...DRAFT_WHITELIST_KEYS].sort())
  })

  it('四柱与金标准一致,baziBrief 拼装正确', () => {
    expect(draft.baziBrief).toBe('庚辰 壬午 甲辰 庚午')
    expect(draft.pillars.year.stem).toBe('庚')
    expect(draft.pillars.day.stem).toBe('甲')
    expect(draft.pillars.day.tenGod).toBeNull() // 日柱无十神
    expect(draft.pillars.year.tenGod).toBeTruthy() // 年干十神非空
    expect(draft.pillars.month.tenGod).toBeTruthy()
    expect(draft.pillars.hour).not.toBeNull() // 移动端时辰必填
    expect(draft.pillars.hour!.tenGod).toBeTruthy()
    expect(draft.pillars.year.naYin).toBeTruthy()
  })

  it('序列化后不含任何出生原始字段(递归键名全集断言)', () => {
    const keys = collectKeys(JSON.parse(JSON.stringify(draft)) as object)
    for (const forbidden of ['minute', 'province', 'city', 'district', 'isLunar', 'isLeapMonth', 'birthPlace', 'inputInfo']) {
      expect(keys).not.toContain(forbidden)
    }
  })

  it('性别/日主/格局/强弱/喜忌/神煞/大运摘要均有值', () => {
    expect(draft.gender).toBe('male')
    expect(draft.dayMaster).toBeTruthy()
    expect(draft.pattern.displayName).toBeTruthy()
    expect(draft.pattern.outcome).toBeTruthy()
    expect(draft.strength.level).toMatch(/^(身强|中和|身弱)$/)
    expect(draft.xiYong.favorable.length).toBeGreaterThan(0)
    expect(draft.daYun).not.toBeNull()
    expect(draft.daYun!.decades.length).toBeGreaterThan(0)
    expect(draft.daYun!.decades[0].startYear).toBeGreaterThan(0)
  })

  it('无大运的盘 daYun 为 null(不崩)', () => {
    const full = realFull()
    const noDaYun: FullAnalysis = { ...full, bazi: { ...full.bazi, daYun: undefined } }
    expect(buildPostDraft(noDaYun).daYun).toBeNull()
  })
})

describe('PostDraftSchema(发布请求体白名单)', () => {
  const draft = buildPostDraft(realFull())

  it('合法草稿解析通过', () => {
    const parsed = PostDraftSchema.safeParse(draft)
    expect(parsed.success).toBe(true)
  })

  it('未知键被 strip(双保险:即使被塞入出生字段也进不了云)', () => {
    const tainted = {
      ...draft,
      minute: 30,
      province: '北京',
      birthParams: { year: 2000, month: 6, day: 15, hour: 12, minute: 30 },
    }
    const parsed = PostDraftSchema.parse(tainted)
    expect(Object.keys(parsed).sort()).toEqual([...DRAFT_WHITELIST_KEYS].sort())
  })

  it('非法数据(缺失字段)拒绝', () => {
    const { dayMaster: _drop, ...incomplete } = draft
    expect(PostDraftSchema.safeParse(incomplete).success).toBe(false)
  })
})
