import { describe, it, expect } from 'vitest'
import { validateYongShenReading } from './validator'
import type { YongShenFactPack } from './types'
import type { ElementType } from '@/types/bazi'

function makeFactPack(overrides?: Partial<YongShenFactPack>): YongShenFactPack {
  return {
    primaryMethod: '扶抑',
    dayMaster: '戊',
    dayMasterElement: '土' as ElementType,
    yongShen: [
      { gan: '甲', element: '木' as ElementType, tenGod: '七杀', score: 8, reason: '克身平衡' },
      { gan: '癸', element: '水' as ElementType, tenGod: '正财', score: 7, reason: '调候用水' },
    ],
    jiShen: [
      { gan: '戊', element: '土' as ElementType, tenGod: '比肩', score: -6, reason: '加重身旺' },
      { gan: '己', element: '土' as ElementType, tenGod: '劫财', score: -5, reason: '比劫夺财' },
    ],
    tiaoHou: {
      active: true,
      pattern: '火炎土燥',
      needs: ['水' as ElementType],
      detail: '夏土需水润局',
    },
    tongGuan: { active: false, detail: '' },
    isSpecialGe: false,
    summary: '喜甲癸，忌戊己',
    ...overrides,
  }
}

// 一段合规的喜用神解读（约 280 字去空白）
const VALID_TEXT = `你的命局核心需要木与水——甲木疏土、癸水润局，所以甲和癸是你的喜用神。甲木是你的「七杀」，癸水是你的「正财」，它们分别承担不同的角色：甲木负责克土平衡、让命局不至于过厚重；癸水负责润燥、补足调候上的需求——古籍称之为「火炎土燥」的结构，意思是火多缺水、土性偏燥，所以水的力量对你来说格外珍贵。

反过来说，戊土和己土对你来说是需要多留意的方向。命局土本来就厚，再加土，就像在已经层层叠叠的厚土上再堆一层——不是不好，而是不太容易推动新的变化。不过这不意味着土是坏的，而是提醒你：在需要灵活和变通的时候，可以试试每天给自己留一段不排计划的时间，或者周末去有水有树的地方走一走。

总的来说：你的命局最需要的能量是木的舒展与水的流动——有了这两样，厚重的土才能长出东西、活起来。`

describe('validateYongShenReading', () => {
  // ── 测试 1：全部规则通过 ──
  it('合规文本 → passed=true, violations=[]', () => {
    const fp = makeFactPack()
    const result = validateYongShenReading(VALID_TEXT, fp)
    expect(result.passed).toBe(true)
    expect(result.violations.filter((v) => v.severity === 'hard')).toHaveLength(0)
  })

  // ── 测试 2：绝对化词汇触发规则 1 ──
  it('含"一定" → 规则1触发', () => {
    const fp = makeFactPack()
    const text = VALID_TEXT.replace(
      '所以甲和癸是你的喜用神',
      '所以甲和癸一定是你的喜用神',
    )
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则1_绝对化词汇')).toBe(true)
  })

  // ── 测试 3：含"凶"字触发规则 B ──
  it('含"凶" → 规则B触发', () => {
    const fp = makeFactPack()
    const text = VALID_TEXT.replace(
      '而是不太容易推动新的变化',
      '而是凶险难测的阻碍',
    )
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则B_忌神温和度')).toBe(true)
  })

  // ── 测试 4：篇幅过短触发规则 9 ──
  it('篇幅 <250 字 → 规则9触发(过短)', () => {
    const fp = makeFactPack()
    const text = '甲木是你的喜用神。'
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则9_篇幅过短')).toBe(true)
  })

  // ── 测试 5：篇幅过长触发规则 9 ──
  it('篇幅 >800 字 → 规则9触发(过长)', () => {
    const fp = makeFactPack()
    // 重复 VALID_TEXT 4 次确保远超 1000 字（313 × 4 = 1252）
    const longText = VALID_TEXT + '\n\n' + VALID_TEXT + '\n\n' + VALID_TEXT + '\n\n' + VALID_TEXT
    const result = validateYongShenReading(longText, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则9_篇幅过长')).toBe(true)
  })

  // ── 测试 6：喜用神天干完全没出现触发规则 A ──
  it('喜用神天干未出现 → 规则A触发', () => {
    const fp = makeFactPack()
    const text =
      '你的命局喜用神是木五行和水五行的天干——它们帮你平衡过旺的土、'
      + '补足稀缺的润泽。木负责疏土让命局不至于过厚重，水负责润燥补足调候需求。'
      + '古籍称之为「火炎土燥」的结构，意思是火多缺水、土性偏燥，所以水的力量'
      + '对你来说格外珍贵。不过反过来看，土五行和比劫对你来说是需要多留意的方向。'
      + '总的来说，你的命局最需要的能量是木的舒展与水的流动，有了这两样才能活起来。'
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则A_喜用神天干缺失')).toBe(true)
  })

  // ── 测试 7：从格命局但提到"平衡"触发规则 C ──
  it('从格+平衡 → 规则C触发', () => {
    const fp = makeFactPack({
      primaryMethod: '从格',
      isSpecialGe: true,
      dayMaster: '庚',
      dayMasterElement: '金' as ElementType,
      yongShen: [
        { gan: '甲', element: '木' as ElementType, tenGod: '偏财', score: 8, reason: '从财用神' },
        { gan: '乙', element: '木' as ElementType, tenGod: '正财', score: 7, reason: '从财辅神' },
      ],
      jiShen: [
        { gan: '戊', element: '土' as ElementType, tenGod: '偏印', score: -6, reason: '破格' },
      ],
      tiaoHou: { active: false, detail: '' },
    })
    const text =
      '你的命局走从格路线，甲木和乙木是你的喜用神。'
      + '在从格中，喜用神顺着旺势走，而不是追求五行的平衡与中和。'
      + '不过这不意味着不需要调整——而是调整的方向跟普通命局不同。'
      + '甲木作为偏财，乙木作为正财，它们都是你命局中最顺手的能量方向。'
      + '需要留意的是戊土，它是日主庚金的印星，在从格中反而会打破顺势的结构。'
      + '总的来说，顺势而为比硬求平衡更适合你的命局节奏。'
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则C_特殊格局术语矛盾')).toBe(true)
  })

  // ── 测试 8：火炎土燥解释含"并非...而是..."触发规则 D ──
  it('火炎土燥+重新定义句式 → 规则D触发', () => {
    const fp = makeFactPack()
    const text = VALID_TEXT.replace(
      '意思是火多缺水、土性偏燥',
      '并非指季节寒暖失衡，而是火土能量集结的表现',
    )
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则D_调候术语被重新定义')).toBe(true)
  })

  // ── 测试 9：火炎土燥解释未含核心字触发规则 D ──
  it('火炎土燥解释缺核心字 → 规则D触发', () => {
    const fp = makeFactPack()
    const text = VALID_TEXT.replace(
      '意思是火多缺水、土性偏燥，所以水的力量对你来说格外珍贵',
      '是指一种特殊的五行组合形态，所以水的力量对你来说格外珍贵',
    )
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则D_调候术语解释偏离原意')).toBe(true)
  })

  // ── 测试 10：含抽象表达"多留意跟 X 相关的节奏"触发规则 F ──
  it('含"多留意跟X相关的节奏" → 规则F触发', () => {
    const fp = makeFactPack()
    const text = VALID_TEXT.replace(
      '活起来。',
      '活起来。在生活中，多留意跟木、水相关的节奏，亲近水五行来调整。',
    )
    const result = validateYongShenReading(text, fp)
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.rule === '规则F_禁用抽象表达')).toBe(true)
  })

  // ── 测试 11：提到了不在 yongShen 列表的天干 → 规则 E 触发，但 passed=true ──
  it('非喜用神天干出现在"用神"附近 → 规则E触发(软规则,passed=true)', () => {
    const fp = makeFactPack()
    const text = VALID_TEXT.replace(
      '所以甲和癸是你的喜用神',
      '所以甲和癸是你的喜用神，丙火也是常被提及的用神之一',
    )
    const result = validateYongShenReading(text, fp)
    // 软规则不影响 passed
    expect(result.passed).toBe(true)
    // 规则 E 被触发
    const eViolation = result.violations.find((v) => v.rule === '规则E_喜用神列表疑似不一致')
    expect(eViolation).toBeDefined()
    expect(eViolation!.severity).toBe('soft')
    // 没有其他 hard 违规
    expect(result.violations.filter((v) => v.severity === 'hard')).toHaveLength(0)
  })
})
