// ── 事业指引(基于命局综合分析)──
// CONSUMES-FULL-ANALYSIS-ONLY:本模块只消费 analyze() 的统一结果,
// 不重复计算格局/强弱/调候/流通/喜忌(诊断流程 L7/L10)。
// 行业建议/方位建议/城市推荐/行动建议 = 喜忌结论的翻译。

import type { BaziResult, ElementType } from '@/types/bazi'
import type { FullAnalysis } from './analyze'

// ═══════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════

export interface IndustryGroup {
  element: string
  label: string
  priority: 1 | 2
  items: string[]
}

export interface CityAdvice {
  name: string
  tier: 'primary' | 'secondary' | 'avoid'
  reason: string
}

export interface CareerGuidance {
  /** 命局一句话概述 */
  summary: string
  /** 适合的行业分组 */
  industries: IndustryGroup[]
  /** 有利方位说明 */
  directionPrimary: string
  directionSecondary: string
  directionAvoid: string
  /** 城市推荐 */
  cities: CityAdvice[]
  /** 3条行动建议 */
  actionSuggestions: string[]
  /** 喜忌冲突说明(来自喜忌规格书 2.5 裁决,所有文案统一呈现) */
  conflictNotes: string[]
}

// ═══════════════════════════════════════════
// 行业五行数据库
// ═══════════════════════════════════════════

interface ElementProfession {
  groupLabel: string
  items: string[]
}

const PROFESSION_MAP: Record<ElementType, ElementProfession> = {
  '木': {
    groupLabel: '木性行业（教育·创意·健康·管理）',
    items: [
      '教育培训 — 讲课、课程设计、人才培养',
      '文化创意 — 写作、出版、内容创作、设计',
      '健康领域 — 中医养生、心理咨询、康复理疗',
      '人力资源 — 招聘、组织发展、企业培训、猎头',
    ],
  },
  '火': {
    groupLabel: '火性行业（科技·餐饮·传媒·能源）',
    items: [
      '互联网科技 — 软件开发、AI、产品经理',
      '餐饮美食 — 餐厅、食品研发、供应链',
      '娱乐传媒 — 短视频、直播、影视制作',
      '医美化妆 — 美容、化妆品、个人护理',
    ],
  },
  '土': {
    groupLabel: '土性行业（金融·建筑·咨询·地产）',
    items: [
      '房地产建筑 — 开发、装修、室内设计',
      '金融保险 — 银行、证券、保险、信托',
      '咨询策划 — 管理咨询、品牌策划、战略顾问',
      '珠宝工艺 — 珠宝鉴定、陶瓷、艺术品收藏',
    ],
  },
  '金': {
    groupLabel: '金性行业（法律·制造·金融·安防）',
    items: [
      '法律合规 — 律师、法务、审计、合规',
      '机械制造 — 精密加工、汽车、航空、高端装备',
      '金融证券 — 投行、基金、量化交易',
      '军警安防 — 公安、消防、网络安全',
    ],
  },
  '水': {
    groupLabel: '水性行业（贸易·交通·传播·学术）',
    items: [
      '贸易流通 — 进出口、供应链、跨境电商',
      '交通旅游 — 物流、酒店、出行服务',
      '品牌传播 — 广告、公关、新媒体运营',
      '学术研究 — 高校、智库、社科、数据分析',
    ],
  },
}

// ═══════════════════════════════════════════
// 方位映射
// ═══════════════════════════════════════════

const ELEMENT_DIRECTION: Record<ElementType, { direction: string; desc: string }> = {
  '木': { direction: '东方', desc: '木旺之地，生发有力' },
  '火': { direction: '南方', desc: '火旺之地，热情升腾' },
  '土': { direction: '中原/本地', desc: '土旺之地，稳重厚实' },
  '金': { direction: '西方', desc: '金旺之地，收敛成器' },
  '水': { direction: '北方', desc: '水旺之地，智慧流通' },
}

// ═══════════════════════════════════════════
// 城市五行数据库
// ═══════════════════════════════════════════

interface CityEntry {
  name: string
  element: ElementType
  modifiers: string[]
  description: string
}

const CITY_DB: CityEntry[] = [
  // 水气城市
  { name: '上海', element: '水', modifiers: ['沿海', '长江口', '金融中心'], description: '长江入海口，水量充沛，商贸金融中心' },
  { name: '深圳', element: '水', modifiers: ['沿海', '科技中心'], description: '南海之滨，年轻活力，科技与贸易并重' },
  { name: '杭州', element: '水', modifiers: ['沿海', '西湖', '互联网'], description: '钱塘江畔、西湖水润，互联网经济活跃' },
  { name: '南京', element: '水', modifiers: ['长江', '古都'], description: '长江穿城，六朝古都，文教底蕴深厚' },
  { name: '武汉', element: '水', modifiers: ['长江', '百湖之市'], description: '长江与汉江交汇，九省通衢，百湖之市' },
  { name: '重庆', element: '水', modifiers: ['长江', '山城'], description: '长江与嘉陵江交汇，西南枢纽，水气充沛' },
  { name: '天津', element: '水', modifiers: ['沿海', '港口'], description: '渤海湾港口城市，北方水气最旺之地' },
  { name: '大连', element: '水', modifiers: ['沿海', '港口'], description: '三面环海，北方最佳沿海城市' },
  { name: '青岛', element: '水', modifiers: ['沿海', '港口'], description: '黄海之滨，气候宜人，品牌之都' },
  { name: '宁波', element: '水', modifiers: ['沿海', '港口'], description: '东海之滨，外贸港口，商业传统深厚' },
  { name: '厦门', element: '水', modifiers: ['沿海', '岛屿'], description: '海岛城市，贸易发达，水气环绕' },

  // 木气城市
  { name: '苏州', element: '木', modifiers: ['园林', '水乡', '制造业'], description: '江南水乡、园林之城，文化与制造并重' },
  { name: '成都', element: '木', modifiers: ['盆地', '天府'], description: '天府之国，文化创意与慢生活之都' },
  { name: '昆明', element: '木', modifiers: ['高原', '春城'], description: '四季如春，生态宜居，花木繁盛' },
  { name: '福州', element: '木', modifiers: ['沿海', '榕城'], description: '榕树之城，东南沿海，木气与水气交融' },

  // 火气城市
  { name: '广州', element: '火', modifiers: ['沿海', '商贸'], description: '岭南中心，热情活力，商业火旺' },
  { name: '长沙', element: '火', modifiers: ['内陆', '娱乐'], description: '内陆火城，娱乐传媒发达，热情直率' },
  { name: '南宁', element: '火', modifiers: ['内陆', '绿城'], description: '南部内陆，气候炎热，东盟门户' },
  { name: '合肥', element: '火', modifiers: ['内陆', '科技'], description: '中部科技新城，发展迅猛，火气渐旺' },

  // 土气城市
  { name: '北京', element: '土', modifiers: ['首都', '内陆'], description: '北方帝都，土气厚重，政治文化中心' },
  { name: '郑州', element: '土', modifiers: ['中原', '枢纽'], description: '中原腹地，交通枢纽，土气最正' },
  { name: '西安', element: '土', modifiers: ['古都', '内陆'], description: '十三朝古都，黄土厚重，历史底蕴' },
  { name: '济南', element: '土', modifiers: ['内陆', '泉水'], description: '泉城济南，齐鲁大地，敦厚朴实' },

  // 金气城市
  { name: '沈阳', element: '金', modifiers: ['内陆', '重工业'], description: '东北工业重镇，金气收敛' },
  { name: '兰州', element: '金', modifiers: ['内陆', '西北'], description: '西北枢纽，金气肃杀' },
]

// ═══════════════════════════════════════════
// 强弱策略话术
// ═══════════════════════════════════════════

interface StrengthTemplate {
  summaryPrefix: string
  strategyHint: string
}

const STRENGTH_TEMPLATES: Record<string, StrengthTemplate> = {
  '身强': {
    summaryPrefix: '日主强旺',
    strategyHint: '适合主动开拓、独立创业、担任领导角色',
  },
  '中和': {
    summaryPrefix: '日主中和',
    strategyHint: '稳中求进，审时度势，可攻可守',
  },
  '身弱': {
    summaryPrefix: '日主偏弱',
    strategyHint: '适合借力平台、跟对人、团队协作发展',
  },
}

// ═══════════════════════════════════════════
// 格局 → 策略话术
// ═══════════════════════════════════════════

const PATTERN_STRATEGY_TIPS: Record<string, string[]> = {
  '正官格': ['正官格重规则和秩序，在法律、管理、公务员体系中容易获得认可', '保持正直和纪律性是你最大的竞争优势'],
  '七杀格': ['七杀格有魄力、能扛压，适合在竞争激烈的领域脱颖而出', '凭专业能力立足，不要频繁换赛道，深耕一个领域做到头部'],
  '正财格': ['正财格稳健务实，适合稳定的收入来源和长期积累', '靠专业和信誉赚钱，不投机取巧'],
  '偏财格': ['偏财格善于抓住机会，适合投资、贸易、销售等弹性收入领域', '注意控制风险，偏财来去都快'],
  '正印格': ['正印格聪慧好学，适合学术、教育、文化传播领域', '凭知识和专业能力说话，学历和资质是你的护身符'],
  '偏印格': ['偏印格思维独特，适合需要深度思考和创意的领域', '你的独特视角是优势，但要学会用通俗语言表达'],
  '食神格': ['食神格温和有才艺，适合创意、设计、餐饮、教育等领域', '你的天赋在创造和分享，不要被琐碎的行政工作困住'],
  '伤官格': ['伤官格才华横溢，适合需要创新和表达的领域', '伤官佩印是才子格局，靠智慧和表达力吃饭'],
  '建禄月劫格': ['建禄格日主旺，靠自己实力立足，不依赖巴结和关系', '用神指引的方向就是你最能发挥的赛道'],
  '阳刃格': ['阳刃格个性刚强，适合需要决断力和执行力的岗位', '宜用官杀来约束自己，在规则和秩序中发挥最大价值'],
  '从杀格': ['从杀格气势偏于权威，适合在体制内或大平台中发展', '需要贵人和权威人物的认可，进入主流系统比单打独斗更有利'],
  '从财格': ['从财格气势偏于财富，适合直接面向市场和商业的领域', '市场嗅觉敏锐，但要避开官非和合同纠纷'],
}

// ═══════════════════════════════════════════
// 五行缺失 → 补充建议
// ═══════════════════════════════════════════

const MISSING_ELEMENT_ADVICE: Record<ElementType, string> = {
  '木': '培养「发散和成长」的思维——多阅读、多接触新领域、保持学习的节奏',
  '火': '培养「表达和展示」的习惯——多输出、多分享、让更多人看到你的才华',
  '土': '培养「沉淀和积累」的耐心——定期复盘、建立体系、不急于求成',
  '金': '培养「收敛和做减法」的能力——定期复盘、学会拒绝、砍掉不重要的事',
  '水': '培养「流动和适应」的智慧——多旅行、多交流、不固守一地一域',
}

// ═══════════════════════════════════════════
// 五行过多 → 警惕建议
// ═══════════════════════════════════════════

const EXCESS_ELEMENT_WARNING: Record<ElementType, string> = {
  '木': '木气过旺，容易想法太多而行动太少，注意落地执行',
  '火': '火气过旺，容易急躁冲动，注意控制情绪和节奏',
  '土': '土气过旺，容易固执保守，注意灵活变通',
  '金': '金气过旺，容易过于刚硬，注意柔软和人情',
  '水': '水气过旺，容易思虑过多而缺乏行动，注意果断执行',
}

// ═══════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════

export function generateCareerGuidanceFromFull(full: Omit<FullAnalysis, 'texts'>): CareerGuidance {
  const bazi = full.bazi
  const pattern = full.pattern
  const strength = full.strength
  const tiaoHouType = full.tiaoHou.type
  const tiaoHouElements = full.tiaoHou.elements
  const wuXingCount = full.wuXing.count
  const liuTong = full.liuTong

  const favorableElements = full.xiYong.favorable
  const primaryElement = full.xiYong.primaryFavorable
  const secondaryElement = full.xiYong.secondaryFavorable
  const avoidElements = full.xiYong.avoid
  const conflictNotes = full.xiYong.conflicts.map((c) => c.note)

  // ── 2. 汇总 ──
  const stTemplate = STRENGTH_TEMPLATES[strength.level]

  // 格局一句话描述
  const patternSummary = `${bazi.dayMaster}${bazi.dayMasterElement}生于${bazi.pillars.month.branch}月${pattern.displayName}`

  // 调候补充
  let tiaoHouClause = ''
  if (tiaoHouType === '火炎土燥') tiaoHouClause = '，命局偏燥需水润局'
  else if (tiaoHouType === '金寒水冷') tiaoHouClause = '，命局偏寒需火暖局'

  const summary = `${patternSummary}，${stTemplate.summaryPrefix}${tiaoHouClause}。${stTemplate.strategyHint}。`

  // ── 3. 行业建议 ──
  const industries: IndustryGroup[] = []

  if (primaryElement && PROFESSION_MAP[primaryElement]) {
    const prof = PROFESSION_MAP[primaryElement]
    industries.push({
      element: primaryElement,
      label: `${prof.groupLabel}——第一优先`,
      priority: 1,
      items: prof.items,
    })
  }

  if (secondaryElement && secondaryElement !== primaryElement && PROFESSION_MAP[secondaryElement]) {
    const prof = PROFESSION_MAP[secondaryElement]
    industries.push({
      element: secondaryElement,
      label: `${prof.groupLabel}——辅助方向`,
      priority: 2,
      items: prof.items,
    })
  }

  // 如果从格局也没提取到用神，fallback 到调候
  if (industries.length === 0 && tiaoHouElements.length > 0) {
    const fallbackEl = tiaoHouElements[0]
    if (PROFESSION_MAP[fallbackEl]) {
      const prof = PROFESSION_MAP[fallbackEl]
      industries.push({
        element: fallbackEl,
        label: `${prof.groupLabel}——根据调候推荐`,
        priority: 1,
        items: prof.items,
      })
    }
  }

  // ── 4. 方位建议 ──
  const dirPrimary = primaryElement
    ? `首选${ELEMENT_DIRECTION[primaryElement].direction}（${ELEMENT_DIRECTION[primaryElement].desc}）`
    : '以出生地为中心发展'

  const dirSecondary = secondaryElement
    ? `次选${ELEMENT_DIRECTION[secondaryElement].direction}（${ELEMENT_DIRECTION[secondaryElement].desc}）`
    : ''

  const avoidDirList = avoidElements
    .slice(0, 2)
    .map((el) => ELEMENT_DIRECTION[el].direction)
    .join('、')
  const dirAvoid = avoidDirList
    ? `不利方位：${avoidDirList}（加重命局不平衡）`
    : '无明显不利方位'

  // ── 5. 城市推荐 ──
  const cities: CityAdvice[] = []

  // 按 primary/secondary element 匹配城市
  // 【本系统决策】确定性排序:按城市名+四柱哈希稳定排序,同一命盘每次结果一致
  const pillarKey = `${bazi.pillars.year.stem}${bazi.pillars.year.branch}${bazi.pillars.month.stem}${bazi.pillars.month.branch}${bazi.dayMaster}${bazi.pillars.day.branch}${bazi.pillars.hour.stem}${bazi.pillars.hour.branch}`
  const cityHash = (c: CityEntry) => (pillarKey + c.name).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
  const primaryCities = CITY_DB
    .filter((c) => c.element === primaryElement)
    .sort((a, b) => cityHash(a) - cityHash(b))
  const secondaryCities = CITY_DB
    .filter((c) => c.element === secondaryElement && c.element !== primaryElement)
  const avoidCities = CITY_DB
    .filter((c) => avoidElements.includes(c.element))

  // 取 3 个首选城市（用简单 hash 做确定性选择，避免每次都不同）
  for (let i = 0; i < Math.min(3, primaryCities.length); i++) {
    const c = primaryCities[i]
    cities.push({ name: c.name, tier: 'primary', reason: c.description })
  }

  for (let i = 0; i < Math.min(2, secondaryCities.length); i++) {
    const c = secondaryCities[i]
    if (!cities.find((x) => x.name === c.name)) {
      cities.push({ name: c.name, tier: 'secondary', reason: c.description })
    }
  }

  for (let i = 0; i < Math.min(2, avoidCities.length); i++) {
    const c = avoidCities[i]
    if (!cities.find((x) => x.name === c.name)) {
      cities.push({ name: c.name, tier: 'avoid', reason: c.description })
    }
  }

  // ── 6. 行动建议（3条）──
  const actionSuggestions: string[] = []

  // 6.1 格局策略建议
  const patternTips = PATTERN_STRATEGY_TIPS[pattern.displayName] ?? []
  const primaryPatternTip = patternTips[0] ?? `${pattern.displayName}，靠专业能力立足，深耕一个领域`
  actionSuggestions.push(primaryPatternTip)

  // 6.2 调候或五行建议(救治元素=气候极端时的主喜用,来自喜忌规格书 2.1)
  if (tiaoHouType !== '寒暖适中') {
    const fixEl: ElementType = tiaoHouType === '火炎土燥' ? '水' : '火'
    const thDesc = ELEMENT_DIRECTION[fixEl].desc
    const tip2Templates: Record<string, string> = {
      '火炎土燥': `命局偏燥，多接触水相关环境——${thDesc}的城市、蓝色调空间、安静氛围，对你有加持`,
      '金寒水冷': `命局偏寒，多接触火相关环境——${thDesc}的城市、温暖色调空间、热闹氛围，对你有加持`,
    }
    actionSuggestions.push(tip2Templates[tiaoHouType])
  } else if (secondaryElement) {
    actionSuggestions.push(`第二喜用神为${secondaryElement}，在${primaryElement}方向之外，${ELEMENT_DIRECTION[secondaryElement].direction}发展也是加分项`)
  } else {
    actionSuggestions.push(`发挥你${pattern.displayName}的优势，在擅长的领域持续深耕`)
  }

  // 6.3 五行缺失或流通建议
  const missingElements = (Object.entries(wuXingCount) as [ElementType, number][])
    .filter(([, count]) => count === 0)
    .map(([el]) => el)

  const excessElements = (Object.entries(wuXingCount) as [ElementType, number][])
    .filter(([, count]) => count >= 3)
    .map(([el]) => el)

  if (missingElements.length > 0) {
    const missEl = missingElements[0]
    actionSuggestions.push(
      `八字缺${missEl}，${MISSING_ELEMENT_ADVICE[missEl]}。找一个属${missEl}的合伙人或导师，能补你最大的短板`,
    )
  } else if (liuTong.blockage) {
    actionSuggestions.push(
      `五行流通在${liuTong.blockage}→${liuTong.tongGuan}处有断点，建议补${liuTong.tongGuan}通关——多接触${liuTong.tongGuan}属性和相关人群`,
    )
  } else if (excessElements.length > 0) {
    const excEl = excessElements[0]
    actionSuggestions.push(EXCESS_ELEMENT_WARNING[excEl] ?? `${excEl}过旺，注意平衡`)
  } else {
    actionSuggestions.push('五行流通顺畅，各方向都有空间。关键在于选择一条路坚持下去')
  }

  return {
    summary,
    industries,
    directionPrimary: dirPrimary,
    directionSecondary: dirSecondary,
    directionAvoid: dirAvoid,
    cities,
    actionSuggestions: actionSuggestions.slice(0, 3),
    conflictNotes,
  }
}

