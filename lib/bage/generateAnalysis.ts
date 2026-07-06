import type { BaziResult, ElementType } from '@/types/bazi'
import type { ExtractResult } from './extractPattern'
import type { AssessResult } from './assessOutcome'
import type { StrengthResult } from '@/lib/strength/determineStrength'
import { getHiddenStemsSpec } from './helpers'
import { getTenGod } from '@/lib/bazi-utils'

// ── 类型 ──

export interface AnalysisInput {
  bazi: BaziResult
  pattern: ExtractResult
  outcome: AssessResult
  strength: StrengthResult
}

export interface AnalysisResult {
  /** 一句话总结：≤30字，无专业名词，优先用比喻 */
  summary: string
  /** 专业解析：按5个模块组织 */
  analysis: string
}

// ── 专业名词白话解释 ──

const TEN_GOD_BRIEF: Record<string, string> = {
  '正官': '正官——你的规则感和责任心',
  '七杀': '七杀——你的野心、魄力和不服输的冲劲',
  '正财': '正财——你一步一个脚印积累的资源',
  '偏财': '偏财——你把握机遇、汇聚人脉的能力',
  '正印': '正印——你的学识、智慧和背后的贵人',
  '偏印': '偏印——你独特的领悟力与偏门才华',
  '食神': '食神——你温和的创造力与享受生活的能力',
  '伤官': '伤官——你的聪明、反叛与不拘一格的才气',
  '比肩': '比肩——你的自我意识和独立精神',
  '劫财': '劫财——你的合作力与亲密战友',
  '印星': '印星（正印与偏印的统称）——你的学识与庇护之力',
  '财星': '财星（正财与偏财的统称）——你的财富与价值创造力',
  '官星': '官星——你的规则意识与约束力',
  '官杀': '官杀（正官与七杀的统称）——你的权威感与驱动力',
  '食伤': '食伤（食神与伤官的统称）——你的才华与表达欲',
}

const PATTERN_BRIEF: Record<string, string> = {
  '正官格': '正官格——你的命局以"正官"为主导，天生有分寸感和责任心，行事讲规矩、重信誉',
  '七杀格': '七杀格——你的命局以"七杀"为主导，天生有一股"将帅之气"，敢闯敢拼，不甘居于人下',
  '正财格': '正财格——你的命局以"正财"为主导，务实稳健，懂得脚踏实地地经营自己的人生',
  '偏财格': '偏财格——你的命局以"偏财"为主导，善于借势而起，有敏锐的商业嗅觉',
  '正印格': '正印格——你的命局以"正印"为主导，重学识、好思考，遇到困难时总有化解的智慧',
  '偏印格': '偏印格——你的命局以"偏印"为主导，拥有独特的视角和特殊的领悟力',
  '食神格': '食神格——你的命局以"食神"为主导，温和大度，能把日常生活打磨成艺术品',
  '伤官格': '伤官格——你的命局以"伤官"为主导，聪明绝顶，不愿走寻常路',
  '建禄月劫格': '建禄月劫格——你的命局以"比劫"为主导，天性独立，凡事喜欢靠自己，不喜受人摆布',
  '阳刃格': '阳刃格——你的命局以"阳刃"为主导，性格刚烈果断，是天生的行动派',
}

// ── 用神十神获取 ──

function getYongShenTenGod(bazi: BaziResult, pattern: ExtractResult): string {
  if (pattern.category === '建禄月劫格') {
    return pattern.luJieYongShenTenGod ?? '财官'
  }
  return getTenGod(bazi.dayMaster, pattern.yongShen)
}

// ── 帮助：获取干支十神名字 ──

function getTenGodName(tenGod: string): string {
  if (TEN_GOD_BRIEF[tenGod]) return tenGod
  // 处理简写
  const map: Record<string, string> = {
    '财': '正财', '官': '正官', '杀': '七杀', '印': '正印',
    '食': '食神', '伤': '伤官', '劫': '劫财', '比': '比肩',
  }
  return map[tenGod] ?? tenGod
}

// ═══════════════════════════════════════════
// 第一层：一句话总结
// ═══════════════════════════════════════════

function getSummaryLine(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
): string {
  const tiaoHouIssue = getTiaoHouType(bazi)

  // 破格优先 —— 结构被破坏，用断裂/失衡比喻
  if (outcome.outcome === '破格') {
    return getPoGeSummary(pattern, outcome, strength)
  }

  // 不成格 —— 缺少关键要素
  if (outcome.outcome === '不成格') {
    return getBuChengSummary(pattern, outcome)
  }

  // 成格 —— 有相神则协同，无相神则自立
  return getChengGeSummary(pattern, outcome, strength, tiaoHouIssue)
}

function getPoGeSummary(
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
): string {
  const cat = pattern.category

  if (cat === '官格') return '规则的守护者，裁判却被人收买了'
  if (cat === '杀格') return '一把无鞘的快刀，锋芒虽利却容易伤手'
  if (cat === '财格') return '聚宝盆底有个洞，进多少漏多少'
  if (cat === '印格') return '背后的大树倒了，你得靠自己站立'
  if (cat === '食神格') return '匠人丢了工具，巧思无处可施'
  if (cat === '伤官格') return '野马挣脱了缰绳，跑得快但不知奔向何方'
  if (cat === '建禄月劫格') return '习惯了一个人扛，但这次需要帮手'
  if (cat === '阳刃格') return '刀口卷了刃，有劲使不出'

  return '一栋房子断了梁柱，住着不太安稳'
}

function getBuChengSummary(
  pattern: ExtractResult,
  outcome: AssessResult,
): string {
  const cat = pattern.category

  if (cat === '官格') return '规则还没成型，你要自己画跑道'
  if (cat === '杀格') return '刀在鞘中，等一个拔刀的时机'
  if (cat === '财格') return '田地已犁好，等春雨来播种'
  if (cat === '印格') return '书已翻开，等一位领你入门的老师'
  if (cat === '食神格') return '才华已在酝酿，等一个表达的出口'
  if (cat === '伤官格') return '满脑子点子，缺一双落地的手'
  if (cat === '建禄月劫格') return '独立惯了，但要学会借东风'
  if (cat === '阳刃格') return '刀已出鞘，等一个值得挥刀的目标'

  return '还差一口气，等时运来补上这最后一块拼图'
}

function getChengGeSummary(
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
  tiaoHouIssue: string | null,
): string {
  const cat = pattern.category

  if (tiaoHouIssue === '火炎土燥') {
    if (cat === '伤官格') return '烈日下的野马，等一场雨来降降温'
    if (cat === '杀格') return '烈日下的刀锋，需要一盆水来淬火'
    return '内心像烈日下的荒漠，等一场雨来滋润'
  }
  if (tiaoHouIssue === '金寒水冷') {
    if (cat === '印格') return '冬天的湖面下，藏着待点燃的火种'
    return '冰雪覆盖的火山，等一缕阳光来融化'
  }

  if (outcome.xiangShen) {
    if (cat === '杀格') return '一把开了刃的好刀，有人帮你握住了刀鞘'
    if (cat === '官格') return '规则是你的护身符，也是你最好的跑道'
    if (cat === '财格') return '聚宝盆配上了摇钱树，盘活了'
    if (cat === '印格') return '背后有靠山，手里有地图，走得稳'
    if (cat === '食神格') return '匠人有了订单，才艺变成了作品'
    if (cat === '伤官格') return '野马有了骑手，速度和方向都有了'
    if (cat === '建禄月劫格') return '一个人走得快，有了帮手走得远'
    if (cat === '阳刃格') return '宝刀配了鞘，能收能放'
    return '梁柱齐全的房子，住着踏实'
  }

  // 成格但无相神
  if (cat === '杀格') return '一把快刀，不靠外力，自成锋芒'
  if (cat === '官格') return '独行侠也有规则，不靠别人也走得稳'
  if (cat === '建禄月劫格') return '天生靠自己的命，也走对了方向'

  return '自成体系，不假外求，一棵树也能成林'
}

// ═══════════════════════════════════════════
// 第二层：专业解析（5模块）
// ═══════════════════════════════════════════

// ── 取格依据 ──

function getOriginNote(bazi: BaziResult, pattern: ExtractResult): string {
  const mb = bazi.pillars.month.branch
  const hidden = getHiddenStemsSpec(mb)
  const benQi = hidden[0]
  const benQiTenGod = getTenGod(bazi.dayMaster, benQi)
  const yongShenTg = getYongShenTenGod(bazi, pattern)

  switch (pattern.origin) {
    case '透干': {
      if (pattern.yongShen === benQi) {
        return `月令在"${mb}"，本气${benQi}（${benQiTenGod}）透出在天干上，由此取格`
      }
      return `月令在"${mb}"，${pattern.yongShen}（${yongShenTg}）透出在天干上，由此取格`
    }
    case '会支':
      return `月令在"${mb}"，地支形成了合会局，改变了原有气场，由此取格`
    case '不透不会':
      return `月令在"${mb}"，本气不透、无合会局，以月支本气取格`
    case '比劫当令':
      return `月令在"${mb}"，本气${benQiTenGod}当令，天干透${pattern.luJieYongShenTenGod ?? '财官'}，取建禄月劫格而以透干为用`
    default:
      return `月令在"${mb}"，综合判断取格`
  }
}

// ── 模块1：格局结构 ──

function getStructureSection(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
): string {
  const parts: string[] = []
  const yongShenTg = getYongShenTenGod(bazi, pattern)
  const fullYongShen = getTenGodName(yongShenTg)
  const yongShenBrief = TEN_GOD_BRIEF[fullYongShen] ?? `${fullYongShen}——命局的核心驱动力`

  // 格名 + 解释
  const patternBrief =
    PATTERN_BRIEF[pattern.displayName] ??
    `你的格局是${pattern.displayName}，根据月令透干情况判定的格局类型`
  parts.push(`**格局结构**：${patternBrief}。`)

  // 取格原因
  parts.push(getOriginNote(bazi, pattern) + '。')

  // 用神
  const yongLabel =
    pattern.category === '建禄月劫格'
      ? `"${fullYongShen}"`
      : `"${pattern.yongShen}（${fullYongShen}）"`
  parts.push(`用神为${yongLabel}——${yongShenBrief}。`)

  // 相神
  if (outcome.xiangShen) {
    const { god, role } = outcome.xiangShen
    const godBrief = TEN_GOD_BRIEF[god] ?? `${god}——关键辅助力量`
    parts.push(`相神为"${god}"——${godBrief}，它以"${role}"的方式配合用神，帮你稳住阵脚。`)
  } else if (outcome.outcome === '成格') {
    parts.push('此格局用神自成体系，不依赖相神辅助。')
  } else {
    parts.push('此格局缺少相神——用神孤军奋战，像是只有主将没有军师的队伍。')
  }

  return parts.join('')
}

// ── 模块2：层次评估 ──

function getOutcomeSection(
  outcome: AssessResult,
  strength: StrengthResult,
): string {
  if (outcome.outcome === '成格') {
    if (outcome.xiangShen) {
      return `**层次评估**：格局"成格"，核心结构稳固，用神与相神配合到位。成格，意味着你命局的顶层设计是完整的——就像一栋梁柱齐全的房子，能正常发挥应有的功能。`
    }
    return `**层次评估**：格局"成格"——用神自成体系，不假外求。成格，就像一棵独自矗立的大树，无需依附攀缘，自身就足够稳固。`
  }

  if (outcome.outcome === '破格') {
    const reasonPart = outcome.reason
      ? `具体原因是：${outcome.reason}。`
      : ''
    return `**层次评估**：格局"破格"——核心结构遭到了破坏。${reasonPart}但破格不代表人生失败：许多不走寻常路的人恰恰是破格命局，他们的特点是体制内之路不通，反而在体制外能找到属于自己的舞台。`
  }

  // 不成格
  const reasonPart = outcome.reason
    ? `目前的问题出在：${outcome.reason}。`
    : ''
  return `**层次评估**：格局"未成"——尚缺关键一环。${reasonPart}这就像一栋房子还差一根顶梁柱，目前住在里面会感到施展不开。但无需焦虑：大运流年一旦补齐缺口，格局就盘活了。`
}

// ── 调候判断 ──

function getTiaoHouType(bazi: BaziResult): '火炎土燥' | '金寒水冷' | null {
  const mb = bazi.pillars.month.branch
  const summer = ['巳', '午', '未']
  const winter = ['亥', '子', '丑']

  if (summer.includes(mb)) {
    const hasWater = (bazi.elementCount['水'] ?? 0) > 1
    if (!hasWater) return '火炎土燥'
  }
  if (winter.includes(mb)) {
    const hasFire = (bazi.elementCount['火'] ?? 0) > 1
    if (!hasFire) return '金寒水冷'
  }
  return null
}

// ── 五行分析帮助 ──

function getDominantElement(bazi: BaziResult): { element: ElementType; count: number } | null {
  const entries = Object.entries(bazi.elementCount) as [ElementType, number][]
  entries.sort((a, b) => b[1] - a[1])
  if (entries[0][1] >= 3) return { element: entries[0][0], count: entries[0][1] }
  return null
}

function getDeficientElement(bazi: BaziResult): ElementType | null {
  const entries = Object.entries(bazi.elementCount) as [ElementType, number][]
  for (const [el, count] of entries) {
    if (count === 0) return el
  }
  return null
}

// ── 模块3：病根诊断 ──

function getDiagnosisSection(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
): string | null {
  const parts: string[] = []
  const tiaoHou = getTiaoHouType(bazi)
  const dominant = getDominantElement(bazi)
  const deficient = getDeficientElement(bazi)

  // 调候问题优先
  if (tiaoHou === '火炎土燥') {
    parts.push(
      `**病根诊断**：你的命局"火炎土燥"——生于夏月，命中缺水调候。内心常年像被烈日烤着，容易焦躁内耗，想法源源不断但行动跟不上。`,
    )
    if (dominant?.element === '火' || dominant?.element === '土') {
      parts.push(
        `全局${dominant.element}气过旺${deficient ? `，而${deficient}完全缺失` : ''}，五行能量严重偏枯，就像一锅烧干了水的菜，越炒越焦。`,
      )
    }
    return parts.join('')
  }

  if (tiaoHou === '金寒水冷') {
    parts.push(
      `**病根诊断**：你的命局"金寒水冷"——生于冬月，命中缺火暖局。理智有余而热情不足，内心像冬天结冰的湖面，什么都能想明白，但缺了一股冲出去做的热乎劲。`,
    )
    if (dominant?.element === '水' || dominant?.element === '金') {
      parts.push(`全局${dominant.element}气过重，过于冷静克制，有时反而困住了自己。`)
    }
    return parts.join('')
  }

  // 印星过旺（印格 + 身强）
  if (pattern.category === '印格' && strength.level === '身强') {
    parts.push(
      `**病根诊断**：印星过旺——想得太多而做得太少，过度依赖自己的判断和既有经验，容易钻进思维的牛角尖。就像一个书房里泡了太久的人，知识丰富了，但双脚离了地。`,
    )
    return parts.join('')
  }

  // 财星被克（财格 + 破格/不成格）
  if (pattern.category === '财格' && outcome.outcome !== '成格') {
    parts.push(
      `**病根诊断**：财星根基不稳——要么来钱快花钱也快，要么努力了却总差临门一脚。核心问题不在能力，而在能量的传导链条断了一环，就像水管中间漏了，水压再大也到不了水龙头。`,
    )
    return parts.join('')
  }

  // 七杀无制
  if (pattern.category === '杀格' && !outcome.xiangShen) {
    parts.push(
      `**病根诊断**：七杀无制——压力直接压到了你身上，没有缓冲。就像一匹马没有人给它套缰绳，跑得快但也容易摔。你常感到自己被环境推着走，缺少一个能帮你分担的中间层。`,
    )
    return parts.join('')
  }

  // 五行缺失
  if (deficient) {
    parts.push(
      `**病根诊断**：你的命局完全缺失"${deficient}"元素，形成了五行结构上的缺口。这意味着在${deficient}所代表的领域（${elementDomain(deficient)}），你需要格外有意识地后天补充。`,
    )
    return parts.join('')
  }

  // 日主过强/过弱
  if (strength.level === '身强' && dominant && dominant.count >= 4) {
    parts.push(
      `**病根诊断**：日主过强，${dominant.element}气太旺。就像一个力气太大的人，做事容易用力过猛，反而伤到自己。需要学会"收"的智慧。`,
    )
    return parts.join('')
  }

  if (strength.level === '身弱') {
    parts.push(
      `**病根诊断**：日主偏弱，根基不够扎实。就像一个轻量级拳手进了重量级比赛，能力不差但体力跟不上。需要学会借力打力，而非硬碰硬。`,
    )
    return parts.join('')
  }

  return null
}

function elementDomain(el: ElementType): string {
  const map: Record<ElementType, string> = {
    '金': '技术、执行力、决断力',
    '木': '成长、人际关系、创造力',
    '水': '智慧、沟通、流动性',
    '火': '热情、行动力、表达力',
    '土': '稳定、诚信、承载能力',
  }
  return map[el] ?? el
}

// ── 模块4：发展建议 ──

function getAdviceSection(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
): string | null {
  const tiaoHou = getTiaoHouType(bazi)
  const dominant = getDominantElement(bazi)
  const deficient = getDeficientElement(bazi)

  if (tiaoHou === '火炎土燥') {
    const hasMetal = (bazi.elementCount['金'] ?? 0) > 0
    if (!hasMetal) {
      return `**发展建议**：从五行平衡来看，你最需要补"金"和"水"。金代表技术、作品、执行力——建议你找到一件能沉下心去打磨的硬技能或创作项目，把过剩的能量转化为实实在在的产出。水代表智慧、冷静和流动性——学会给自己留白，别把日程塞太满。`
    }
    return `**发展建议**：你需要补"水"来降温润局。水代表流动性、沟通和沉静的智慧。建议你多参与需要冷静分析和深度思考的工作，避免频繁切换注意力的碎片化任务。定期给自己一整块不受打扰的时间，比你想象中更重要。`
  }

  if (tiaoHou === '金寒水冷') {
    const hasWood = (bazi.elementCount['木'] ?? 0) > 0
    if (!hasWood) {
      return `**发展建议**：你最需要补"火"和"木"。火代表热情、行动力和感染力——建议你主动参与需要公开表达或团队协作的工作，用外部热度来带动内在能量。木代表成长和创造力——培养一个能持续进步的兴趣或副业，让它自然生长。`
    }
    return `**发展建议**：你需要补"火"来暖局。火代表热情、行动力和感染力。建议你不要等"准备好"了再行动——你的优势是思考缜密，短板是过度思考。给自己设定一个不可撤销的截止日期，先动起来，热度自然就来了。`
  }

  // 财格补食伤
  if (pattern.category === '财格' && outcome.outcome !== '成格') {
    return `**发展建议**：财格需要"食伤"来生财。食伤代表你的才华、技能和创造力——你需要先打磨出一项能拿得出手的专业能力，财富自然随之而来。先练内功，再谈变现，这个顺序不能反。`
  }

  // 印格补食伤
  if (pattern.category === '印格' && strength.level === '身强') {
    return `**发展建议**：印星过旺时，需要"食伤"来泄秀。食伤代表输出和创造——你已经积累了足够多的输入，现在是时候把脑子里的东西做出来了。不要追求完美，先完成再完善。`
  }

  // 缺失元素
  if (deficient) {
    return `**发展建议**：你的命局缺"${deficient}"，这是你需要后天重点补充的维度。${deficient}代表${elementDomain(deficient)}——有意识地在这些领域投入时间和精力，会比别人更早感受到"补缺口"带来的变化。`
  }

  // 通用建议
  if (strength.level === '身强') {
    return `**发展建议**：日主身强，能量充沛，适合走"输出型"路线——创造、表达、管理、竞争都是你的强项。学会把过剩的能量导向具体目标，而不是内耗在犹豫和纠结中。`
  }
  if (strength.level === '身弱') {
    return `**发展建议**：日主身弱，不适合单打独斗。你的策略应该是"借力"——找好的平台、好的伙伴、好的导师。不是能力不够，而是你的能量更适合用在刀刃上，而不是铺摊子。`
  }

  return null
}

// ── 模块5：关键提醒 ──

function getWarningSection(
  pattern: ExtractResult,
  outcome: AssessResult,
): string | null {
  const cat = pattern.category
  const reason = outcome.reason

  // 七杀相关
  if (cat === '杀格') {
    if (reason.includes('合') && outcome.xiangShen) {
      return `**关键提醒**：你的七杀被合绊，虽然化解了锋芒，但合你的力量（来自朋友、兄弟或合作伙伴）有时候也会成为你的牵绊。注意在亲密关系中保持独立判断，不要因为人情而偏离自己的方向。`
    }
    if (outcome.outcome === '破格') {
      return `**关键提醒**：七杀破格，压力和竞争是你一生的课题。切忌冲动决策，尤其在事业转折点。你的直觉很强，但需要给自己留一个冷静期再拍板。`
    }
  }

  // 伤官相关
  if (cat === '伤官格') {
    if (outcome.outcome === '成格') {
      return `**关键提醒**：伤官格即使成格，天性中仍有不服管束的底色。选择职业时，优先考虑能给你自主空间的环境。被管得太死，你的创造力会被熄火——这比升职加薪更重要。`
    }
    return `**关键提醒**：伤官代表反叛精神——你的才华需要出口，但也要注意表达方式。直言不讳是你的特色，但有时杀伤力过大，伤人也伤己。学会在适当的时候"软着落"。`
  }

  // 官格破格
  if (cat === '官格' && outcome.outcome === '破格') {
    return `**关键提醒**：正官格破格，意味着规则和秩序在你的命局中不太稳定。你在体制内的路可能比别人坎坷，但这不一定是坏事——也许你本来就不该被框住。只是需要注意：信守承诺对你比常人更重要，一个失信就可能失去整个局。`
  }

  // 财格
  if (cat === '财格' && outcome.outcome !== '成格') {
    return `**关键提醒**：财格不稳时，财富的波动会比常人大。这不是说你会穷——而是你的收入模式更适合"项目制"而非"死工资"。拥抱这种波动，而不是对抗它。同时注意：不要为了快钱而牺牲积累。`
  }

  // 建禄月劫格
  if (cat === '建禄月劫格') {
    if (outcome.xiangShen?.god === '劫财') {
      return `**关键提醒**：劫财合杀是你的救应，但劫财也意味着合作中存在利益纠葛。与人合伙做事时，丑话说在前面，账算在明处。情分归情分，规则归规则。`
    }
    return `**关键提醒**：建禄月劫格的人天性独立，容易把所有事都揽在自己身上。学会信任和授权，是你一生需要练习的功课。一个人扛得了一时，扛不了一世。`
  }

  // 破格通用
  if (outcome.outcome === '破格') {
    return `**关键提醒**：格局破格意味着你的路不会一帆风顺——但这恰恰造就了你的韧性和适应力。你比别人更懂得"没有退路时如何找出路"。珍惜这份能力，它是你最大的隐形财富。`
  }

  return null
}

// ═══════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════

export function generateAnalysis(input: AnalysisInput): AnalysisResult {
  const { bazi, pattern, outcome, strength } = input

  // 第一层
  const summary = getSummaryLine(bazi, pattern, outcome, strength)

  // 第二层
  const sections: string[] = []

  const structure = getStructureSection(bazi, pattern, outcome)
  sections.push(structure)

  const outcomeText = getOutcomeSection(outcome, strength)
  sections.push(outcomeText)

  const diagnosis = getDiagnosisSection(bazi, pattern, outcome, strength)
  if (diagnosis) sections.push(diagnosis)

  const advice = getAdviceSection(bazi, pattern, outcome, strength)
  if (advice) sections.push(advice)

  const warning = getWarningSection(pattern, outcome)
  if (warning) sections.push(warning)

  const analysis = sections.join('\n\n')

  return { summary, analysis }
}
