// ── 神煞查表模块（《渊海子平》/ 通行惯例）──

import type { BaziResult } from '@/types/bazi'

// ── 类型 ──

export interface ShenSha {
  name: string
  category: '贵人' | '凶星' | '泛星'
  pillar: '年柱' | '月柱' | '日柱' | '时柱'
  description: string
  basis: string
}

// ── 帮助函数 ──

const PILLAR_KEYS = ['year', 'month', 'day', 'hour'] as const
type PillarKey = (typeof PILLAR_KEYS)[number]

const PILLAR_LABEL: Record<PillarKey, ShenSha['pillar']> = {
  year: '年柱', month: '月柱', day: '日柱', hour: '时柱',
}

function stemsOf(bazi: BaziResult): Record<PillarKey, string> {
  const p = bazi.pillars
  return { year: p.year.stem, month: p.month.stem, day: bazi.dayMaster, hour: p.hour.stem }
}

function branchesOf(bazi: BaziResult): Record<PillarKey, string> {
  const p = bazi.pillars
  return { year: p.year.branch, month: p.month.branch, day: p.day.branch, hour: p.hour.branch }
}

const MONTH_NUM: Record<string, number> = {
  '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6,
  '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12,
}

/** 四柱中存在 targetBranches 中任一支的柱位 */
function matchBranch(bazi: BaziResult, targetBranches: string[]): PillarKey[] {
  const br = branchesOf(bazi)
  return PILLAR_KEYS.filter((k) => targetBranches.includes(br[k]))
}

/** 四柱中存在 targetStems 中任一天的柱位 */
function matchStem(bazi: BaziResult, targetStems: string[]): PillarKey[] {
  const st = stemsOf(bazi)
  return PILLAR_KEYS.filter((k) => targetStems.includes(st[k]))
}

/** 三合局 → 对应分支 */
const SAN_HE_MAP: Record<string, string[]> = {
  '申': ['申','子','辰'], '子': ['申','子','辰'], '辰': ['申','子','辰'],
  '亥': ['亥','卯','未'], '卯': ['亥','卯','未'], '未': ['亥','卯','未'],
  '寅': ['寅','午','戌'], '午': ['寅','午','戌'], '戌': ['寅','午','戌'],
  '巳': ['巳','酉','丑'], '酉': ['巳','酉','丑'], '丑': ['巳','酉','丑'],
}

// ═══════════════════════════════════════════
// 一、贵人星
// ═══════════════════════════════════════════

const TIAN_YI_MAP: Record<string, string[]> = {
  '甲': ['丑','未'], '戊': ['丑','未'], '庚': ['丑','未'],
  '乙': ['子','申'], '己': ['子','申'],
  '丙': ['亥','酉'], '丁': ['亥','酉'],
  '壬': ['卯','巳'], '癸': ['卯','巳'],
  '辛': ['寅','午'],
}

function findTianYi(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const targets = TIAN_YI_MAP[dm]
  if (!targets) return []
  return matchBranch(bazi, targets).map((k) => ({
    name: '天乙贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `天乙贵人，命中逢之主贵人扶持，逢凶化吉`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

function findTianDe(bazi: BaziResult): ShenSha[] {
  const monthBranch = bazi.pillars.month.branch
  // 正丁二坤(申)三壬，四辛五乾(亥)六甲
  // 七癸八艮(寅)九丙，十乙十一巽(巳)十二庚
  const stemMap: Record<string, string> = {
    '寅': '丁', '辰': '壬', '巳': '辛', '未': '甲',
    '申': '癸', '戌': '丙', '亥': '乙', '丑': '庚',
  }
  const branchMap: Record<string, string> = {
    '卯': '申', '午': '亥', '酉': '寅', '子': '巳',
  }
  const results: ShenSha[] = []
  const targetStem = stemMap[monthBranch]
  if (targetStem) {
    matchStem(bazi, [targetStem]).forEach((k) => {
      results.push({
        name: '天德贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
        description: `天德贵人，月德所钟，逢凶化吉，一生少病`,
        basis: '【通行惯例/《渊海子平》】',
      })
    })
  }
  const targetBranch = branchMap[monthBranch]
  if (targetBranch) {
    matchBranch(bazi, [targetBranch]).forEach((k) => {
      results.push({
        name: '天德贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
        description: `天德贵人，月德所钟，逢凶化吉，一生少病`,
        basis: '【通行惯例/《渊海子平》】',
      })
    })
  }
  return results
}

function findYueDe(bazi: BaziResult): ShenSha[] {
  const monthBranch = bazi.pillars.month.branch
  const map: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '亥': '甲', '卯': '甲', '未': '甲',
    '申': '壬', '子': '壬', '辰': '壬',
    '巳': '庚', '酉': '庚', '丑': '庚',
  }
  const targetStem = map[monthBranch]
  if (!targetStem) return []
  return matchStem(bazi, [targetStem]).map((k) => ({
    name: '月德贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `月德贵人，阴德庇佑，心地善良，祸自消弭`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

const TAI_JI_MAP: Record<string, string[]> = {
  '甲': ['子','午'], '乙': ['子','午'],
  '丙': ['卯','酉'], '丁': ['卯','酉'],
  '戊': ['辰','戌','丑','未'], '己': ['辰','戌','丑','未'],
  '庚': ['寅','亥'], '辛': ['寅','亥'],
  '壬': ['巳','申'], '癸': ['巳','申'],
}

function findTaiJi(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const targets = TAI_JI_MAP[dm]
  if (!targets) return []
  return matchBranch(bazi, targets).map((k) => ({
    name: '太极贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `太极贵人，主智慧超群，好学深思，有玄学天赋`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

const FU_XING_MAP: Record<string, string> = {
  '甲': '寅', '丙': '寅', '戊': '寅',
  '乙': '丑', '丁': '丑', '己': '丑',
  '庚': '午',
  '辛': '巳',
  '壬': '辰',
  '癸': '卯',
}

function findFuXing(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const target = FU_XING_MAP[dm]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '福星贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `福星贵人，一生福禄丰厚，衣食无忧`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

const WEN_CHANG_MAP: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
}

function findWenChang(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const target = WEN_CHANG_MAP[dm]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '文昌贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `文昌贵人，主文采出众，学业有成，聪明过人`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 德秀贵人（按月支查天干）
const DE_XIU_MAP: Record<string, string[]> = {
  '寅': ['丙','丁'], '午': ['丙','丁'], '戌': ['丙','丁'],
  '亥': ['壬','癸'], '卯': ['壬','癸'], '未': ['壬','癸'],
  '申': ['庚','辛'], '子': ['庚','辛'], '辰': ['庚','辛'],
  '巳': ['甲','乙'], '酉': ['甲','乙'], '丑': ['甲','乙'],
}

function findDeXiu(bazi: BaziResult): ShenSha[] {
  const mb = bazi.pillars.month.branch
  const targets = DE_XIU_MAP[mb]
  if (!targets) return []
  return matchStem(bazi, targets).map((k) => ({
    name: '德秀贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `德秀贵人，德才兼备，秀气内敛，品学兼优`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 国印贵人（按日干查）
const GUO_YIN_MAP: Record<string, string> = {
  '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑',
  '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申',
}

function findGuoYin(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const target = GUO_YIN_MAP[dm]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '国印贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `国印贵人，主掌权印，有管理才能，诚信可靠`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 金舆（按日干查）
const JIN_YU_MAP: Record<string, string> = {
  '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未',
  '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅',
}

function findJinYu(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const target = JIN_YU_MAP[dm]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '金舆', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `金舆，主车马富贵，出行便利，多得代步之福`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// ═══════════════════════════════════════════
// 二、凶星
// ═══════════════════════════════════════════

const YANG_REN_MAP: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '未', '戊': '午',
  '己': '未', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
}

function findYangRen(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const target = YANG_REN_MAP[dm]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '羊刃', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `羊刃，刚强急躁，需制伏方为权柄，否则易冲动伤身`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 孤鸾煞（按日柱干支组合）
const GU_LUAN_SET = new Set([
  '甲寅','乙卯','丙午','丁巳','戊午',
  '己巳','庚申','辛酉','壬子','癸亥',
])

function findGuLuan(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!GU_LUAN_SET.has(combo)) return []
  return [{
    name: '孤鸾煞', category: '凶星' as const, pillar: '日柱',
    description: `孤鸾煞，主婚姻不顺，男克妻女克夫，宜晚婚化解`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 寡宿（按年支查）
const GUA_SU_MAP: Record<string, string> = {
  '亥': '戌', '子': '戌', '丑': '戌',
  '寅': '丑', '卯': '丑', '辰': '丑',
  '巳': '辰', '午': '辰', '未': '辰',
  '申': '未', '酉': '未', '戌': '未',
}

function findGuaSu(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const target = GUA_SU_MAP[yb]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '寡宿', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `寡宿，主孤寡独处，情感上易感孤独，宜主动社交化解`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 劫煞（按年支/日支查）
const JIE_SHA_MAP: Record<string, string> = {
  '申': '巳', '子': '巳', '辰': '巳',
  '亥': '申', '卯': '申', '未': '申',
  '寅': '亥', '午': '亥', '戌': '亥',
  '巳': '寅', '酉': '寅', '丑': '寅',
}

function findJieSha(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (JIE_SHA_MAP[yb]) targets.add(JIE_SHA_MAP[yb])
  if (JIE_SHA_MAP[db]) targets.add(JIE_SHA_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '劫煞', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `劫煞，主破财争斗，宜以柔克刚，避免正面冲突`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 吊客（按年支查，年支前两位）
const DIAO_KE_MAP: Record<string, string> = {
  '子': '戌', '丑': '亥', '寅': '子', '卯': '丑',
  '辰': '寅', '巳': '卯', '午': '辰', '未': '巳',
  '申': '午', '酉': '未', '戌': '申', '亥': '酉',
}

function findDiaoKe(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const target = DIAO_KE_MAP[yb]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '吊客', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `吊客，主丧事吊唁之象，逢之多注意家人健康`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 九丑（按日柱）
const JIU_CHOU_SET = new Set([
  '戊子','戊午','壬子','壬午','丁酉','丁卯',
  '己酉','己卯','辛酉','辛卯',
])

function findJiuChou(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!JIU_CHOU_SET.has(combo)) return []
  return [{
    name: '九丑', category: '凶星' as const, pillar: '日柱',
    description: `九丑，主容貌焦虑或情感纠葛，宜修心养性化之`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 童子煞（按日柱组合 + 月令）
const TONG_ZI_COMBOS: Record<string, string[]> = {
  '寅': ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
  '卯': ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
  '辰': ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬子','癸亥'],
  '巳': ['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
  '午': ['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
  '未': ['甲辰','乙亥','丙寅','丁酉','戊寅','己未','庚午','辛巳','壬戌','癸未'],
  '申': ['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
  '酉': ['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
  '戌': ['甲子','乙亥','丙寅','丁卯','戊午','己卯','庚申','辛巳','壬申','癸未'],
  '亥': ['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
  '子': ['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
  '丑': ['甲戌','乙亥','丙子','丁丑','戊申','己酉','庚子','辛卯','壬子','癸亥'],
}

function findTongZi(bazi: BaziResult): ShenSha[] {
  const mb = bazi.pillars.month.branch
  const combos = TONG_ZI_COMBOS[mb]
  if (!combos) return []
  const dayCombo = bazi.dayMaster + bazi.pillars.day.branch
  if (!combos.includes(dayCombo)) return []
  return [{
    name: '童子煞', category: '凶星' as const, pillar: '日柱',
    description: `童子煞，传说为仙界童子下凡，多主婚姻迟滞，宜还愿化解`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// ═══════════════════════════════════════════
// 三、泛星
// ═══════════════════════════════════════════

// 桃花（按年支/日支）
const TAO_HUA_MAP: Record<string, string> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '亥': '子', '卯': '子', '未': '子',
  '申': '酉', '子': '酉', '辰': '酉',
  '巳': '午', '酉': '午', '丑': '午',
}

function findTaoHua(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (TAO_HUA_MAP[yb]) targets.add(TAO_HUA_MAP[yb])
  if (TAO_HUA_MAP[db]) targets.add(TAO_HUA_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '桃花', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `桃花，主人缘佳、有魅力，需注意情感分寸`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 驿马（按年支/日支）
const YI_MA_MAP: Record<string, string> = {
  '寅': '申', '午': '申', '戌': '申',
  '亥': '巳', '卯': '巳', '未': '巳',
  '申': '寅', '子': '寅', '辰': '寅',
  '巳': '亥', '酉': '亥', '丑': '亥',
}

function findYiMa(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (YI_MA_MAP[yb]) targets.add(YI_MA_MAP[yb])
  if (YI_MA_MAP[db]) targets.add(YI_MA_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '驿马', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `驿马，主奔波、走动、迁移，动中求财`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 华盖（按年支/日支）
const HUA_GAI_MAP: Record<string, string> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '亥': '未', '卯': '未', '未': '未',
  '申': '辰', '子': '辰', '辰': '辰',
  '巳': '丑', '酉': '丑', '丑': '丑',
}

function findHuaGai(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (HUA_GAI_MAP[yb]) targets.add(HUA_GAI_MAP[yb])
  if (HUA_GAI_MAP[db]) targets.add(HUA_GAI_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '华盖', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `华盖，主孤高聪慧，有艺术/玄学天赋，喜独处思考`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 将星（按年支/日支，三合局旺位）
const JIANG_XING_MAP: Record<string, string> = {
  '申': '子', '子': '子', '辰': '子',
  '亥': '卯', '卯': '卯', '未': '卯',
  '寅': '午', '午': '午', '戌': '午',
  '巳': '酉', '酉': '酉', '丑': '酉',
}

function findJiangXing(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (JIANG_XING_MAP[yb]) targets.add(JIANG_XING_MAP[yb])
  if (JIANG_XING_MAP[db]) targets.add(JIANG_XING_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '将星', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `将星，主领导才能，有决断力，适合管理岗位`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 红艳（按日干）
const HONG_YAN_MAP: Record<string, string> = {
  '甲': '午', '乙': '申', '丙': '寅', '丁': '未', '戊': '辰',
  '己': '辰', '庚': '戌', '辛': '酉', '壬': '子', '癸': '申',
}

function findHongYan(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const target = HONG_YAN_MAP[dm]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '红艳', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `红艳，主异性缘佳，情感丰富，需防桃花过旺`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 十灵（按日柱）
const SHI_LING_SET = new Set([
  '甲辰','乙亥','丙辰','丁酉','戊午',
  '庚午','庚戌','辛亥','壬寅','癸未',
])

function findShiLing(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!SHI_LING_SET.has(combo)) return []
  return [{
    name: '十灵', category: '泛星' as const, pillar: '日柱',
    description: `十灵，主聪明灵秀，有艺术天赋，感受力敏锐`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// ═══════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════

export function getAllShenSha(bazi: BaziResult): ShenSha[] {
  const results: ShenSha[] = [
    // 贵人星
    ...findTianYi(bazi),
    ...findTianDe(bazi),
    ...findYueDe(bazi),
    ...findTaiJi(bazi),
    ...findFuXing(bazi),
    ...findWenChang(bazi),
    ...findDeXiu(bazi),
    ...findGuoYin(bazi),
    ...findJinYu(bazi),
    // 凶星
    ...findYangRen(bazi),
    ...findGuLuan(bazi),
    ...findGuaSu(bazi),
    ...findJieSha(bazi),
    ...findDiaoKe(bazi),
    ...findJiuChou(bazi),
    ...findTongZi(bazi),
    // 泛星
    ...findTaoHua(bazi),
    ...findYiMa(bazi),
    ...findHuaGai(bazi),
    ...findJiangXing(bazi),
    ...findHongYan(bazi),
    ...findShiLing(bazi),
  ]

  // 按柱位排序
  const pillarOrder: Record<string, number> = { '年柱': 0, '月柱': 1, '日柱': 2, '时柱': 3 }
  results.sort((a, b) => pillarOrder[a.pillar] - pillarOrder[b.pillar])
  return results
}
