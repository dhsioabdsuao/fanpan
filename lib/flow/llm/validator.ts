import type { FlowFactPack } from '../types'

export interface ValidationResult {
  passed: boolean
  violations: Array<{
    rule: string
    detail: string
    snippet: string
  }>
}

function extractContext(text: string, keyword: string, radius: number): string {
  const idx = text.indexOf(keyword)
  if (idx === -1) return keyword
  const start = Math.max(0, idx - radius)
  const end = Math.min(text.length, idx + keyword.length + radius)
  let snippet = text.slice(start, end)
  if (start > 0) snippet = '…' + snippet
  if (end < text.length) snippet = snippet + '…'
  return snippet
}

const ABSOLUTE_WORDS = ['一定', '必然', '绝对', '永远', '从不', '注定', '必将']

const EXTREME_ADJECTIVES = [
  '保守', '激进', '刚愎', '自负', '固执', '孤僻', '外向', '内向',
  '优柔寡断', '独断专行', '敏感多疑', '孤傲', '势利', '薄情',
  '阴险', '冷漠',
]

const PERSONALITY_PATTERNS = /你性格|你为人|你天生|你是/g

const PREDICTION_PATTERNS = [
  /你将会/g,
  /你会在.{0,5}岁/g,
  /你未来/g,
  /\d+岁时你/g,
  /到了.{0,5}岁/g,
]

const TABOO_WORDS = ['寿命', '寿元', '死亡', '早夭', '凶险', '灾祸', '病灾', '横祸']

const IMPERATIVE_WORDS = ['必须', '务必', '一定要', '你只有', '否则你会', '立刻去']

const OTHER_SCHOOL_TERMS = [
  '化禄', '化忌', '化科', '化权', '紫微', '天府', '廉贞', '武曲',
  '三魂七魄', '魂魄', '宿曜',
]

const SEVERE_HEALTH_TERMS = [
  '癌', '中风', '心脏病', '肝硬化', '肾衰', '糖尿病', '高血压',
  '抑郁症', '焦虑症',
]

const SEVERE_HEALTH_PATTERNS = [
  /你.{0,5}(肝胆|心脏|肾|脾胃|肺).{0,5}(不好|有问题|虚弱|出问题)/g,
]

const TURN_WORDS = ['同时', '但', '不过', '另一方面', '反过来']

const OUT_OF_SCOPE_TERMS = [
  '大运', '流年', '今年你', '明年你',
  '正官格', '七杀格', '伤官格', '食神格', '财格', '印格',
  '桃花', '驿马', '华盖', '天乙贵人',
]

export function validateLlmOutput(
  text: string,
  factPack: FlowFactPack
): ValidationResult {
  const violations: ValidationResult['violations'] = []

  // 规则 1 — 绝对化词汇
  for (const word of ABSOLUTE_WORDS) {
    if (text.includes(word)) {
      violations.push({
        rule: '规则1_绝对化词汇',
        detail: `出现"${word}"`,
        snippet: extractContext(text, word, 15),
      })
      break // 一条规则只报一次
    }
  }

  // 规则 2 — 极端化性格判决
  let match: RegExpExecArray | null
  while ((match = PERSONALITY_PATTERNS.exec(text)) !== null) {
    const afterMatch = text.slice(match.index + match[0].length, match.index + match[0].length + 15)
    for (const adj of EXTREME_ADJECTIVES) {
      if (afterMatch.includes(adj)) {
        violations.push({
          rule: '规则2_极端化性格判决',
          detail: `"${match[0]}" 附近出现极端形容词"${adj}"`,
          snippet: extractContext(text, adj, 15),
        })
        break
      }
    }
    if (violations.some(v => v.rule === '规则2_极端化性格判决')) break
  }

  // 规则 3 — 预测句式
  for (const pattern of PREDICTION_PATTERNS) {
    if (pattern.test(text)) {
      const matchText = text.match(pattern)?.[0] ?? ''
      violations.push({
        rule: '规则3_预测句式',
        detail: `命中预测句式: "${matchText}"`,
        snippet: extractContext(text, matchText, 15),
      })
      break
    }
  }

  // 规则 4 — 禁忌词
  for (const word of TABOO_WORDS) {
    if (text.includes(word)) {
      violations.push({
        rule: '规则4_禁忌词',
        detail: `出现禁忌词"${word}"`,
        snippet: extractContext(text, word, 15),
      })
      break
    }
  }

  // 规则 5 — 行动建议强制性词汇
  for (const word of IMPERATIVE_WORDS) {
    if (text.includes(word)) {
      violations.push({
        rule: '规则5_行动建议强制性',
        detail: `出现强制性词汇"${word}"`,
        snippet: extractContext(text, word, 15),
      })
      break
    }
  }

  // 规则 6 — 其他流派术语
  for (const term of OTHER_SCHOOL_TERMS) {
    if (text.includes(term)) {
      violations.push({
        rule: '规则6_其他流派术语',
        detail: `出现其他流派术语"${term}"`,
        snippet: extractContext(text, term, 15),
      })
      break
    }
  }

  // 规则 7 — 健康的严重表述
  for (const term of SEVERE_HEALTH_TERMS) {
    if (text.includes(term)) {
      violations.push({
        rule: '规则7_健康严重表述',
        detail: `出现严重健康术语"${term}"`,
        snippet: extractContext(text, term, 15),
      })
      break
    }
  }
  if (!violations.some(v => v.rule === '规则7_健康严重表述')) {
    for (const pattern of SEVERE_HEALTH_PATTERNS) {
      const m = pattern.exec(text)
      if (m) {
        violations.push({
          rule: '规则7_健康严重表述',
          detail: `命中禁止的健康句式: "${m[0]}"`,
          snippet: extractContext(text, m[0], 15),
        })
        break
      }
    }
  }

  // 规则 8 — 双面性检查
  const hasTurnWord = TURN_WORDS.some(w => text.includes(w))
  if (!hasTurnWord) {
    violations.push({
      rule: '规则8_双面性缺失',
      detail: '全文未出现转折词（同时/但/不过/另一方面/反过来），缺少双面性',
      snippet: text.slice(0, 40) + '…',
    })
  }

  // 规则 9 — 篇幅检查
  const stripped = text.replace(/\s/g, '')
  if (stripped.length < 200) {
    violations.push({
      rule: '规则9_篇幅过短',
      detail: `去除空白后 ${stripped.length} 字（要求 ≥ 200 字）`,
      snippet: text.slice(0, 50) + '…',
    })
  } else if (stripped.length > 700) {
    violations.push({
      rule: '规则9_篇幅过长',
      detail: `去除空白后 ${stripped.length} 字（要求 ≤ 700 字）`,
      snippet: text.slice(0, 50) + '…',
    })
  }

  // 规则 10 — 超出阶段范围
  for (const term of OUT_OF_SCOPE_TERMS) {
    if (text.includes(term)) {
      violations.push({
        rule: '规则10_超出阶段范围',
        detail: `出现超出阶段范围的术语"${term}"`,
        snippet: extractContext(text, term, 15),
      })
      break
    }
  }

  // 规则 11 — 调候层必须引用（climaticBalance.pattern 不为"平衡"时）
  const pattern = factPack.climaticBalance.pattern
  if (pattern && pattern !== '平衡') {
    if (!text.includes(pattern)) {
      violations.push({
        rule: '规则11_调候层未引用',
        detail: `事实包中 climaticBalance.pattern="${pattern}",但解读未引用`,
        snippet: '',
      })
    }

    // 规则 12 — 古籍术语解释不能偏离原意（pattern 已出现在 text 中时检查）
    if (text.includes(pattern)) {
      const patternIndex = text.indexOf(pattern)
      const contextStart = Math.max(0, patternIndex - 10)
      const contextEnd = Math.min(text.length, patternIndex + pattern.length + 80)
      const context = text.slice(contextStart, contextEnd)

      // 12a: 危险句式 "并非...而是..."（典型的重新定义结构）
      const redefinitionPattern = /并非.{0,30}而是/
      if (redefinitionPattern.test(context)) {
        violations.push({
          rule: '规则12_古籍术语被重新定义',
          detail: `古籍术语"${pattern}"附近出现"并非...而是..."重新定义句式`,
          snippet: context.slice(0, 80),
        })
      }

      // 12b: 如果 pattern 后有解释性内容,必须含核心字
      const afterPattern = text.slice(
        patternIndex + pattern.length,
        patternIndex + pattern.length + 60
      )
      const hasExplanation = /[——:::、,。是指描述].{0,5}[^,。\s]/.test(afterPattern)

      if (hasExplanation) {
        const coreWords: Record<string, string[]> = {
          '火炎土燥': ['缺水', '燥', '干', '热'],
          '金水寒滞': ['缺火', '寒', '冷'],
          '水冷土湿': ['湿', '冷', '缺火'],
          '木火通明': ['明亮', '通达', '生发'],
        }

        const required = coreWords[pattern]
        if (required) {
          const hasCoreWord = required.some(w => afterPattern.includes(w))
          if (!hasCoreWord) {
            violations.push({
              rule: '规则12_古籍术语解释偏离原意',
              detail: `"${pattern}"被解释,但未出现核心字${required.join('/')}之一`,
              snippet: afterPattern.slice(0, 50),
            })
          }
        }
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  }
}
