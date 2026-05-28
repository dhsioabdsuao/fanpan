import type { YongShenFactPack } from './types'

export interface ValidationResult {
  passed: boolean
  violations: Array<{
    rule: string
    detail: string
    snippet: string
    severity: 'hard' | 'soft'
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

// ── 规则 1：绝对化词汇 ──
const ABSOLUTE_WORDS = ['一定', '必然', '绝对', '肯定', '无疑', '百分百', '肯定会']

// ── 规则 2：极端化性格判决 ──
const PERSONALITY_PATTERNS = /你就是|你天生|你性格/g
const EXTREME_ADJECTIVES = [
  '保守', '激进', '刚愎', '自负', '固执', '孤僻', '外向', '内向',
  '优柔寡断', '独断专行', '敏感多疑', '孤傲', '势利', '薄情',
  '阴险', '冷漠', '脆弱', '强势', '软弱',
]

// ── 规则 3：预测句式 ──
const PREDICTION_PATTERNS = [
  /你将会/g,
  /你会在.{0,5}岁/g,
  /你未来/g,
  /你的人生.{0,10}(会|将)/g,
  /\d+岁时/g,
]

// ── 规则 4：禁忌词 ──
const TABOO_WORDS = [
  '寿命', '夭折', '灾祸', '刑克', '克夫', '克妻', '克子',
  '横祸', '车祸', '癌', '中风', '猝死', '命短', '命长',
  '命好', '命坏', '福寿', '福气', '官非', '牢狱',
]

// ── 规则 5：行动建议强制性 ──
const IMPERATIVE_WORDS = ['必须', '务必', '应当', '非要不可', '切忌']

// ── 规则 6：其他流派术语 ──
const OTHER_SCHOOL_TERMS = [
  '化禄', '化权', '化科', '化忌',
  '紫微', '天府', '北斗', '星座', '塔罗', '宫位',
  '三魂七魄', '魂魄', '宿曜',
]

// ── 规则 7：健康严重表述 ──
const SEVERE_HEALTH_TERMS = [
  '癌', '中风', '心脏病', '肝硬化', '肾衰', '糖尿病', '高血压',
  '抑郁症', '焦虑症', '肿瘤', '脑梗',
]
const SEVERE_HEALTH_PATTERNS = [
  /你.{0,5}(肝胆|心脏|肾|脾胃|肺).{0,5}(不好|有问题|虚弱|出问题)/g,
]

// ── 规则 8：双面性转折词 ──
const TURN_WORDS = ['但是', '不过', '然而', '另一方面', '反过来说', '代价是', '与此同时']

// ── 规则 10：超出阶段范围 ──
const OUT_OF_SCOPE_TERMS = [
  '大运', '流年', '今年你', '明年你',
  '正官格', '七杀格', '伤官格', '食神格', '财格', '印格',
  '桃花', '驿马', '华盖', '天乙贵人',
]

// ── 规则 B：忌神温和度 ──
const JI_SHEN_BANNED = [
  '凶', '灾', '祸', '破财', '败局', '败', '大忌', '最忌', '危险',
  '克夫', '克妻', '克子',
]

// ── 规则 C：特殊格局矛盾词 ──
const SPECIAL_GE_TERMS = ['从格', '从强', '从旺', '从杀', '从财', '从儿', '从势', '顺势', '化格', '合化', '化神', '假从']
const CONTRADICT_TERMS = ['平衡', '中和']

// ── 规则 D：调候核心字 ──
const CLIMATIC_CORE_WORDS: Record<string, string[]> = {
  '火炎土燥': ['缺水', '燥', '干', '热'],
  '金水寒滞': ['缺火', '寒', '冷'],
  '水冷土湿': ['湿', '冷', '缺火'],
  '木火通明': ['明亮', '通达', '生发'],
}

// ── 规则 F：禁用抽象表达 ──
const ABSTRACT_EXPRESSIONS = [
  /多留意跟.{0,10}相关的节奏/g,
  /向.{0,10}的方向倾斜/g,
  /多接触.{0,10}元素/g,
  /亲近.{0,10}五行/g,
  /在生活中多关注.{0,10}方面/g,
  /有意识地向.{0,10}靠拢/g,
]

// ── 规则 E：天干字符 ──
const ALL_GAN_CHARS = /[甲乙丙丁戊己庚辛壬癸]/g

export function validateYongShenReading(
  text: string,
  factPack: YongShenFactPack,
): ValidationResult {
  const violations: ValidationResult['violations'] = []

  // ── 规则 1：绝对化词汇 ──
  for (const word of ABSOLUTE_WORDS) {
    if (text.includes(word)) {
      violations.push({
        rule: '规则1_绝对化词汇',
        detail: `出现绝对化词汇"${word}"`,
        snippet: extractContext(text, word, 15),
        severity: 'hard',
      })
      break
    }
  }

  // ── 规则 2：极端化性格判决 ──
  let match: RegExpExecArray | null
  while ((match = PERSONALITY_PATTERNS.exec(text)) !== null) {
    const afterMatch = text.slice(
      match.index + match[0].length,
      match.index + match[0].length + 15,
    )
    for (const adj of EXTREME_ADJECTIVES) {
      if (afterMatch.includes(adj)) {
        violations.push({
          rule: '规则2_极端化性格判决',
          detail: `"${match[0]}" 附近出现极端形容词"${adj}"`,
          snippet: extractContext(text, adj, 15),
          severity: 'hard',
        })
        break
      }
    }
    if (violations.some((v) => v.rule === '规则2_极端化性格判决')) break
  }

  // ── 规则 3：预测句式 ──
  for (const pattern of PREDICTION_PATTERNS) {
    if (pattern.test(text)) {
      const matchText = text.match(pattern)?.[0] ?? ''
      violations.push({
        rule: '规则3_预测句式',
        detail: `命中预测句式："${matchText}"`,
        snippet: extractContext(text, matchText, 15),
        severity: 'hard',
      })
      break
    }
  }

  // ── 规则 4：禁忌词 ──
  for (const word of TABOO_WORDS) {
    if (text.includes(word)) {
      violations.push({
        rule: '规则4_禁忌词',
        detail: `出现禁忌词"${word}"`,
        snippet: extractContext(text, word, 15),
        severity: 'hard',
      })
      break
    }
  }

  // ── 规则 5：行动建议强制性 ──
  for (const word of IMPERATIVE_WORDS) {
    if (text.includes(word)) {
      violations.push({
        rule: '规则5_行动建议强制性',
        detail: `出现强制性词汇"${word}"`,
        snippet: extractContext(text, word, 15),
        severity: 'hard',
      })
      break
    }
  }

  // ── 规则 6：其他流派术语 ──
  for (const term of OTHER_SCHOOL_TERMS) {
    if (text.includes(term)) {
      violations.push({
        rule: '规则6_其他流派术语',
        detail: `出现其他流派术语"${term}"`,
        snippet: extractContext(text, term, 15),
        severity: 'hard',
      })
      break
    }
  }

  // ── 规则 7：健康严重表述 ──
  for (const term of SEVERE_HEALTH_TERMS) {
    if (text.includes(term)) {
      violations.push({
        rule: '规则7_健康严重表述',
        detail: `出现严重健康术语"${term}"`,
        snippet: extractContext(text, term, 15),
        severity: 'hard',
      })
      break
    }
  }
  if (!violations.some((v) => v.rule === '规则7_健康严重表述')) {
    for (const pattern of SEVERE_HEALTH_PATTERNS) {
      const m = pattern.exec(text)
      if (m) {
        violations.push({
          rule: '规则7_健康严重表述',
          detail: `命中禁止的健康句式："${m[0]}"`,
          snippet: extractContext(text, m[0], 15),
          severity: 'hard',
        })
        break
      }
    }
  }

  // ── 规则 8：双面性检查 ──
  const hasTurnWord = TURN_WORDS.some((w) => text.includes(w))
  if (!hasTurnWord) {
    violations.push({
      rule: '规则8_双面性缺失',
      detail: '全文未出现转折词（但是/不过/然而/另一方面/反过来说/代价是/与此同时），缺少双面性',
      snippet: text.slice(0, 40) + '…',
      severity: 'hard',
    })
  }

  // ── 规则 9：篇幅检查 ──
  const stripped = text.replace(/\s/g, '')
  if (stripped.length < 250) {
    violations.push({
      rule: '规则9_篇幅过短',
      detail: `去除空白后 ${stripped.length} 字（要求 ≥ 250 字）`,
      snippet: text.slice(0, 50) + '…',
      severity: 'hard',
    })
  } else if (stripped.length > 1000) {
    violations.push({
      rule: '规则9_篇幅过长',
      detail: `去除空白后 ${stripped.length} 字（要求 ≤ 1000 字）`,
      snippet: text.slice(0, 50) + '…',
      severity: 'hard',
    })
  }

  // ── 规则 10：超出阶段范围 ──
  for (const term of OUT_OF_SCOPE_TERMS) {
    if (text.includes(term)) {
      violations.push({
        rule: '规则10_超出阶段范围',
        detail: `出现超出阶段范围的术语"${term}"`,
        snippet: extractContext(text, term, 15),
        severity: 'hard',
      })
      break
    }
  }

  // ── 规则 A：喜用神天干必须出现（hard）──
  const yongGanList = factPack.yongShen.map((g) => g.gan)
  const hasYongGan = yongGanList.some((gan) => text.includes(gan))
  if (!hasYongGan) {
    violations.push({
      rule: '规则A_喜用神天干缺失',
      detail: `喜用神天干 ${yongGanList.join('、')} 均未在正文中出现`,
      snippet: text.slice(0, 50) + '…',
      severity: 'hard',
    })
  }

  // ── 规则 B：忌神温和度（hard）──
  for (const word of JI_SHEN_BANNED) {
    if (text.includes(word)) {
      violations.push({
        rule: '规则B_忌神温和度',
        detail: `忌神描述出现激烈词汇"${word}"`,
        snippet: extractContext(text, word, 15),
        severity: 'hard',
      })
      break
    }
  }

  // ── 规则 C：特殊格局术语一致（hard）──
  if (factPack.isSpecialGe) {
    const hasSpecialTerm = SPECIAL_GE_TERMS.some((t) => text.includes(t))
    const hasContradict = CONTRADICT_TERMS.some((t) => text.includes(t))
    if (hasSpecialTerm && hasContradict) {
      violations.push({
        rule: '规则C_特殊格局术语矛盾',
        detail: `特殊格局（${factPack.primaryMethod}）出现矛盾的"平衡/中和"描述`,
        snippet: extractContext(
          text,
          CONTRADICT_TERMS.find((t) => text.includes(t)) ?? '平衡',
          20,
        ),
        severity: 'hard',
      })
    }
  }

  // ── 规则 D：调候术语贴合原意（hard）──
  const pattern = factPack.tiaoHou?.pattern
  if (factPack.tiaoHou.active && pattern && pattern !== '平衡') {
    if (text.includes(pattern)) {
      const patternIndex = text.indexOf(pattern)
      const contextStart = Math.max(0, patternIndex - 10)
      const contextEnd = Math.min(text.length, patternIndex + pattern.length + 80)
      const context = text.slice(contextStart, contextEnd)

      // D1：重新定义句式
      const redefinitionPattern = /并非.{0,30}而是/
      if (redefinitionPattern.test(context)) {
        violations.push({
          rule: '规则D_调候术语被重新定义',
          detail: `古籍术语"${pattern}"附近出现"并非...而是..."重新定义句式`,
          snippet: context.slice(0, 80),
          severity: 'hard',
        })
      }

      // D2：解释后必须含核心字
      const afterPattern = text.slice(
        patternIndex + pattern.length,
        patternIndex + pattern.length + 60,
      )
      const hasExplanation = /[——:::、,。是指描述].{0,5}[^,。\s]/.test(afterPattern)

      if (hasExplanation) {
        const required = CLIMATIC_CORE_WORDS[pattern]
        if (required) {
          const hasCoreWord = required.some((w) => afterPattern.includes(w))
          if (!hasCoreWord) {
            violations.push({
              rule: '规则D_调候术语解释偏离原意',
              detail: `"${pattern}"被解释，但未出现核心字${required.join('/')}之一`,
              snippet: afterPattern.slice(0, 50),
              severity: 'hard',
            })
          }
        }
      }
    }
  }

  // ── 规则 E：喜用神列表一致性（soft）──
  const yongGanSet = new Set(yongGanList)
  ALL_GAN_CHARS.lastIndex = 0
  let ganMatch: RegExpExecArray | null
  while ((ganMatch = ALL_GAN_CHARS.exec(text)) !== null) {
    const gan = ganMatch[0]
    if (yongGanSet.has(gan)) continue

    const ganIdx = ganMatch.index
    // 检查该天干是否在“用神”或“喜用”附近（±30 字）
    const nearbyStart = Math.max(0, ganIdx - 30)
    const nearbyEnd = Math.min(text.length, ganIdx + gan.length + 30)
    const nearby = text.slice(nearbyStart, nearbyEnd)

    if (/用神|喜用/.test(nearby)) {
      violations.push({
        rule: '规则E_喜用神列表疑似不一致',
        detail: `天干"${gan}"不在喜用神列表 ${yongGanList.join('、')} 中，但出现在"用神/喜用"附近`,
        snippet: extractContext(text, gan, 25),
        severity: 'soft',
      })
      break // 只报一次
    }
  }

  // ── 规则 F：禁用抽象表达（hard）──
  for (const pattern of ABSTRACT_EXPRESSIONS) {
    pattern.lastIndex = 0
    const m = pattern.exec(text)
    if (m) {
      violations.push({
        rule: '规则F_禁用抽象表达',
        detail: `行动建议出现抽象表达："${m[0]}"，必须替换为具体行为/场景/习惯`,
        snippet: extractContext(text, m[0], 20),
        severity: 'hard',
      })
      break
    }
  }

  // ── 判定 passed：无 hard 违规即为通过 ──
  const hardViolations = violations.filter((v) => v.severity === 'hard')

  return {
    passed: hardViolations.length === 0,
    violations,
  }
}
