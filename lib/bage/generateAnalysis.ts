import type { BaziResult, ElementType } from '@/types/bazi'
import type { ExtractResult } from './extractPattern'
import type { AssessResult } from './assessOutcome'
import type { StrengthResult } from '@/lib/strength/determineStrength'
import { getHiddenStemsSpec, getStemElement } from './helpers'
import { getTenGod } from '@/lib/bazi-utils'
import { getTiaoHouYongShen } from './tiaoHou'
import { analyzeWuXingLiuTong } from './liuTong'

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
  '从杀格': '从杀格——你的命局日主无根，全局官杀强旺，顺势从杀。你天生有强大的压力转化能力和危机嗅觉',
  '从财格': '从财格——你的命局日主无根，全局财星汇聚，顺势从财。你对资源和机会有极强的吸附能力',
  '化土格': '化土格——你的命局以合化为主，甲己化土，格局转为土行。你天性稳重踏实，如大地般承载万物',
  '化金格': '化金格——你的命局以合化为主，乙庚化金，格局转为金行。你天性刚毅果断，有金属般的锐气和决断力',
  '化水格': '化水格——你的命局以合化为主，丙辛化水，格局转为水行。你天性灵动智慧，如水般顺应变化、润物无声',
  '化木格': '化木格——你的命局以合化为主，丁壬化木，格局转为木行。你天性仁德生发，如树木般不断向上生长',
  '化火格': '化火格——你的命局以合化为主，戊癸化火，格局转为火行。你天性热情奔放，如火般温暖人心、照亮前路',
}

// ── 用神十神获取 ──

function getYongShenTenGod(bazi: BaziResult, pattern: ExtractResult): string {
  if (pattern.category === '建禄月劫格') {
    return pattern.luJieYongShenTenGod ?? '财官'
  }
  // 化格：按化气后新日主计算十神
  if (pattern.huaQiShiShen) {
    return getTenGod(pattern.huaQiShiShen.newDayMaster, pattern.yongShen)
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
    if (cat === '从杀格') return '顺风驶船，浪越大你走得越快'
    if (cat === '从财格') return '钱塘江的潮水来了，你是冲在最前面的浪'
    if (cat === '化土格') return '大地换了新土，脚下更厚实了'
    if (cat === '化金格') return '铁矿石炼成了钢，你已经脱胎换骨'
    if (cat === '化水格') return '蒸汽化成了雨，落下后汇聚成江河'
    if (cat === '化木格') return '种子破土重生，换了土壤长得更高'
    if (cat === '化火格') return '薪柴燃成了烈焰，你已从燃料化为了光'
    return '梁柱齐全的房子，住着踏实'
  }

  // 成格但无相神
  if (cat === '杀格') return '一把快刀，不靠外力，自成锋芒'
  if (cat === '官格') return '独行侠也有规则，不靠别人也走得稳'
  if (cat === '建禄月劫格') return '天生靠自己的命，也走对了方向'
  if (cat === '从杀格') return '孤狼一头扎进丛林，越危险越强大'
  if (cat === '从财格') return '天生吸金的体质，不靠别人也能聚沙成塔'
  if (cat === '化土格') return '换了底子，自成厚重，一捧新土也能筑成高台'
  if (cat === '化金格') return '脱了胎的刀剑，不用打磨也自带锋芒'
  if (cat === '化水格') return '江河改道入海，不回头也能抵达深蓝'
  if (cat === '化木格') return '嫁接过的枝条，换了个根也能独自参天'
  if (cat === '化火格') return '钻木取到的火种，不借风势也能燎原'

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
    case '从格':
      return `日主无根，全局气势偏于一方，依《滴天髓》"从得真者只论从"取为从格`
    case '化格': {
      const origDm = bazi.dayMaster
      const origEl = getStemElement(origDm)
      const newEl = pattern.huaQiShiShen?.huaElement ?? pattern.patternElement
      const newDm = pattern.huaQiShiShen?.newDayMaster
      const transDesc = newDm
        ? `日主${origDm}(${origEl})合化为${newEl}，新日主${newDm}(${newEl})`
        : `日主${origDm}与它干相合而化`
      return `${transDesc}，依《滴天髓》"化得真者只论化"取为化格`
    }
    default:
      return `月令在"${mb}"，综合判断取格`
  }
}

// ── 相神机制洞察 ──

interface MechanismInsight {
  /** 相神段落追加的机制说明 */
  xiangShenNote: string
  /** 层次评估段落中替换默认文案的定制评估 */
  outcomeNote: string | null
}

function getMechanismInsight(outcome: AssessResult): MechanismInsight | null {
  if (!outcome.xiangShen) return null
  const { role } = outcome.xiangShen

  if (role === '合绊制杀') {
    return {
      xiangShenNote:
        '合绊是"软制"——像用绳索套住猛虎，虎虽不能伤人，却被困在笼中施展不开。' +
        '杀力被化解的同时锐气也打了折扣，**层次受损**。',
      outcomeNote:
        '格局能成，但因合绊制杀是偏门——好比把老虎拴住而非驯服，' +
        '猛则猛矣却跑不起来，常有怀才不遇之感。',
    }
  }

  if (role === '食神制杀') {
    return {
      xiangShenNote:
        '食制是"硬制"——像驯兽师正面驯服猛虎，干净利落、不拖泥带水。' +
        '杀力被完整转化为进取的动力，格局**清纯有力**。',
      outcomeNote:
        '格局能成，且食神制杀是正格——猛虎被正面驯服，指哪打哪，' +
        '这是最高效的制约方式，命局层次**清纯有力**。',
    }
  }

  if (role === '印星化杀' || role === '化杀生身') {
    return {
      xiangShenNote:
        '印化是"柔制"——像春风化雨，将七杀的锋芒化为滋润的雨露。' +
        '化敌为师、转压力为动力，**层次清高**。',
      outcomeNote:
        '格局能成，印星化杀以柔克刚——将外界的压力悄然转化为内在的成长动力，' +
        '这是一种优雅而高级的解法，**层次清高**。',
    }
  }

  // 食伤生财系
  if (role.includes('生财') || role.includes('转劫生财')) {
    return {
      xiangShenNote:
        '食伤是财星的"源头活水"——才华不断产出，财富自然随之而来。' +
        '有源头的水才不会干涸，格局**生生不息**。',
      outcomeNote: null,
    }
  }

  // 财官系
  if (role.includes('财生官') || role.includes('财通关')) {
    return {
      xiangShenNote:
        '财是官星的"粮草"——有后勤保障的将军才能打胜仗。' +
        '财星通关让整个格局运转起来，**稳健有力**。',
      outcomeNote: null,
    }
  }

  // 印制伤系
  if (role.includes('印制伤')) {
    return {
      xiangShenNote:
        '印是伤官的"刹车片"——既能保留伤官的才华输出，' +
        '又不让它横冲直撞。收放有度，**层次不俗**。',
      outcomeNote: null,
    }
  }

  return null
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
  const isHua = !!pattern.huaQiShiShen
  const yongLabel = isHua
    ? `化神${pattern.huaQiShiShen!.huaElement}（${pattern.yongShen}·${fullYongShen}）`
    : pattern.category === '建禄月劫格'
      ? `"${fullYongShen}"`
      : `"${pattern.yongShen}（${fullYongShen}）"`
  const yongShenDesc = isHua
    ? `化神${pattern.huaQiShiShen!.huaElement}——由原日主合化而来的全新五行气场，是你化气后的核心驱动力`
    : yongShenBrief
  parts.push(`用神为${yongLabel}——${yongShenDesc}。`)

  // 相神
  if (outcome.xiangShen) {
    const { god, role } = outcome.xiangShen
    const godBrief = TEN_GOD_BRIEF[god] ?? `${god}——关键辅助力量`
    const insight = getMechanismInsight(outcome)
    parts.push(`相神为"${god}"——${godBrief}，它以"${role}"的方式配合用神，帮你稳住阵脚。`)
    if (insight) {
      parts.push(insight.xiangShenNote)
    }
  } else if (outcome.outcome === '成格') {
    parts.push('此格局用神自成体系，不依赖相神辅助。')
  } else {
    parts.push('此格局缺少相神——用神孤军奋战，像是只有主将没有军师的队伍。')
  }

  return parts.join('')
}

// ── 模块2：层次评估 ──

// 各格局成格条件模板
interface ConditionTemplate {
  label: string
  desc: string
  /** 在 outcome.reason 中匹配该条件已满足的关键词 */
  match: string[]
}

const PATTERN_CONDITIONS: Record<string, ConditionTemplate[]> = {
  '正官格': [
    { label: '财生官', desc: '财星透干或成局，以财生官', match: ['财生官', '有财生官'] },
    { label: '印护官', desc: '印星透干或成局，以印护官', match: ['印护官', '有印护官', '印制伤护官'] },
  ],
  '七杀格': [
    { label: '食制杀', desc: '食神透干制伏七杀', match: ['食神制杀', '食神制伏'] },
    { label: '印化杀', desc: '印星透干或成局化泄七杀', match: ['印星化杀', '印化'] },
    { label: '合绊制杀', desc: '劫财或伤官合绊七杀', match: ['合绊', '被合绊制约'] },
  ],
  '正财格': [
    { label: '官护财', desc: '官星透干或成局守护财星', match: ['财生官', '官护财'] },
    { label: '食伤生财', desc: '食伤透干或成局为财之源', match: ['食伤生财', '财有源'] },
  ],
  '偏财格': [
    { label: '官护财', desc: '官星透干或成局守护财星', match: ['财生官', '官护财'] },
    { label: '食伤生财', desc: '食伤透干或成局为财之源', match: ['食伤生财', '财有源'] },
  ],
  '正印格': [
    { label: '官杀生印', desc: '官杀透干或成局生扶印星', match: ['官杀生印'] },
    { label: '食伤泄秀', desc: '食伤透干或成局泄印之秀', match: ['食伤泄秀', '印旺用食伤泄秀'] },
  ],
  '偏印格': [
    { label: '官杀生印', desc: '官杀透干或成局生扶印星', match: ['官杀生印'] },
    { label: '食伤泄秀', desc: '食伤透干或成局泄印之秀', match: ['食伤泄秀', '印旺用食伤泄秀'] },
  ],
  '食神格': [
    { label: '食神生财', desc: '财星透干或成局，食神吐秀生财', match: ['食神生财', '吐秀生财'] },
    { label: '弃食就煞', desc: '七杀透干、印星透干、无财（杀印相生）', match: ['弃食就煞', '杀印相生'] },
  ],
  '伤官格': [
    { label: '伤官生财', desc: '财星透干或成局，伤官生财', match: ['伤官生财'] },
    { label: '伤官佩印', desc: '印星透干有根，印制伤护官', match: ['伤官佩印'] },
    { label: '伤官带杀', desc: '七杀透干无财无食制，伤官带杀', match: ['伤官带杀'] },
    { label: '金水调候', desc: '金水伤官喜见官，调候为急', match: ['金水伤官喜见官'] },
  ],
  '建禄月劫格': [
    { label: '天干有取用', desc: '天干透出财、官、杀、食之一可取为用神', match: ['用神'] },
  ],
  '阳刃格': [
    { label: '官煞制刃', desc: '官杀透干或成局制伏阳刃', match: ['透官煞制刃', '官煞制刃'] },
  ],
  '化土格': [
    { label: '日主合化', desc: '日主与它干形成五合', match: ['化气'] },
    { label: '化神透干', desc: '化神五行在天干透出', match: ['化气'] },
    { label: '化神有根', desc: '地支有三合/三会局或禄旺之位支撑化神', match: ['化气'] },
    { label: '无克破', desc: '全局无克制化神的五行成势', match: ['化气'] },
  ],
  '化金格': [
    { label: '日主合化', desc: '日主与它干形成五合', match: ['化气'] },
    { label: '化神透干', desc: '化神五行在天干透出', match: ['化气'] },
    { label: '化神有根', desc: '地支有三合/三会局或禄旺之位支撑化神', match: ['化气'] },
    { label: '无克破', desc: '全局无克制化神的五行成势', match: ['化气'] },
  ],
  '化水格': [
    { label: '日主合化', desc: '日主与它干形成五合', match: ['化气'] },
    { label: '化神透干', desc: '化神五行在天干透出', match: ['化气'] },
    { label: '化神有根', desc: '地支有三合/三会局或禄旺之位支撑化神', match: ['化气'] },
    { label: '无克破', desc: '全局无克制化神的五行成势', match: ['化气'] },
  ],
  '化木格': [
    { label: '日主合化', desc: '日主与它干形成五合', match: ['化气'] },
    { label: '化神透干', desc: '化神五行在天干透出', match: ['化气'] },
    { label: '化神有根', desc: '地支有三合/三会局或禄旺之位支撑化神', match: ['化气'] },
    { label: '无克破', desc: '全局无克制化神的五行成势', match: ['化气'] },
  ],
  '化火格': [
    { label: '日主合化', desc: '日主与它干形成五合', match: ['化气'] },
    { label: '化神透干', desc: '化神五行在天干透出', match: ['化气'] },
    { label: '化神有根', desc: '地支有三合/三会局或禄旺之位支撑化神', match: ['化气'] },
    { label: '无克破', desc: '全局无克制化神的五行成势', match: ['化气'] },
  ],
  '从杀格': [
    { label: '日主无根', desc: '日主在地支和藏干中无比劫根气', match: ['无根', '真从杀格'] },
    { label: '官杀强旺', desc: '全局官杀透干且地支会官杀局', match: ['无根', '真从杀格', '官杀'] },
  ],
  '从财格': [
    { label: '日主无根', desc: '日主在地支和藏干中无比劫根气', match: ['无根', '真从财格'] },
    { label: '财星强旺', desc: '全局财星透干且地支会财局', match: ['无根', '真从财格', '财星'] },
  ],
}

function buildConditionBreakdown(
  pattern: ExtractResult,
  outcome: AssessResult,
): string {
  const conds = PATTERN_CONDITIONS[pattern.displayName]
  if (!conds) return `成格依据：${outcome.reason}。`

  const reason = outcome.reason

  if (outcome.outcome === '成格') {
    const met = conds.filter((c) => c.match.some((m) => reason.includes(m)))
    const condList = conds.map((c) => c.desc).join('；')

    if (met.length > 0) {
      const metDetails = met.map((m) => `${m.label}（${m.desc}）`).join('、')
      return `成格条件为：${condList}。你的命局满足${metDetails}，故格局成立。`
    }
    return `成格依据：${reason}。`
  }

  if (outcome.outcome === '不成格') {
    const met = conds.filter((c) => c.match.some((m) => reason.includes(m)))
    const unmet = conds.filter((c) => !c.match.some((m) => reason.includes(m)))
    const condList = conds.map((c) => c.desc).join('；')

    if (met.length > 0 && unmet.length > 0) {
      const metPart = met.map((m) => `${m.label}（${m.desc}）`).join('、')
      const unmetPart = unmet.map((u) => `${u.label}（${u.desc}）`).join('、')
      return `成格条件为：${condList}。你的命局已满足${metPart}，但未满足${unmetPart}（${reason}），故格局不成立。这并非破格，格局处于待定状态——大运流年一旦补齐缺失条件，格局即可激活。`
    }
    return `成格条件为：${condList}。你的命局均未满足（${reason}），故格局不成立。大运流年补齐条件后格局可激活。`
  }

  // 破格
  return `格局破败。触发破格条件：${reason}。核心结构遭到破坏，格局无法正常运作。`
}

function getOutcomeSection(
  outcome: AssessResult,
  strength: StrengthResult,
  pattern: ExtractResult,
): string {
  const isJinShui = outcome.reason.includes('金水伤官喜见官')
  const insight = getMechanismInsight(outcome)
  const breakdown = buildConditionBreakdown(pattern, outcome)

  if (outcome.outcome === '成格') {
    if (isJinShui) {
      return `**层次评估**：格局"成格"——而且是金水伤官见官的调候贵格。寻常伤官格见官为破，但你命局金寒水冷，正官之火恰好为你暖局，如同冰天雪地里的一盆炭火，化忌为喜、变废为宝。这是《穷通宝鉴》中记载的著名特例。`
    }
    const parts = [`**层次评估**：格局"成格"。${breakdown}`]
    if (insight?.outcomeNote) {
      parts.push(insight.outcomeNote)
    } else if (outcome.xiangShen) {
      parts.push('格局成立意味着你命局的顶层设计完整——就像一栋梁柱齐全的房子，能正常发挥应有的功能。')
    } else {
      parts.push('格局成立但用神自成体系、不假外求——就像一棵独自矗立的大树，无需依附攀缘，自身就足够稳固。')
    }
    return parts.join('')
  }

  if (outcome.outcome === '破格') {
    return `**层次评估**：格局"破格"。${breakdown}但破格不代表人生失败：许多不走寻常路的人恰恰是破格命局，他们的特点是体制内之路不通，反而在体制外能找到属于自己的舞台。`
  }

  // 不成格
  return `**层次评估**：格局"未成"。${breakdown}但无需焦虑：大运流年一旦补齐缺口，格局就盘活了。`
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

// ── 调候用神 → 发展建议 ──

const TIAO_HOU_ELEMENT_ADVICE: Record<string, string> = {
  '金': '技术/专业技能',
  '水': '学习/沟通',
  '木': '社交/人脉',
  '火': '展示/分享',
  '土': '稳固/储蓄',
}

function formatTiaoHouAdvice(gods: string[]): string {
  const seen = new Set<string>()
  const items: string[] = []
  for (const stem of gods) {
    const el = getStemElement(stem)
    if (seen.has(el)) continue
    seen.add(el)
    items.push(`${el}（${TIAO_HOU_ELEMENT_ADVICE[el] || el}）`)
  }
  return items.join('、')
}

// ── 模块4：发展建议 ──

function getAdviceSection(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
  strength: StrengthResult,
): string | null {
  const tiaoHouGods = getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch)
  if (tiaoHouGods.length > 0) {
    const dmElement = getStemElement(bazi.dayMaster)
    const dmFull = `${bazi.dayMaster}${dmElement}`
    const godList = tiaoHouGods.join('、')
    const elementAdvice = formatTiaoHouAdvice(tiaoHouGods)
    return `**发展建议**：从五行调候的角度看，${dmFull}生于${bazi.pillars.month.branch}月，最喜${godList}。建议你从${elementAdvice}方向调整。`
  }

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

const PATTERN_WISDOM: Record<string, string> = {
  '正官格': '守规矩是你的底色，但规则之外也要给自己留喘息的空间。责任是铠甲，偶尔卸下也是一种能力',
  '七杀格': '你有冲天的干劲，但猛虎需要驯服。找到一件能沉下心打磨的事，把过剩的能量转化为实实在在的成果',
  '正财格': '你对财富有天然的敏感，但钱是工具不是目的。把钱花在提升自己的地方，让每一分钱为你创造更大的价值',
  '偏财格': '你善于借势而起、汇聚人脉，但风口上的猪也会落地。在风口之外，悄悄攒一条属于自己的护城河',
  '正印格': '你领悟力很强，但想得太多容易内耗。把想法变成行动，哪怕只是一个小小的尝试，也比反复推演更有用',
  '偏印格': '你有独特的偏门才华，但容易钻牛角尖。找到一个能把你的专长"翻译"给世界的人或平台，比闭门造车更重要',
  '食神格': '你天生懂得如何让生活变得有趣。把这种创造力用在能产生价值的地方，你会发现快乐和成功可以兼得',
  '伤官格': '你的才华需要出口，但也要注意表达方式。直言不讳是你的特色，但杀伤力过大时伤人也伤己。学会在适当的时候"软着陆"',
  '建禄月劫格': '你凡事喜欢靠自己，但一个人走得快一群人走得远。学会在适当的时候信任他人、分担责任，路会越走越宽',
  '阳刃格': '你能扛事、敢决断，但刚则易折。学会在关键时候示弱，反而能赢得更多支持',
  '从杀格': '你的人生不靠硬扛而是借力打力。顺势而行比逆流而上更有效——找到那条适合你的轨道，别回头',
  '从财格': '你的人生不靠硬扛而是借力打力。像冲浪一样，等浪来的时候全力冲刺，平时则练习划水和观察',
  '化土格': '你正在经历一次重要的转变。蜕变的过程可能漫长，但一旦完成，你会发现自己比想象中更厚重、更稳当',
  '化金格': '你正在经历一次重要的转变。像矿石炼成刀剑——这个过程有高温也有敲打，但最终你会脱胎换骨',
  '化水格': '你正在经历一次重要的转变。水无常形，你比想象中更有适应力。顺着流变的方向走，你会到达意想不到的地方',
  '化木格': '你正在经历一次重要的转变。像种子破土重生——旧土壤已不适合你，新土壤会让你长得更高',
  '化火格': '你正在经历一次重要的转变。从薪柴化为烈焰——你不再是燃料，而是光源本身',
}

function getWarningSection(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
): string {
  const liuTong = analyzeWuXingLiuTong(bazi)
  const hasBlockage = liuTong.blockage !== null && liuTong.tongGuan !== null
  const wisdom = PATTERN_WISDOM[pattern.displayName]
    ?? `${pattern.displayName}代表你的核心特质——顺势而为，找到属于自己的节奏`

  // 附加流通提醒
  let flowNote = ''
  if (hasBlockage) {
    const el = liuTong.tongGuan!
    const dir = ELEMENT_DIRECTION[el] ?? el
    flowNote = `从五行流通看，你的能量在${liuTong.blockage}处淤堵，补${el}（${dir}）是当下的关键`
  } else {
    flowNote = '五行流通顺畅，你的能量没有明显的卡点——这是一份难得的福气，善用它'
  }

  // 破格追加警示
  let poGeNote = ''
  if (outcome.outcome === '破格') {
    poGeNote = '格局破损不意味着失败——它恰恰造就了你的韧性和适应力，你比别人更懂得如何在绝境中找到出路'
  } else if (outcome.outcome === '不成格') {
    poGeNote = '格局尚欠火候，但大运流年会补齐缺失的条件。你不是不行，只是时候未到'
  }

  const parts = [`**关键提醒**：${wisdom}。${flowNote}。`]
  if (poGeNote) parts.push(poGeNote)

  return parts.join('')
}

// ── 五行流通方向映射 ──

const ELEMENT_DIRECTION: Record<string, string> = {
  '金': '技术、专业技能',
  '水': '学习、沟通',
  '木': '社交、人脉',
  '火': '展示、分享',
  '土': '稳固、储蓄',
}

function getLiuTongSection(bazi: BaziResult): string {
  const { blockage, tongGuan, description } = analyzeWuXingLiuTong(bazi)

  if (blockage && tongGuan) {
    const dir = ELEMENT_DIRECTION[tongGuan] ?? tongGuan
    return `**流通诊断**：从五行流通的角度看，命局的能量在${blockage}处形成淤堵，导致气机不畅。通关用神为${tongGuan}，建议从${dir}方向进行调整。（${description}）`
  }

  return '**流通诊断**：从五行流通的角度看，命局五行能量流转顺畅，无明显的淤堵。'
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

  const outcomeText = getOutcomeSection(outcome, strength, pattern)
  sections.push(outcomeText)

  const diagnosis = getDiagnosisSection(bazi, pattern, outcome, strength)
  if (diagnosis) sections.push(diagnosis)

  const liuTong = getLiuTongSection(bazi)
  sections.push(liuTong)

  const advice = getAdviceSection(bazi, pattern, outcome, strength)
  if (advice) sections.push(advice)

  const warning = getWarningSection(bazi, pattern, outcome)
  sections.push(warning)

  const analysis = sections.join('\n\n')

  return { summary, analysis }
}
