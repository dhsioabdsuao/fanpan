import { describe, it, expect } from 'vitest'
import { generateYongShenReading } from './orchestrator'
import type { YongShenResult } from '../types'
import type { LlmProvider } from '@/lib/flow/llm'

// ── 合规文本（与 validator 测试一致，约 313 字去空白）──
const VALID_TEXT = `你的命局核心需要木与水——甲木疏土、癸水润局，所以甲和癸是你的喜用神。甲木是你的「七杀」，癸水是你的「正财」，它们分别承担不同的角色：甲木负责克土平衡、让命局不至于过厚重；癸水负责润燥、补足调候上的需求——古籍称之为「火炎土燥」的结构，意思是火多缺水、土性偏燥，所以水的力量对你来说格外珍贵。

反过来说，戊土和己土对你来说是需要多留意的方向。命局土本来就厚，再加土，就像在已经层层叠叠的厚土上再堆一层——不是不好，而是不太容易推动新的变化。不过这不意味着土是坏的，而是提醒你：在需要灵活和变通的时候，可以试试每天给自己留一段不排计划的时间，或者周末去有水有树的地方走一走。

总的来说：你的命局最需要的能量是木的舒展与水的流动——有了这两样，厚重的土才能长出东西、活起来。`

// ── 违规文本 1：含绝对化词汇"一定" ──
const INVALID_ABSOLUTE = VALID_TEXT.replace(
  '所以甲和癸是你的喜用神',
  '所以甲和癸一定是你的喜用神',
)

// ── 违规文本 2：过短（≥10 字避免误入空响应检测，但 <250 字触发规则 9）──
const INVALID_SHORT = '甲木和癸水是你的喜用神，它们分别负责克土平衡和润燥调候，是命局最需要的两种能量。'

// ── 构造 YongShenResult ──
function makeYongShenResult(overrides?: Partial<YongShenResult>): YongShenResult {
  return {
    primaryMethod: '扶抑',
    yongShen: [
      { gan: '甲', element: '木', yinYang: '阳', tenGod: '七杀', category: '喜用', priority: 1, score: 8, reason: '克身平衡' },
      { gan: '癸', element: '水', yinYang: '阴', tenGod: '正财', category: '喜用', priority: 2, score: 7, reason: '调候用水' },
    ],
    jiShen: [
      { gan: '戊', element: '土', yinYang: '阳', tenGod: '比肩', category: '忌', priority: 1, score: -6, reason: '加重身旺' },
      { gan: '己', element: '土', yinYang: '阴', tenGod: '劫财', category: '忌', priority: 2, score: -5, reason: '比劫夺财' },
    ],
    xianShen: [
      { gan: '乙', element: '木', yinYang: '阴', tenGod: '正官', category: '闲', priority: 0, score: 2, reason: '辅佐' },
      { gan: '丙', element: '火', yinYang: '阳', tenGod: '偏印', category: '闲', priority: 0, score: 1, reason: '生身' },
      { gan: '丁', element: '火', yinYang: '阴', tenGod: '正印', category: '闲', priority: 0, score: 1, reason: '生身' },
      { gan: '庚', element: '金', yinYang: '阳', tenGod: '食神', category: '闲', priority: 0, score: 0, reason: '泄秀' },
      { gan: '辛', element: '金', yinYang: '阴', tenGod: '伤官', category: '闲', priority: 0, score: 0, reason: '泄秀' },
      { gan: '壬', element: '水', yinYang: '阳', tenGod: '偏财', category: '闲', priority: 0, score: 3, reason: '辅佐' },
    ],
    reasoning: [{ step: '扶抑判定', detail: '日主身旺，喜克泄耗' }],
    summary: '喜甲癸，忌戊己',
    fuYi: null,
    congGe: null,
    huaGe: null,
    tongGuan: null,
    tiaoHou: {
      active: true,
      level: 1,
      pattern: '火炎土燥',
      needs: ['水'],
      overrideFuYi: false,
      elementAdjust: { '木': 0, '火': -1, '土': -1, '金': 0, '水': 2 },
      weight: 0.4,
      detail: '夏土需水润局',
    },
    ...overrides,
  }
}

// ── Mock provider 工厂 ──
function makeMockProvider(responses: string[]): LlmProvider {
  let callCount = 0
  return {
    name: 'MockProvider',
    async generate(_prompt: string): Promise<string> {
      const idx = Math.min(callCount, responses.length - 1)
      callCount++
      return responses[idx]
    },
  }
}

function makeThrowingProvider(msg: string): LlmProvider {
  return {
    name: 'ThrowingProvider',
    async generate(_prompt: string): Promise<string> {
      throw new Error(msg)
    },
  }
}

const CLOSING = '\n\n命局给出的是倾向，不是定数。你比命盘更了解自己。'

describe('generateYongShenReading', () => {
  // ── 测试 1：首次成功 ──
  it('首次成功 → source=llm, attempts=1', async () => {
    const ys = makeYongShenResult()
    const provider = makeMockProvider([VALID_TEXT])

    const result = await generateYongShenReading(ys, { provider })

    expect(result.source).toBe('llm')
    expect(result.attempts).toBe(1)
    expect(result.text).toContain('甲木')
    expect(result.text).toContain(CLOSING)
    expect(result.retryReasons).toHaveLength(0)
  })

  // ── 测试 2：第 1 次违规，第 2 次通过 ──
  it('重试1次成功 → source=llm, attempts=2', async () => {
    const ys = makeYongShenResult()
    const provider = makeMockProvider([INVALID_ABSOLUTE, VALID_TEXT])

    const result = await generateYongShenReading(ys, { provider })

    expect(result.source).toBe('llm')
    expect(result.attempts).toBe(2)
    expect(result.retryReasons.length).toBeGreaterThanOrEqual(1)
    expect(result.retryReasons[0]).toContain('规则1_绝对化词汇')
  })

  // ── 测试 3：3 次都失败 → fallback ──
  it('3次失败 → source=fallback, attempts=3', async () => {
    const ys = makeYongShenResult()
    const provider = makeMockProvider([INVALID_SHORT, INVALID_ABSOLUTE, INVALID_SHORT])

    const result = await generateYongShenReading(ys, { provider })

    expect(result.source).toBe('fallback')
    expect(result.attempts).toBe(3)
    expect(result.retryReasons).toHaveLength(3)
    expect(result.text).toContain(CLOSING)
    // fallback 文本应有基本内容
    expect(result.text.length).toBeGreaterThan(200)
  })

  // ── 测试 4：空响应不消耗校验配额 ──
  it('空响应后成功 → 空响应不计数, attempts=1', async () => {
    const ys = makeYongShenResult()
    const provider = makeMockProvider(['   ', VALID_TEXT])

    const result = await generateYongShenReading(ys, { provider })

    expect(result.source).toBe('llm')
    expect(result.attempts).toBe(1)
    expect(result.retryReasons.some((r) => r.includes('空响应'))).toBe(true)
  })

  // ── 测试 5：API 错误 → 走 fallback ──
  it('API连续错误 → source=fallback', async () => {
    const ys = makeYongShenResult()
    const provider = makeThrowingProvider('Network error')

    const result = await generateYongShenReading(ys, { provider })

    expect(result.source).toBe('fallback')
    expect(result.attempts).toBe(0)
    expect(result.retryReasons.some((r) => r.includes('API错误'))).toBe(true)
    expect(result.text).toContain(CLOSING)
  })
})
