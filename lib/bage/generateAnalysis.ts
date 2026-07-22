import type { BaziResult, ElementType } from '@/types/bazi'
import type { ExtractResult } from './extractPattern'
import type { AssessResult } from './assessOutcome'
import type { StrengthResult } from '@/lib/strength/determineStrength'
import { getHiddenStemsSpec, getStemElement } from './helpers'
import { getTenGod } from '@/lib/bazi-utils'
import { getTiaoHouYongShen, getTiaoHouType } from './tiaoHou'
import { analyzeWuXingLiuTong } from './liuTong'
import { generateNarrative } from './narrative'

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
  /** 人格化叙事：300-500字，有态度、有判断力 */
  narrative: string
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

// ── 调候用神与格局喜忌区分 ──

const EL_CONTROLLED_BY: Record<string, ElementType> = { '木':'土', '火':'金', '土':'水', '金':'木', '水':'火' }
const EL_CONTROLS: Record<string, ElementType> = { '木':'金', '火':'水', '土':'木', '金':'火', '水':'土' }
const EL_GENERATED: Record<string, ElementType> = { '木':'火', '火':'土', '土':'金', '金':'水', '水':'木' }
const EL_GENERATES: Record<string, ElementType> = { '木':'水', '火':'木', '土':'火', '金':'土', '水':'金' }

function getPatternTabooElements(
  bazi: BaziResult,
  pattern: ExtractResult,
): ElementType[] {
  const dmEl = bazi.dayMasterElement
  switch (pattern.category) {
    case '官格':
      // 伤官见官：伤官 = DM 所生
      return [EL_GENERATED[dmEl]]
    case '杀格':
      // 财生杀党杀 + 官杀混杂
      return [EL_CONTROLLED_BY[dmEl], EL_CONTROLS[dmEl]]
    case '财格':
      // 比劫夺财
      return [dmEl]
    case '印格':
      // 财破印
      return [EL_CONTROLLED_BY[dmEl]]
    case '食神格':
      // 枭神夺食
      return [EL_GENERATES[dmEl]]
    case '伤官格':
      // 伤官见官
      return [EL_CONTROLS[dmEl]]
    default:
      // 建禄月劫格、阳刃格、从格、化格：无普适忌神
      return []
  }
}

const EL_DOMAIN: Record<string, string> = {
  '金': '技术、专业技能',
  '水': '智慧、学习资源',
  '木': '人脉、成长机会',
  '火': '表达、行动热度',
  '土': '稳定、物质积累',
}

const EL_BENEFIT: Record<string, string> = {
  '金': '通过创造价值',
  '水': '通过学习沉淀',
  '木': '通过拓展人脉',
  '火': '通过展示分享',
  '土': '通过持续积累',
}

function getTiaoHouConflictNote(
  tiaoHouGods: string[],
  tabooElements: ElementType[],
): string | null {
  if (tabooElements.length === 0) return null

  const tiaoHouElements = new Set(tiaoHouGods.map(s => getStemElement(s)).filter(Boolean))
  const conflict = tabooElements.find(el => tiaoHouElements.has(el))
  if (!conflict) return null

  const generated = EL_GENERATED[conflict] ?? ''
  const domain = EL_DOMAIN[conflict] ?? conflict
  const benefit = generated ? EL_DOMAIN[generated] ?? generated : '更好的状态'
  const way = EL_BENEFIT[conflict] ?? `通过${conflict}`

  return `\n\n注意：你的格局忌${conflict}，但调候用神中出现了${conflict}。这里的「${conflict}」并非让你直接补${conflict}，而是通过${conflict}来生${generated}——你真正需要的是${generated}。建议从${domain}（${conflict}）入手，${way}来换取${benefit}（${generated}）。`
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
  const tiaoHou = getTiaoHouType(bazi)
  const dominant = getDominantElement(bazi)
  const deficient = getDeficientElement(bazi)

  // 双轨：先判定调候方向，再查表给出具体用神
  const tiaoHouGods = getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch)
  if (tiaoHouGods.length > 0) {
    const dmElement = getStemElement(bazi.dayMaster)
    const dmFull = `${bazi.dayMaster}${dmElement}`
    const godList = tiaoHouGods.join('、')
    const elementAdvice = formatTiaoHouAdvice(tiaoHouGods)
    const prefix = tiaoHou === '寒暖适中'
      ? `**发展建议**：你命局寒暖适中，但《穷通宝鉴》认为${dmFull}生于${bazi.pillars.month.branch}月，仍可参考${godList}调候。建议从${elementAdvice}方向微调。`
      : `**发展建议**：从五行调候的角度看，${dmFull}生于${bazi.pillars.month.branch}月，最喜${godList}。建议你从${elementAdvice}方向调整。`
    let text = prefix

    // 调候用神与格局喜忌冲突检测
    const tabooEls = getPatternTabooElements(bazi, pattern)
    const conflictNote = getTiaoHouConflictNote(tiaoHouGods, tabooEls)
    if (conflictNote) text += conflictNote

    return text
  }

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

// 格言 — 10条八格，每条2-4字
const GRID_MOTTO: Record<string, string> = {
  '正官格': '克己复礼',
  '七杀格': '猛虎蔷薇',
  '正财格': '取之有道',
  '偏财格': '借风使舵',
  '正印格': '厚积薄发',
  '偏印格': '奇才独运',
  '食神格': '天生有趣',
  '伤官格': '锋芒内敛',
  '建禄月劫格': '自力更生',
  '阳刃格': '刚柔并济',
}

// 日主五行 × 八格方向建议 — 格言后的行动建议，根据 bazi.dayMasterElement 选择
const DAY_MASTER_DIRECTION: Record<string, Record<string, string>> = {
  '木': {
    '正官格': '如松柏立根破岩，守正之余也要向上生长。你的原则感本身，就是最好的竞争力',
    '七杀格': '如劲风摧木，压力越大根扎越深。把每一次挑战看成扎根的机会，风雨过后自会参天',
    '正财格': '如园丁育林，财富是你浇灌出来的果实。稳扎稳打比投机更适合你的节奏',
    '偏财格': '如藤蔓攀岩，善借外力是木的天赋。但记得留几分力气长自己的主干',
    '正印格': '如春雨润物，学习对你来说不是负担而是养分。让知识慢慢渗透，不必急于变现',
    '偏印格': '你的独特视角是一把钥匙——找到一个对的门，比打造十把锁更有价值',
    '食神格': '木生火为自然，你的创造力自带生命力。分享出去，让更多人感受到你的温度',
    '伤官格': '木秀于林风必摧之——才华是你的锋芒，但学会选择战场比一味冲锋更智慧',
    '建禄月劫格': '独木可参天，但森林更长久。找几位志同道合的同伴，比单打独斗走得远',
    '阳刃格': '木强则易折于风。你的果敢是优势，但关键决定前停三秒，会让结果截然不同',
  },
  '火': {
    '正官格': '如烛火明而不灼，你的责任感自带光芒。照亮规则之内，也别忘了温暖规则之外的自己',
    '七杀格': '火旺遇风则燎原——找到能承载你能量的方向，聚于一点才能炼铁成钢',
    '正财格': '如炉火炼金，你对价值的判断力天然敏锐。聚焦一处深耕，比四处点火更有收获',
    '偏财格': '火借风势可以燎原——你的人脉和资源是你的"风"，善加引导就能星火燎原',
    '正印格': '如灯火传承，你吸收知识的热情无人能及。但照亮别人的同时，别忘了给自己添油',
    '偏印格': '你有熄不灭的好奇心，这是你的火种。找到一个小众领域深耕，你会成为那束独特的光',
    '食神格': '火主礼乐，你的快乐能感染身边的人。把这份天赋用在创作上，世界需要你的温度',
    '伤官格': '烈火灼人亦自伤——表达之前先降一度，温和的方式比锋芒更让人愿意聆听',
    '建禄月劫格': '一团火可以温暖一间屋子——你的独立是你的骄傲，但不拒绝别人添柴，火焰会更旺',
    '阳刃格': '火过旺则自焚。你的决断力值得信赖，但留一分余地给别人，也是留一分余地给自己',
  },
  '土': {
    '正官格': '如山岳稳重致远，你的可靠本身就是稀缺资源。守规矩不是束缚，是你最坚固的基石',
    '七杀格': '土能克水亦能生金——压力之下你不是被淹没，而是被压实成更坚硬的岩层',
    '正财格': '土生万物而不争，你对财富的态度天然健康。不求快钱求稳钱，时间会做你的朋友',
    '偏财格': '厚土承载万物——你善于汇聚资源，但记得把资源投向能长出自己的"庄稼"的地方',
    '正印格': '如大地吸纳雨水，学习对你来说是沉淀而非负担。知识会在合适的时机自己发芽',
    '偏印格': '你的思维像地层一样深邃——别人看到表面，你看到本质。把这份洞见写成文字或作品',
    '食神格': '土厚则万物生——你的创造力扎根于踏实，作品往往经得起时间考验',
    '伤官格': '土性敦厚是你的底色——直言不讳之前，想一想那些话是会滋养人还是压垮人',
    '建禄月劫格': '大地不言而承载万物——你的沉默付出值得被看见，学会偶尔说"我需要帮助"',
    '阳刃格': '山崩之势不可久——你的果决在关键时刻是武器，但日常中多一分柔和，少一分对抗',
  },
  '金': {
    '正官格': '如钟鼎身正令行，规则不是你的枷锁而是你的铠甲。守住底线，自然不怒自威',
    '七杀格': '金需火炼方能成器——压力是你最好的锻炉。找一位能打磨你的导师，胜过独自硬扛',
    '正财格': '金玉其质，你天然知道什么值得投资。把钱花在"让自己更值钱"的地方，回报率最高',
    '偏财格': '如锋刃善断，你对机会的判断力精准。但风口之外，攒一条护城河会更长久',
    '正印格': '金声玉振，你吸收知识的效率很高。但别停留在"知道"，去"做到"——行动才是试金石',
    '偏印格': '你的专长如未开刃的剑——找到一个适合的平台把它打磨出来，锋芒自现',
    '食神格': '金石之声最动人——你的创作有天然的质感。让作品说话，不必过多解释',
    '伤官格': '金刚易折——才华是你的锋芒，但出鞘之前想清楚这一剑指向谁。收得住才是真本事',
    '建禄月劫格': '独金难鸣，合则成钟——你习惯自己搞定一切，但和声比独奏更有力量',
    '阳刃格': '金锋虽利，过刚易折。你不是非要示弱，但关键时后退半步，反而能赢得整盘棋',
  },
  '水': {
    '正官格': '如江海纳百川而成其大，守规矩不是限制而是河床——没有边界的水只会泛滥',
    '七杀格': '水能载舟亦能覆舟——你的能量是一把双刃剑。找到合适的"航道"，暗流也能变成动力',
    '正财格': '水为财源——但水流需要引导才能灌溉良田。学会理财就是学会筑渠，让每一滴水都流对地方',
    '偏财格': '水无常形善顺势——你对机会的嗅觉天生敏锐。但浪潮退去之后，留在岸上的才是真收获',
    '正印格': '水滴石穿非一日之功——学习对你来说是一场马拉松而非冲刺。持续的深度比广度更重要',
    '偏印格': '你的思维如地下水系，别人看不到但你自己知道流向何方。找到出口的那一天，自有清泉涌出',
    '食神格': '水润万物而无声——你的创造力温柔却有渗透力。把这份天赋用在滋养他人的事上',
    '伤官格': '水激则湍——表达欲是你的本性，但急流伤岸。慢下来，让言语如溪水般从容',
    '建禄月劫格': '百川归海——你并非一定要独自流淌。找到自己能汇入的大方向，一个人变成一条江',
    '阳刃格': '洪水之力虽猛但不可久——你不是只能硬碰硬，退一步绕过去，水流自会找到出路',
  },
}

// 化格 — 通用开头 + 五行隐喻后缀
const HUA_GE_METAPHOR: Record<string, string> = {
  '土': '厚德载物，你正走在一条深扎根的路上。蜕变的过程虽然漫长，但每一步都在为你垒起更坚实的地基',
  '金': '百炼成钢——你正在经历高温与敲打，但每一次锤击都在去除杂质。脱胎换骨之后，刃自锋芒',
  '水': '上善若水——你比想象中更有适应力。水无常形却能穿石，顺着流变的方向走，你会到达意想不到的远方',
  '木': '破土重生——旧土壤已不适合你，新的土壤会让你长得更高。种子的力量不在大小，在方向',
  '火': '薪火相传——你不再是燃料，而是光源本身。照亮自己的路，自然也会有人循光而来',
}

// 从格 — 各自独立表达
const CONG_GE_WISDOM: Record<string, string> = {
  '从杀格': '你不走寻常路——借势比蛮力更适合你。找准那根可以借力的杠杆，顺势而行比逆流而上有效得多',
  '从财格': '你天生懂得以柔克刚，不争而善胜。像冲浪者等待一道好浪——平时练习划水，浪来全力冲刺',
}

// 五行流通 — 3档严重程度
function getFlowWarning(liuTong: ReturnType<typeof analyzeWuXingLiuTong>): string {
  if (liuTong.blockage === null || liuTong.tongGuan === null) {
    return '五行流通顺畅，你的能量没有明显的卡点——这是一份难得的福气，善用它'
  }

  const { blockage, tongGuan, drop } = liuTong
  const dir = ELEMENT_DIRECTION[tongGuan] ?? tongGuan

  if (drop <= 3) {
    return `五行之气在${blockage}处略有不畅，补一点${tongGuan}（${dir}）即可通调——日常稍加注意便能改善`
  }
  if (drop <= 5) {
    return `能量在${blockage}处形成瓶颈，${tongGuan}气不足导致流转受阻。建议重点从${dir}方向调整，让气机恢复畅通`
  }
  return `${blockage}→${tongGuan}出现断崖式跌落，气机几乎断开。补${tongGuan}（${dir}）是你命局当下的头等大事，不可忽视`
}

// 破格/不成格 — 按具体原因区分
function getOutcomeWarning(reason: string, outcome: string): string {
  if (outcome === '破格') {
    if (/印.*破|破.*印/.test(reason)) {
      return '印星受损不代表缺乏庇护——你比想象中更独立，也更坚韧。那些没有庇护的日子，恰恰练就了你'
    }
    if (/财.*破|破.*财/.test(reason)) {
      return '财星被破教你的不是"钱不重要"——而是让你更早看清，什么才是真正值得投资的东西'
    }
    if (/七杀.*无制|杀.*无/.test(reason)) {
      return '压力曾是你的敌人，但学会驾驭它之后，它会成为最烈的马鞭。你不是被打倒，而是在练习站稳'
    }
    if (/伤官.*破|破.*伤官/.test(reason)) {
      return '才华暂时找不到出口——但地下的岩浆积累越久，喷发时越壮观。你的时代还没到，不代表不会到'
    }
    return '格局破损不意味着失败——它恰恰造就了你的韧性和适应力。破碎之后重建的，往往比原来的更坚固'
  }

  if (outcome === '不成格') {
    if (/伤官.*旺|伤官.*弱/.test(reason)) {
      return '才华的火候尚欠几分——但这不代表你没有才华。大运流转，属于你的东风迟早会来'
    }
    if (/印.*根|印.*弱/.test(reason)) {
      return '根基未稳，正是扎根的好时候。你不是不行，只是还在蓄力——竹子前四年只长三厘米，第五年冲天而起'
    }
    if (/财.*弱|财.*破/.test(reason)) {
      return '暂时的资源匮乏，锻炼的是你创造资源的能力。你不是缺钱，是缺一个对的时机——时机未到，先练内功'
    }
    if (/身强|身弱/.test(reason)) {
      return '平衡还需要微调——就像调琴，弦太紧太松都不行。大运流年会补齐缺失的条件，你只需保持耐心'
    }
    return '格局尚欠火候，但大运流年会补齐缺失的条件。你不是不行，只是时候未到'
  }

  return ''
}

function getWarningSection(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
): string {
  const liuTong = analyzeWuXingLiuTong(bazi)
  const dayEl = bazi.dayMasterElement

  // 1. 格局智慧 — 格言 + 日主方向
  let wisdom: string
  const motto = GRID_MOTTO[pattern.displayName]
  if (motto && dayEl && DAY_MASTER_DIRECTION[dayEl]?.[pattern.displayName]) {
    wisdom = `「${motto}」——${DAY_MASTER_DIRECTION[dayEl][pattern.displayName]}`
  } else if (pattern.displayName.includes('化') && dayEl && HUA_GE_METAPHOR[dayEl]) {
    wisdom = HUA_GE_METAPHOR[dayEl]
  } else if (CONG_GE_WISDOM[pattern.displayName]) {
    wisdom = CONG_GE_WISDOM[pattern.displayName]
  } else {
    wisdom = `${pattern.displayName}是你命局的核心特质——顺势而为，找到属于自己的节奏`
  }

  // 2. 五行流通提醒
  const flowNote = getFlowWarning(liuTong)

  // 3. 破格/不成格追加
  const poGeNote = getOutcomeWarning(outcome.reason, outcome.outcome)

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
// ── 模块6：格局解法 ──
// 综合格局诊断 + 五行流通诊断，生成解法文案。
// 优先取流通通关用神；若流通顺畅则取格局用神。

const GENERATING: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const PATTERN_CHARACTER: Record<string, string> = {
  '正官格': '正官格重规则守秩序',
  '七杀格': '七杀格是猛虎出笼',
  '正财格': '正财格脚踏实地',
  '偏财格': '偏财格善借势',
  '正印格': '正印格厚积薄发',
  '偏印格': '偏印格剑走偏锋',
  '食神格': '食神格天生懂得享受',
  '伤官格': '伤官格才华需要出口',
  '建禄月劫格': '建禄月劫独立自主',
  '阳刃格': '阳刃格能扛事敢决断',
  '从杀格': '从杀格借力打力不硬扛',
  '从财格': '从财格顺势而为等浪来',
  '化土格': '化土格正在蜕变重生',
  '化金格': '化金格百炼方成钢',
  '化水格': '化水格随形而变',
  '化木格': '化木格破土重生',
  '化火格': '化火格从薪柴化烈焰',
}

const ELEMENT_ADVICE_SHORT: Record<string, string> = {
  '金': '技术、专业技能',
  '水': '学习、沟通',
  '木': '社交、人脉',
  '火': '展示、分享',
  '土': '稳固、储蓄',
}

function getGeJuJieFa(
  bazi: BaziResult,
  pattern: ExtractResult,
  outcome: AssessResult,
): string {
  const liuTong = analyzeWuXingLiuTong(bazi)
  const charLine = PATTERN_CHARACTER[pattern.displayName] ?? `${pattern.displayName}是你的人生底色`

  // Path A：有堵点 → 通关用神
  if (liuTong.blockage && liuTong.tongGuan) {
    const blockageEl = liuTong.blockage
    const tongGuanEl = liuTong.tongGuan
    const nextEl = GENERATING[tongGuanEl] ?? ''
    const direction = ELEMENT_ADVICE_SHORT[tongGuanEl] ?? tongGuanEl
    const outcomeTag = outcome.outcome === '成格' ? '格局成立，但流通受阻' : '困局待破'
    return `**格局解法**：${charLine}——${outcomeTag}。能量在${blockageEl}处淤堵，通关用神为${tongGuanEl}。${tongGuanEl}能泄${blockageEl}生${nextEl}，凿开困局。建议从${direction}方向突破。`
  }

  // Path B：流通顺畅 → 格局用神
  const yongShenEl = pattern.yongShen.length === 1 ? (getStemElement(pattern.yongShen) ?? null) : null
  const statusLine = outcome.outcome === '成格' ? '格局成立，流通顺畅' : '流通顺畅，格局待成'
  if (yongShenEl) {
    const direction = ELEMENT_ADVICE_SHORT[yongShenEl] ?? yongShenEl
    return `**格局解法**：${charLine}——${statusLine}。你最需要${yongShenEl}，补${yongShenEl}以增强${direction}，把你的天赋引到对的方向上。`
  }
  return `**格局解法**：${charLine}——${statusLine}。${outcome.reason ? outcome.reason.slice(0, 30) + '。' : ''}顺势而行，自有出路。`
}

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

  const geJuJieFa = getGeJuJieFa(bazi, pattern, outcome)
  sections.push(geJuJieFa)

  const warning = getWarningSection(bazi, pattern, outcome)
  sections.push(warning)

  const analysis = sections.join('\n\n')

  const liuTongResult = analyzeWuXingLiuTong(bazi)
  const narrative = generateNarrative(bazi, pattern, outcome, strength, liuTongResult)

  return { summary, analysis, narrative }
}
