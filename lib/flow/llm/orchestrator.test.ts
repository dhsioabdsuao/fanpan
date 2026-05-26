import { describe, it, expect } from 'vitest'
import { calculateBazi } from '@/lib/bazi'
import { calculateDayMasterStrength } from '@/lib/strength'
import { buildFactPack } from '@/lib/flow'
import { generateFlowReading } from './orchestrator'
import { replacePlaceholders } from './placeholderReplacer'
import { validateLlmOutput } from './validator'
import type { LlmProvider } from './provider'
import type { BaziInput, BaziResult } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength/types'

// ── 工具函数 ──

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return {
    year: 2002, month: 4, day: 20, hour: 15, minute: 32,
    gender: 'male', isLunar: false,
    ...overrides,
  }
}

function compute(input: BaziInput): { bazi: BaziResult; strength: DayMasterStrength } {
  const bazi = calculateBazi(input)
  const strength = calculateDayMasterStrength(bazi)
  return { bazi, strength }
}

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

// ── 测试 0: 空响应触发 API 重试,不消耗校验配额 ──
// 意图: 第一次 LLM 返回空内容(<10 chars),应触发 API 重试(attempt 不增加);
//       第二次返回合规文本,最终 attempts=1(API 重试不计数)
it('Mock: 空响应触发API重试,不消耗校验配额', async () => {
  const { bazi, strength } = compute(makeInput())
  const factPack = buildFactPack(bazi, strength)
  factPack.climaticBalance.pattern = '平衡'

  const mockProvider = makeMockProvider([
    '   ',
    '你的命局,土的力量厚而稳——日柱的 [日柱] 坐在 [日支] 上,得地有根,这意味着日主在地支里有同类支撑。月支 [月支] 和时柱 [时柱] 又把土的根基再加深两层,整个命局像一片层层叠叠的厚土,牢牢扎在那里。这种结构意味着你倾向于在熟悉的环境里找到稳定感,但在面对新事物时也会有自己的节奏,需要更多时间去消化和适应。不过正是这种厚实的根基,让你在长期的事情上有持续的耐力,不容易被外界轻易推动。在性格上你倾向于稳重,做选择时会先衡量这件事稳不稳。这份厚实是你的力量,也是你的节奏。',
  ])

  const result = await generateFlowReading(factPack, { provider: mockProvider })

  expect(result.attempts).toBe(1)
  expect(result.source).toBe('llm')
  expect(result.retryReasons.length).toBe(1)
  expect(result.retryReasons[0]).toContain('API空响应')
})

// ── 测试 1: 真 API happy path ──
// 意图: 使用真实 DeepSeek API 验证端到端 LLM 调用 + 校验 + 占位符替换全链路
it('真 API: 完整调用链路（需 DEEPSEEK_API_KEY）', async () => {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log('⚠ 跳过真 API 测试: DEEPSEEK_API_KEY 未配置')
    return
  }

  const input = makeInput({
    year: 2002, month: 4, day: 20, hour: 15, minute: 32,
    gender: 'male',
    birthPlace: { province: '河南省', city: '洛阳市', district: '栾川县' },
  })
  const { bazi, strength } = compute(input)
  const factPack = buildFactPack(bazi, strength)

  const result = await generateFlowReading(factPack)

  console.log('═══════════════════════════════════════')
  console.log('真 API 返回解读全文:')
  console.log('───────────────────────────────────────')
  console.log(result.text)
  console.log('───────────────────────────────────────')
  console.log('source:', result.source)
  console.log('attempts:', result.attempts)
  console.log('retryReasons:', result.retryReasons)
  console.log('═══════════════════════════════════════')

  expect(result.source).toBe('llm')
  expect(result.attempts).toBeGreaterThanOrEqual(1)
  expect(result.attempts).toBeLessThanOrEqual(3)
  expect(result.text.length).toBeGreaterThan(300)
  expect(result.text).toContain('命局给出的是倾向,不是定数。你比命盘更了解自己。')
  // 不应残留占位符
  expect(result.text).not.toMatch(/\[.+\]/)
  // 调候层必须被引用（用户命局 pattern="火炎土燥"）
  expect(result.text).toContain('火炎土燥')

  // 规则12a: "火炎土燥"附近不能出现"并非...而是..."重新定义句式
  const patternIdx = result.text.indexOf('火炎土燥')
  const nearby = result.text.slice(
    Math.max(0, patternIdx - 10),
    Math.min(result.text.length, patternIdx + 90)
  )
  expect(nearby).not.toMatch(/并非.{0,30}而是/)

  // 规则12b: "火炎土燥"附近 80 字内必须含核心字（缺水/燥/干/热）之一
  const afterPattern = result.text.slice(
    patternIdx + 4,
    patternIdx + 84
  )
  const coreWords = ['缺水', '燥', '干', '热']
  const hasCore = coreWords.some(w => afterPattern.includes(w))
  expect(hasCore).toBe(true)
}, 120000)

// ── 测试 2: Mock provider 拦截绝对化词汇 ──
// 意图: 第一次返回含"你一定"的违规文本,校验失败;第二次返回合规文本,应通过
it('Mock: 拦截绝对化词汇后重试成功', async () => {
  const { bazi, strength } = compute(makeInput())
  const factPack = buildFactPack(bazi, strength)
  // 覆盖 pattern 为"平衡"避免规则 11 干扰本测试意图(拦截绝对化词汇)
  factPack.climaticBalance.pattern = '平衡'

  const mockProvider = makeMockProvider([
    '你的命局土的力量很厚,你一定是一个性格保守的人,注定在稳定环境中发展。但同时也需要注意灵活变通,在生活中有意识地调整自己的节奏。在面对新环境时,不妨给自己多一些时间去适应。',
'你的命局,土的力量厚而稳——日柱的 [日柱] 坐在 [日支] 上,得地有根,这意味着日主在地支里有同类支撑。月支 [月支] 和时柱 [时柱] 又把土的根基再加深两层,整个命局像一片层层叠叠的厚土,牢牢扎在那里。这种结构意味着你倾向于在熟悉的环境里找到稳定感,但在面对新事物时也会有自己的节奏,需要更多时间去消化和适应。不过正是这种厚实的根基,让你在长期的事情上有持续的耐力,不容易被外界轻易推动。在性格上你倾向于稳重,做选择时会先衡量这件事稳不稳,而不是这件事新不新。这份厚实是你的力量,也是你的节奏。',
  ])

  const result = await generateFlowReading(factPack, { provider: mockProvider })

  expect(result.attempts).toBe(2)
  expect(result.source).toBe('llm')
  expect(result.retryReasons.length).toBeGreaterThan(0)
  expect(result.retryReasons[0]).toContain('规则1_绝对化词汇')
})

// ── 测试 3: Mock provider 拦截极端化性格判决 ──
// 意图: 第一次返回"你性格保守不喜冒险",命中规则2;第二次合规
it('Mock: 拦截极端化性格判决后重试成功', async () => {
  const { bazi, strength } = compute(makeInput())
  const factPack = buildFactPack(bazi, strength)
  // 覆盖 pattern 为"平衡"避免规则 11 干扰本测试意图(拦截极端化性格判决)
  factPack.climaticBalance.pattern = '平衡'

  const mockProvider = makeMockProvider([
    '你性格保守不喜冒险,为人刚愎自用,做事情容易钻牛角尖。但同时也很有主见,不容易被他人左右。在人生的道路上你注定会成功,一定会出人头地。',
'在性格上你倾向于稳重,面对变化时会先观察再行动。不过这种谨慎并不意味着缺乏行动力,而是命局结构带来的节奏感,让你在关键时刻能够沉得住气。日柱的 [日柱] 坐在 [日支] 上,得地有根,整个命局像一片厚实的土壤,给你持续的支撑。在日常体感上,你会在突发变化面前先停下来确认,而不是立刻应变,这并不是迟钝,而是命局结构带来的先稳后动的倾向。同时,这份厚实也意味着你不太容易被外界轻易推动,有自己的原则和节奏,在熟悉的事情里稳如山,在新的事情面前慢半拍。',
  ])

  const result = await generateFlowReading(factPack, { provider: mockProvider })

  expect(result.attempts).toBe(2)
  expect(result.source).toBe('llm')
  expect(result.retryReasons[0]).toContain('规则2_极端化性格判决')
})

// ── 测试 4: Mock provider 拦截预测句式 ──
// 意图: 第一次返回"你将会在 30 岁...",命中规则3;第二次合规
it('Mock: 拦截预测句式后重试成功', async () => {
  const { bazi, strength } = compute(makeInput())
  const factPack = buildFactPack(bazi, strength)
  // 覆盖 pattern 为"平衡"避免规则 11 干扰本测试意图(拦截预测句式)
  factPack.climaticBalance.pattern = '平衡'

  const mockProvider = makeMockProvider([
    '你将会在事业上取得成功,你会在30岁时迎来重要的转折点,未来的发展一片光明。但同时也要注意不要过于冒进,稳扎稳打会更好。你未来一定会遇到贵人相助,到了35岁你就会迎来人生的巅峰。',
'你的命局结构意味着在长期积累中,你倾向于逐步建立自己的方向。不过这种节奏有时会显得慢一些,但每一步都比较扎实,不容易出现大的偏差。日柱的 [日柱] 提供了稳定的根基,月支 [月支] 也在底层持续支撑,整个命局的基调是稳中有进。在日常体感上,你会发现自己在做选择时,会先衡量这件事稳不稳,而不是这件事新不新。这并不意味着你不善于变通,而是命局结构带给你一种对熟悉路径的天然信任。反过来看,当你真正投入到一个方向上时,你的耐力会比大多数人更持久,在长期积累中逐步沉淀出属于自己的厚度。',
  ])

  const result = await generateFlowReading(factPack, { provider: mockProvider })

  expect(result.attempts).toBe(2)
  expect(result.source).toBe('llm')
  expect(result.retryReasons[0]).toContain('规则3_预测句式')
})

// ── 测试 5: Mock provider 3 次全失败 → fallback ──
// 意图: Mock provider 始终返回违规文本,耗尽 3 次重试后应回退到 fallback 模板
it('Mock: 3次失败后回退到 fallback 模板', async () => {
  const { bazi, strength } = compute(makeInput())
  const factPack = buildFactPack(bazi, strength)
  // 覆盖 pattern 为"平衡"避免规则 11 干扰本测试意图(3次失败→fallback)
  factPack.climaticBalance.pattern = '平衡'

  const mockProvider = makeMockProvider([
    '你一定是一个性格固执的人,注定了在人生中会遇到很多坎坷。',
    '你必然会经历大运起伏,流年变化会让你措手不及。',
    '你永远无法改变自己的命运,这是注定的安排。',
  ])

  const result = await generateFlowReading(factPack, { provider: mockProvider })

  expect(result.attempts).toBe(3)
  expect(result.source).toBe('fallback')
  expect(result.text.length).toBeGreaterThan(100)
  expect(result.text).toContain('命局给出的是倾向,不是定数。你比命盘更了解自己。')
  expect(result.retryReasons.length).toBe(3)
})

// ── 测试 6: 占位符替换正确性 ──
// 意图: Mock provider 返回含 [日柱]/[日主] 等占位符的合规文本,验证替换后无残留
it('占位符替换: [日柱]/[日主] 替换为真实八字,无残留', () => {
  const { bazi, strength } = compute(makeInput())
  const factPack = buildFactPack(bazi, strength)

  // 模拟 LLM 返回的合规文本(含占位符)
  const llmOutput = [
    '你的命局,土的力量厚而稳——日柱的 [日柱] 坐在 [日支] 上,得地有根。',
    '但流转到水的一段,断得很彻底。年柱的 [年柱] 中,水的力量孤独地坐在火上。',
    '不过这种结构也意味着日主 [日主] 有扎实的根基,不容易被推动。',
  ].join('\n\n')

  const replaced = replacePlaceholders(llmOutput, factPack.placeholders)

  // 不应残留任何占位符
  expect(replaced).not.toMatch(/\[.+\]/)

  // 验证真实八字字符串出现在结果中
  const dayPillar = bazi.pillars.day.stem + bazi.pillars.day.branch
  expect(replaced).toContain(dayPillar)
  expect(replaced).toContain(bazi.dayMaster)

  // 验证 LLM 占位符也被替换
  expect(replaced).not.toContain('{{MAIN_NARRATIVE}}')
})

// ── 补充: validateLlmOutput 单元测试 ──
describe('validateLlmOutput', () => {
  const { bazi, strength } = compute(makeInput())
  const factPack = buildFactPack(bazi, strength)
  // 覆盖 pattern 为"平衡"避免规则 11 干扰 validator 单元测试意图
  factPack.climaticBalance.pattern = '平衡'

  it('合规文本全部通过', () => {
    const text = '你的命局结构,意味着你倾向于在稳定中前进,但同时也需要留意变化的节奏。日柱的 [日柱] 坐在 [日支] 上,得地有根,这意味着日主在地支里有同类支撑,像一片层层叠叠的厚土给你持续的稳定感。在日常体感上,你会在做选择时先衡量这件事稳不稳,而不是这件事新不新。不过整体来看,这种结构带来的是一种厚实的底气,让你在长期的事情上有持续的耐力,不容易被外界轻易推动。反过来看,当你真正认准一个方向时,你比大多数人更能沉得住气,稳扎稳打。'
    const result = validateLlmOutput(text, factPack)
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('绝对化词汇触发规则1', () => {
    const result = validateLlmOutput('你注定会在事业上成功', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则1_绝对化词汇')).toBe(true)
  })

  it('极端化性格触发规则2', () => {
    const result = validateLlmOutput('你性格孤僻不喜社交', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则2_极端化性格判决')).toBe(true)
  })

  it('预测句式触发规则3', () => {
    const result = validateLlmOutput('你将会在事业上取得巨大成功', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则3_预测句式')).toBe(true)
  })

  it('禁忌词触发规则4', () => {
    const result = validateLlmOutput('你的命局显示有凶险', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则4_禁忌词')).toBe(true)
  })

  it('强制性词汇触发规则5', () => {
    const result = validateLlmOutput('你必须立刻去做出改变', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则5_行动建议强制性')).toBe(true)
  })

  it('其他流派术语触发规则6', () => {
    const result = validateLlmOutput('你的紫微命盘显示化禄在命宫', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则6_其他流派术语')).toBe(true)
  })

  it('严重健康术语触发规则7', () => {
    const result = validateLlmOutput('你容易得抑郁症,需要注意心理健康', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则7_健康严重表述')).toBe(true)
  })

  it('缺少转折词触发规则8', () => {
    const text = '你的命局土的力量很厚。日主得地有根。火土通根的稳定结构。你在做选择时会先衡量稳定性。'
    const result = validateLlmOutput(text, factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则8_双面性缺失')).toBe(true)
  })

  it('篇幅过短触发规则9', () => {
    const result = validateLlmOutput('你的命局很平衡,各方面都不错。但同时也要注意积累。', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule.startsWith('规则9'))).toBe(true)
  })

  it('超出阶段范围触发规则10', () => {
    const result = validateLlmOutput('你的大运走势不错,流年也还算顺利。但桃花运需要注意。', factPack)
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.rule === '规则10_超出阶段范围')).toBe(true)
  })
})
