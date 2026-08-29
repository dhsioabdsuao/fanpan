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
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (TIAN_YI_MAP[dm]) TIAN_YI_MAP[dm].forEach(t => targets.add(t))
  if (TIAN_YI_MAP[ys]) TIAN_YI_MAP[ys].forEach(t => targets.add(t))
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
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
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (TAI_JI_MAP[dm]) TAI_JI_MAP[dm].forEach(t => targets.add(t))
  if (TAI_JI_MAP[ys]) TAI_JI_MAP[ys].forEach(t => targets.add(t))
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
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
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (FU_XING_MAP[dm]) targets.add(FU_XING_MAP[dm])
  if (FU_XING_MAP[ys]) targets.add(FU_XING_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
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
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (WEN_CHANG_MAP[dm]) targets.add(WEN_CHANG_MAP[dm])
  if (WEN_CHANG_MAP[ys]) targets.add(WEN_CHANG_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '文昌贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `文昌贵人，主文采出众，学业有成，聪明过人`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 德秀贵人（月支定三合局：天干见德秀 + 地支见三合局支，均为德秀）
const DE_XIU_MAP: Record<string, { de: string[]; xiu: string[] }> = {
  '寅': { de: ['丙','丁'], xiu: ['戊','癸'] },
  '午': { de: ['丙','丁'], xiu: ['戊','癸'] },
  '戌': { de: ['丙','丁'], xiu: ['戊','癸'] },
  '申': { de: ['壬','癸','戊','己'], xiu: ['丙','辛','甲','己'] },
  '子': { de: ['壬','癸','戊','己'], xiu: ['丙','辛','甲','己'] },
  '辰': { de: ['壬','癸','戊','己'], xiu: ['丙','辛','甲','己'] },
  '巳': { de: ['庚','辛'], xiu: ['乙','庚'] },
  '酉': { de: ['庚','辛'], xiu: ['乙','庚'] },
  '丑': { de: ['庚','辛'], xiu: ['乙','庚'] },
  '亥': { de: ['甲','乙'], xiu: ['丁','壬'] },
  '卯': { de: ['甲','乙'], xiu: ['丁','壬'] },
  '未': { de: ['甲','乙'], xiu: ['丁','壬'] },
}

const DE_XIU_SAN_HE: Record<string, string[]> = {
  '寅': ['寅','午','戌'], '午': ['寅','午','戌'], '戌': ['寅','午','戌'],
  '申': ['申','子','辰'], '子': ['申','子','辰'], '辰': ['申','子','辰'],
  '巳': ['巳','酉','丑'], '酉': ['巳','酉','丑'], '丑': ['巳','酉','丑'],
  '亥': ['亥','卯','未'], '卯': ['亥','卯','未'], '未': ['亥','卯','未'],
}

function findDeXiu(bazi: BaziResult): ShenSha[] {
  const mb = bazi.pillars.month.branch
  const entry = DE_XIU_MAP[mb]
  if (!entry) return []
  const stemTargets = [...entry.de, ...entry.xiu]
  const branchTargets = DE_XIU_SAN_HE[mb] ?? []
  const results: ShenSha[] = []
  const seen = new Set<string>()
  for (const key of PILLAR_KEYS) {
    const stem = stemsOf(bazi)[key]
    const branch = branchesOf(bazi)[key]
    if (stemTargets.includes(stem) || branchTargets.includes(branch)) {
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          name: '德秀贵人', category: '贵人' as const, pillar: PILLAR_LABEL[key],
          description: `德秀贵人，德才兼备，秀气内敛，品学兼优`,
          basis: '【通行惯例/《渊海子平》】',
        })
      }
    }
  }
  return results
}

// 国印贵人（按日干查）
const GUO_YIN_MAP: Record<string, string> = {
  '甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅', '戊': '丑',
  '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '申',
}

function findGuoYin(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (GUO_YIN_MAP[dm]) targets.add(GUO_YIN_MAP[dm])
  if (GUO_YIN_MAP[ys]) targets.add(GUO_YIN_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
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
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (JIN_YU_MAP[dm]) targets.add(JIN_YU_MAP[dm])
  if (JIN_YU_MAP[ys]) targets.add(JIN_YU_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '金舆', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `金舆，主车马富贵，出行便利，多得代步之福`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 天厨贵人（年干+日干 → 食神之禄位）
const TIAN_CHU_MAP: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '巳', '丁': '午', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
}

function findTianChu(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (TIAN_CHU_MAP[dm]) targets.add(TIAN_CHU_MAP[dm])
  if (TIAN_CHU_MAP[ys]) targets.add(TIAN_CHU_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '天厨贵人', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `天厨贵人，食禄丰足，福慧双修，一生不愁衣食`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 学堂（年干+日干 → 长生位）
const XUE_TANG_MAP: Record<string, string> = {
  '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅',
  '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯',
}

function findXueTang(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (XUE_TANG_MAP[dm]) targets.add(XUE_TANG_MAP[dm])
  if (XUE_TANG_MAP[ys]) targets.add(XUE_TANG_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '学堂', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `学堂，聪明好学，学业有成，登科及第`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 词馆（年干+日干 → 禄位对冲）
const CI_GUAN_MAP: Record<string, string> = {
  '甲': '申', '乙': '酉', '丙': '亥', '丁': '子', '戊': '亥',
  '己': '子', '庚': '寅', '辛': '卯', '壬': '巳', '癸': '午',
}

function findCiGuan(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (CI_GUAN_MAP[dm]) targets.add(CI_GUAN_MAP[dm])
  if (CI_GUAN_MAP[ys]) targets.add(CI_GUAN_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '词馆', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `词馆，学业精专，文章出类，官至翰林`,
    basis: '【通行惯例/《三命通会》】',
  }))
}

// 禄神（年干+日干 → 临官位）
const LU_SHEN_MAP: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
}

function findLuShen(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (LU_SHEN_MAP[dm]) targets.add(LU_SHEN_MAP[dm])
  if (LU_SHEN_MAP[ys]) targets.add(LU_SHEN_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '禄神', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `禄神，爵禄俸禄，地位权势，衣食丰足`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 天赦（月支定季节 + 日柱干支）
const TIAN_SHE_MAP: Record<string, string> = {
  '寅': '戊寅', '卯': '戊寅', '辰': '戊寅',
  '巳': '甲午', '午': '甲午', '未': '甲午',
  '申': '戊申', '酉': '戊申', '戌': '戊申',
  '亥': '甲子', '子': '甲子', '丑': '甲子',
}

function findTianShe(bazi: BaziResult): ShenSha[] {
  const mb = bazi.pillars.month.branch
  const target = TIAN_SHE_MAP[mb]
  if (!target) return []
  const dayCombo = bazi.dayMaster + bazi.pillars.day.branch
  if (dayCombo !== target) return []
  return [{
    name: '天赦', category: '贵人' as const, pillar: '日柱',
    description: `天赦，逢凶化吉，遇难呈祥，一生少刑狱之灾`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 三奇贵人（四柱天干顺序含甲戊庚/壬癸辛/乙丙丁）
function findSanQi(bazi: BaziResult): ShenSha[] {
  const stems = [
    bazi.pillars.year.stem,
    bazi.pillars.month.stem,
    bazi.pillars.day.stem,
    bazi.pillars.hour.stem,
  ]
  const s = stems.join('')
  const hasSanQi = s.includes('甲戊庚') || s.includes('壬癸辛') || s.includes('乙丙丁')
  if (!hasSanQi) return []
  return [{
    name: '三奇贵人', category: '贵人' as const, pillar: '日柱',
    description: `三奇贵人，命带三奇，襟怀卓越，博学多能，功名显达`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 日德（日柱固定组合）
const RI_DE_SET = new Set(['甲寅','戊辰','丙辰','庚辰','壬戌'])

function findRiDe(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!RI_DE_SET.has(combo)) return []
  return [{
    name: '日德', category: '贵人' as const, pillar: '日柱',
    description: `日德，性格慈善，福禄丰厚，体貌堂堂`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 天德合（天德之五合/六合 → 查四柱）
function findTianDeHe(bazi: BaziResult): ShenSha[] {
  const monthBranch = bazi.pillars.month.branch
  // 天德 → 合神：天干五合 / 地支六合
  const stemHeMap: Record<string, string> = { '甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊' }
  const branchHeMap: Record<string, string> = { '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午' }
  const tianDeStemMap: Record<string, string> = {
    '寅': '丁', '辰': '壬', '巳': '辛', '未': '甲',
    '申': '癸', '戌': '丙', '亥': '乙', '丑': '庚',
  }
  const tianDeBranchMap: Record<string, string> = {
    '卯': '申', '午': '亥', '酉': '寅', '子': '巳',
  }
  const results: ShenSha[] = []
  // 天德为天干 → 合神为天干
  const tds = tianDeStemMap[monthBranch]
  if (tds) {
    const heStem = stemHeMap[tds]
    if (heStem) {
      matchStem(bazi, [heStem]).forEach((k) => {
        results.push({
          name: '天德合', category: '贵人' as const, pillar: PILLAR_LABEL[k],
          description: `天德合，与天德贵人相合，化煞解厄，福泽绵长`,
          basis: '【通行惯例/《渊海子平》】',
        })
      })
    }
  }
  // 天德为地支 → 合神为地支
  const tdb = tianDeBranchMap[monthBranch]
  if (tdb) {
    const heBranch = branchHeMap[tdb]
    if (heBranch) {
      matchBranch(bazi, [heBranch]).forEach((k) => {
        results.push({
          name: '天德合', category: '贵人' as const, pillar: PILLAR_LABEL[k],
          description: `天德合，与天德贵人相合，化煞解厄，福泽绵长`,
          basis: '【通行惯例/《渊海子平》】',
        })
      })
    }
  }
  return results
}

// 月德合（月德之五合 → 查四柱天干）
function findYueDeHe(bazi: BaziResult): ShenSha[] {
  const monthBranch = bazi.pillars.month.branch
  const yueDeMap: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '亥': '甲', '卯': '甲', '未': '甲',
    '申': '壬', '子': '壬', '辰': '壬',
    '巳': '庚', '酉': '庚', '丑': '庚',
  }
  const stemHeMap: Record<string, string> = { '甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊' }
  const yueDe = yueDeMap[monthBranch]
  if (!yueDe) return []
  const heStem = stemHeMap[yueDe]
  if (!heStem) return []
  return matchStem(bazi, [heStem]).map((k) => ({
    name: '月德合', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `月德合，与月德贵人相合，阴德庇佑，福寿双全`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 天医（月支逆一位 → 查四柱地支）
const TIAN_YI2_MAP: Record<string, string> = {
  '寅': '丑', '卯': '寅', '辰': '卯', '巳': '辰', '午': '巳', '未': '午',
  '申': '未', '酉': '申', '戌': '酉', '亥': '戌', '子': '亥', '丑': '子',
}

function findTianYi2(bazi: BaziResult): ShenSha[] {
  const mb = bazi.pillars.month.branch
  const target = TIAN_YI2_MAP[mb]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '天医', category: '贵人' as const, pillar: PILLAR_LABEL[k],
    description: `天医，主医药缘，身体健康，适合医学、心理学行业`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// ═══════════════════════════════════════════
// 二、凶星
// ═══════════════════════════════════════════

const YANG_REN_MAP: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
  '己': '未', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
}

function findYangRen(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (YANG_REN_MAP[dm]) targets.add(YANG_REN_MAP[dm])
  if (YANG_REN_MAP[ys]) targets.add(YANG_REN_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
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
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (GUA_SU_MAP[yb]) targets.add(GUA_SU_MAP[yb])
  if (GUA_SU_MAP[db]) targets.add(GUA_SU_MAP[db])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
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
  const mb = bazi.pillars.month.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (JIE_SHA_MAP[yb]) targets.add(JIE_SHA_MAP[yb])
  if (JIE_SHA_MAP[mb]) targets.add(JIE_SHA_MAP[mb])
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

// 空亡（以日柱定旬，年/月/时支见旬空地支）
const KONG_WANG_MAP: Record<string, string[]> = {
  '甲子': ['戌','亥'], '乙丑': ['戌','亥'], '丙寅': ['戌','亥'], '丁卯': ['戌','亥'],
  '戊辰': ['戌','亥'], '己巳': ['戌','亥'], '庚午': ['戌','亥'], '辛未': ['戌','亥'],
  '壬申': ['戌','亥'], '癸酉': ['戌','亥'],
  '甲戌': ['申','酉'], '乙亥': ['申','酉'], '丙子': ['申','酉'], '丁丑': ['申','酉'],
  '戊寅': ['申','酉'], '己卯': ['申','酉'], '庚辰': ['申','酉'], '辛巳': ['申','酉'],
  '壬午': ['申','酉'], '癸未': ['申','酉'],
  '甲申': ['午','未'], '乙酉': ['午','未'], '丙戌': ['午','未'], '丁亥': ['午','未'],
  '戊子': ['午','未'], '己丑': ['午','未'], '庚寅': ['午','未'], '辛卯': ['午','未'],
  '壬辰': ['午','未'], '癸巳': ['午','未'],
  '甲午': ['辰','巳'], '乙未': ['辰','巳'], '丙申': ['辰','巳'], '丁酉': ['辰','巳'],
  '戊戌': ['辰','巳'], '己亥': ['辰','巳'], '庚子': ['辰','巳'], '辛丑': ['辰','巳'],
  '壬寅': ['辰','巳'], '癸卯': ['辰','巳'],
  '甲辰': ['寅','卯'], '乙巳': ['寅','卯'], '丙午': ['寅','卯'], '丁未': ['寅','卯'],
  '戊申': ['寅','卯'], '己酉': ['寅','卯'], '庚戌': ['寅','卯'], '辛亥': ['寅','卯'],
  '壬子': ['寅','卯'], '癸丑': ['寅','卯'],
  '甲寅': ['子','丑'], '乙卯': ['子','丑'], '丙辰': ['子','丑'], '丁巳': ['子','丑'],
  '戊午': ['子','丑'], '己未': ['子','丑'], '庚申': ['子','丑'], '辛酉': ['子','丑'],
  '壬戌': ['子','丑'], '癸亥': ['子','丑'],
}

function findKongWang(bazi: BaziResult): ShenSha[] {
  const dayCombo = bazi.dayMaster + bazi.pillars.day.branch
  const targets = KONG_WANG_MAP[dayCombo]
  if (!targets) return []
  // 空亡不出现在日柱本身，只查年/月/时
  const results: ShenSha[] = []
  const br = branchesOf(bazi)
  for (const key of PILLAR_KEYS) {
    if (key === 'day') continue
    if (targets.includes(br[key])) {
      results.push({
        name: '空亡', category: '凶星' as const, pillar: PILLAR_LABEL[key],
        description: `空亡，主虚而不实，吉神逢之减力，凶煞逢之反吉`,
        basis: '【通行惯例/《渊海子平》】',
      })
    }
  }
  return results
}

// 孤辰（按年支查，不出现在年柱）
const GU_CHEN_MAP: Record<string, string> = {
  '亥': '寅', '子': '寅', '丑': '寅',
  '寅': '巳', '卯': '巳', '辰': '巳',
  '巳': '申', '午': '申', '未': '申',
  '申': '亥', '酉': '亥', '戌': '亥',
}

function findGuChen(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (GU_CHEN_MAP[yb]) targets.add(GU_CHEN_MAP[yb])
  if (GU_CHEN_MAP[db]) targets.add(GU_CHEN_MAP[db])
  if (targets.size === 0) return []
  const results: ShenSha[] = []
  const br = branchesOf(bazi)
  for (const key of PILLAR_KEYS) {
    // 孤辰不出现在参照柱本身
    if (key === 'year' && GU_CHEN_MAP[yb] && br[key] === GU_CHEN_MAP[yb]) continue
    if (key === 'day' && GU_CHEN_MAP[db] && br[key] === GU_CHEN_MAP[db]) continue
    if (targets.has(br[key])) {
      results.push({
        name: '孤辰', category: '凶星' as const, pillar: PILLAR_LABEL[key],
        description: `孤辰，主性格独立孤僻，六亲缘薄，宜主动融入群体`,
        basis: '【通行惯例/《渊海子平》】',
      })
    }
  }
  return results
}

// 童子煞【shensha-spec #16】日柱+月支组合表法(民俗流传)
// 查法:月支分组(四季),看日柱干支是否在对应组合表中
const TONG_ZI_MAP: Record<string, string[]> = {
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

const NAYIN_WUXING_MAP: Record<string, string> = {
  '甲子':'金','乙丑':'金','丙寅':'火','丁卯':'火','戊辰':'木','己巳':'木',
  '庚午':'土','辛未':'土','壬申':'金','癸酉':'金','甲戌':'火','乙亥':'火',
  '丙子':'水','丁丑':'水','戊寅':'土','己卯':'土','庚辰':'金','辛巳':'金',
  '壬午':'木','癸未':'木','甲申':'水','乙酉':'水','丙戌':'土','丁亥':'土',
  '戊子':'火','己丑':'火','庚寅':'木','辛卯':'木','壬辰':'水','癸巳':'水',
  '甲午':'金','乙未':'金','丙申':'火','丁酉':'火','戊戌':'木','己亥':'木',
  '庚子':'土','辛丑':'土','壬寅':'金','癸卯':'金','甲辰':'火','乙巳':'火',
  '丙午':'水','丁未':'水','戊申':'土','己酉':'土','庚戌':'金','辛亥':'金',
  '壬子':'木','癸丑':'木','甲寅':'水','乙卯':'水','丙辰':'土','丁巳':'土',
  '戊午':'火','己未':'火','庚申':'木','辛酉':'木','壬戌':'水','癸亥':'水',
}

function getNayinWuxing(yearPillar: string): string {
  return NAYIN_WUXING_MAP[yearPillar] ?? ''
}

function findTongZi(bazi: BaziResult): ShenSha[] {
  const mb = bazi.pillars.month.branch
  const dayCombo = bazi.dayMaster + bazi.pillars.day.branch
  const list = TONG_ZI_MAP[mb]
  if (!list || !list.includes(dayCombo)) return []
  return [{
    name: '童子煞', category: '凶星' as const, pillar: '日柱',
    description: `童子煞，传说为仙界童子下凡，多主婚姻迟滞，宜还愿化解`,
    basis: '【民俗/日柱+月支组合表】',
  }]
}

// 魁罡（日柱固定组合）
const KUI_GANG_SET = new Set(['壬辰','庚戌','戊戌','庚辰'])

function findKuiGang(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!KUI_GANG_SET.has(combo)) return []
  return [{
    name: '魁罡', category: '凶星' as const, pillar: '日柱',
    description: `魁罡，性刚烈果断，聪明正直，不怒而威`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 天罗地网（纳音法 + 年支/日支直查法）
function findTianLuoDiWang(bazi: BaziResult): ShenSha[] {
  const yearCombo = bazi.pillars.year.stem + bazi.pillars.year.branch
  const nayinWx = getNayinWuxing(yearCombo)
  const results: ShenSha[] = []
  const br = branchesOf(bazi)
  const seen = new Set<string>() // dedup by pillar+name

  function add(name: string, pillar: string, desc: string) {
    const key = pillar + '|' + name
    if (!seen.has(key)) {
      seen.add(key)
      results.push({
        name, category: '凶星' as const, pillar: pillar as ShenSha['pillar'],
        description: desc,
        basis: '【通行惯例/《渊海子平》】',
      })
    }
  }

  // 方法一：纳音法
  // 火命见戌亥为天罗
  if (nayinWx === '火') {
    for (const key of PILLAR_KEYS) {
      if (br[key] === '戌' || br[key] === '亥') {
        add('天罗地网', PILLAR_LABEL[key], `天罗地网，运程阻滞，有志难伸`)
      }
    }
  }
  // 水土命见辰巳为地网
  if (nayinWx === '水' || nayinWx === '土') {
    for (const key of PILLAR_KEYS) {
      if (br[key] === '辰' || br[key] === '巳') {
        add('天罗地网', PILLAR_LABEL[key], `天罗地网，运程阻滞，有志难伸`)
      }
    }
  }

  // 方法二：年支、日支直查法（辰巳为地网，戌亥为天罗）
  for (const refKey of ['year', 'day'] as const) {
    const refBranch = br[refKey]
    if (refBranch === '戌' || refBranch === '亥') {
      add('天罗地网', PILLAR_LABEL[refKey], `天罗地网，运程阻滞，有志难伸`)
    } else if (refBranch === '辰' || refBranch === '巳') {
      add('天罗地网', PILLAR_LABEL[refKey], `天罗地网，运程阻滞，有志难伸`)
    }
  }

  return results
}

// 十恶大败（日柱固定组合）
const SHI_E_BAI_SET = new Set([
  '甲辰','乙巳','丙申','丁亥','戊戌','己丑',
  '庚辰','辛巳','壬申','癸亥',
])

function findShiEBai(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!SHI_E_BAI_SET.has(combo)) return []
  return [{
    name: '十恶大败', category: '凶星' as const, pillar: '日柱',
    description: `十恶大败，仓库金银化为尘，一生财物不聚`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 金神（时柱固定组合）
const JIN_SHEN_SET = new Set(['癸酉','己巳','乙丑'])

function findJinShen(bazi: BaziResult): ShenSha[] {
  const hourCombo = bazi.pillars.hour.stem + bazi.pillars.hour.branch
  if (!JIN_SHEN_SET.has(hourCombo)) return []
  return [{
    name: '金神', category: '凶星' as const, pillar: '时柱',
    description: `金神入火乡，富贵天下响。金神为破败之神，需火制方贵`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 亡神（年支/日支/月支 → 三合局临官位）
const WANG_SHEN_MAP: Record<string, string> = {
  '申': '亥', '子': '亥', '辰': '亥',
  '亥': '寅', '卯': '寅', '未': '寅',
  '寅': '巳', '午': '巳', '戌': '巳',
  '巳': '申', '酉': '申', '丑': '申',
}

function findWangShen(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const mb = bazi.pillars.month.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (WANG_SHEN_MAP[yb]) targets.add(WANG_SHEN_MAP[yb])
  if (WANG_SHEN_MAP[mb]) targets.add(WANG_SHEN_MAP[mb])
  if (WANG_SHEN_MAP[db]) targets.add(WANG_SHEN_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '亡神', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `亡神，自内失之，主心性难定、官讼牢狱。吉则足智多谋、处事严谨`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 灾煞（年支/日支/月支 → 冲将星位）
const ZAI_SHA_MAP: Record<string, string> = {
  '申': '午', '子': '午', '辰': '午',
  '亥': '酉', '卯': '酉', '未': '酉',
  '寅': '子', '午': '子', '戌': '子',
  '巳': '卯', '酉': '卯', '丑': '卯',
}

function findZaiSha(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const mb = bazi.pillars.month.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (ZAI_SHA_MAP[yb]) targets.add(ZAI_SHA_MAP[yb])
  if (ZAI_SHA_MAP[mb]) targets.add(ZAI_SHA_MAP[mb])
  if (ZAI_SHA_MAP[db]) targets.add(ZAI_SHA_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '灾煞', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `灾煞，主血光意外、横祸灾厄。身旺有制可化为权柄`,
    basis: '【通行惯例/《三命通会》】',
  }))
}

// 六厄（年支/日支/月支 → 五行死位）
const LIU_E_MAP: Record<string, string> = {
  '申': '卯', '子': '卯', '辰': '卯',
  '亥': '午', '卯': '午', '未': '午',
  '寅': '酉', '午': '酉', '戌': '酉',
  '巳': '子', '酉': '子', '丑': '子',
}

function findLiuE(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const mb = bazi.pillars.month.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (LIU_E_MAP[yb]) targets.add(LIU_E_MAP[yb])
  if (LIU_E_MAP[mb]) targets.add(LIU_E_MAP[mb])
  if (LIU_E_MAP[db]) targets.add(LIU_E_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '六厄', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `六厄，主困顿不顺，做事多阻，宜守不宜攻`,
    basis: '【通行惯例/《三命通会》】',
  }))
}

// 飞刃（年干+日干 → 羊刃 → 对冲）
const FEI_REN_MAP: Record<string, string> = {
  '甲': '酉', '乙': '申', '丙': '子', '丁': '亥', '戊': '子',
  '己': '丑', '庚': '卯', '辛': '寅', '壬': '午', '癸': '巳',
}

function findFeiRen(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (FEI_REN_MAP[dm]) targets.add(FEI_REN_MAP[dm])
  if (FEI_REN_MAP[ys]) targets.add(FEI_REN_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '飞刃', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `飞刃，主突发意外、血光冲突、人际纠纷`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 流霞（日干+年干 → 地支）
const LIU_XIA_MAP: Record<string, string> = {
  '甲': '酉', '乙': '戌', '丙': '未', '丁': '申', '戊': '巳',
  '己': '午', '庚': '辰', '辛': '卯', '壬': '亥', '癸': '寅',
}

function findLiuXia(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (LIU_XIA_MAP[dm]) targets.add(LIU_XIA_MAP[dm])
  if (LIU_XIA_MAP[ys]) targets.add(LIU_XIA_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '流霞', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `流霞，主血光意外、产厄、交通伤害，宜献血化解`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 披麻（年支逆三位 → 查四柱）
const PI_MA_MAP: Record<string, string> = {
  '子': '酉', '丑': '戌', '寅': '亥', '卯': '子', '辰': '丑', '巳': '寅',
  '午': '卯', '未': '辰', '申': '巳', '酉': '午', '戌': '未', '亥': '申',
}

function findPiMa(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const target = PI_MA_MAP[yb]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '披麻', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `披麻，主孝服丧事，六亲缘薄，宜注意家人健康`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 丧门（年支顺二位 → 查四柱）
const SANG_MEN_MAP: Record<string, string> = {
  '子': '寅', '丑': '卯', '寅': '辰', '卯': '巳', '辰': '午', '巳': '未',
  '午': '申', '未': '酉', '申': '戌', '酉': '亥', '戌': '子', '亥': '丑',
}

function findSangMen(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const target = SANG_MEN_MAP[yb]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '丧门', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `丧门，主家门丧事，刑克六亲，宜行善积德化解`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 病符（年支逆一位 → 查四柱）
const BING_FU_MAP: Record<string, string> = {
  '子': '亥', '丑': '子', '寅': '丑', '卯': '寅', '辰': '卯', '巳': '辰',
  '午': '巳', '未': '午', '申': '未', '酉': '申', '戌': '酉', '亥': '戌',
}

function findBingFu(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const target = BING_FU_MAP[yb]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '病符', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `病符，主身体多病，健康欠佳，需注意养生调养`,
    basis: '【通行惯例/《三命通会》】',
  }))
}

// 四废日（季节 + 日柱干支）
const SI_FEI_MAP: Record<string, string[]> = {
  '寅': ['庚申','辛酉'], '卯': ['庚申','辛酉'], '辰': ['庚申','辛酉'],
  '巳': ['壬子','癸亥'], '午': ['壬子','癸亥'], '未': ['壬子','癸亥'],
  '申': ['甲寅','乙卯'], '酉': ['甲寅','乙卯'], '戌': ['甲寅','乙卯'],
  '亥': ['丙午','丁巳'], '子': ['丙午','丁巳'], '丑': ['丙午','丁巳'],
}

function findSiFei(bazi: BaziResult): ShenSha[] {
  const mb = bazi.pillars.month.branch
  const combos = SI_FEI_MAP[mb]
  if (!combos) return []
  const dayCombo = bazi.dayMaster + bazi.pillars.day.branch
  if (!combos.includes(dayCombo)) return []
  return [{
    name: '四废日', category: '凶星' as const, pillar: '日柱',
    description: `四废日，主做事无成，有志难伸，宜顺势守成`,
    basis: '【通行惯例/《渊海子平》】',
  }]
}

// 阴差阳错（日柱固定组合）
const YIN_YANG_CHA_CUO_SET = new Set([
  '丙子','丁丑','戊寅','辛卯','壬辰','癸巳',
  '丙午','丁未','戊申','辛酉','壬戌','癸亥',
])

function findYinYangChaCuo(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!YIN_YANG_CHA_CUO_SET.has(combo)) return []
  return [{
    name: '阴差阳错', category: '凶星' as const, pillar: '日柱',
    description: `阴差阳错，婚姻不和，夫妻缘分薄，家庭冷退`,
    basis: '【通行惯例/《三命通会》】',
  }]
}

// 元辰/大耗（年支 + 性别 → 地支）
const SIX_CLASH: Record<string, string> = {
  '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
  '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳',
}
const BRANCH_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

function findYuanChen(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const gender = bazi.inputInfo.gender
  const clashBranch = SIX_CLASH[yb]
  if (!clashBranch) return []
  const clashIdx = BRANCH_ORDER.indexOf(clashBranch)
  const isYangMaleOrYinFemale =
    (gender === 'male' && ['甲','丙','戊','庚','壬'].includes(bazi.pillars.year.stem)) ||
    (gender === 'female' && ['乙','丁','己','辛','癸'].includes(bazi.pillars.year.stem))
  // 阳男阴女：冲后一位（顺）；阴男阳女：冲前一位（逆）
  const idx = isYangMaleOrYinFemale
    ? (clashIdx + 1) % 12
    : (clashIdx + 11) % 12
  const target = BRANCH_ORDER[idx]
  return matchBranch(bazi, [target]).map((k) => ({
    name: '元辰', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `元辰（大耗），主耗财损物，运势坎坷，宜守不宜攻`,
    basis: '【通行惯例/《三命通会》】',
  }))
}

// 勾绞（年支 + 性别 → 两星）
function findGouJiao(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const ybIdx = BRANCH_ORDER.indexOf(yb)
  const gender = bazi.inputInfo.gender
  const isYangMaleOrYinFemale =
    (gender === 'male' && ['甲','丙','戊','庚','壬'].includes(bazi.pillars.year.stem)) ||
    (gender === 'female' && ['乙','丁','己','辛','癸'].includes(bazi.pillars.year.stem))
  // 阳男阴女：勾=命前三辰(顺)，绞=命后三辰(逆)
  // 阴男阳女：勾=命后三辰(逆)，绞=命前三辰(顺)
  const gouIdx = isYangMaleOrYinFemale
    ? (ybIdx + 3) % 12
    : (ybIdx + 9) % 12
  const jiaoIdx = isYangMaleOrYinFemale
    ? (ybIdx + 9) % 12
    : (ybIdx + 3) % 12
  const gouBranch = BRANCH_ORDER[gouIdx]
  const jiaoBranch = BRANCH_ORDER[jiaoIdx]
  const results: ShenSha[] = []
  matchBranch(bazi, [gouBranch]).forEach((k) => {
    results.push({
      name: '勾绞', category: '凶星' as const, pillar: PILLAR_LABEL[k],
      description: `勾绞（勾），主口舌是非，官司纠缠，人际关系紧张`,
      basis: '【通行惯例/《三命通会》】',
    })
  })
  matchBranch(bazi, [jiaoBranch]).forEach((k) => {
    results.push({
      name: '勾绞', category: '凶星' as const, pillar: PILLAR_LABEL[k],
      description: `勾绞（绞），主口舌是非，官司纠缠，人际关系紧张`,
      basis: '【通行惯例/《三命通会》】',
    })
  })
  return results
}

// 暗金的煞（年支类型 → 地支）
function findAnJin(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  // 四仲（子午卯酉）→ 巳；四孟（寅申巳亥）→ 酉；四季（辰戌丑未）→ 丑
  let target = ''
  if (['子','午','卯','酉'].includes(yb)) target = '巳'
  else if (['寅','申','巳','亥'].includes(yb)) target = '酉'
  else if (['辰','戌','丑','未'].includes(yb)) target = '丑'
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '暗金的煞', category: '凶星' as const, pillar: PILLAR_LABEL[k],
    description: `暗金的煞，主刑狱之灾，杖楚流血，行事需谨慎`,
    basis: '【通行惯例/《三命通会》】',
  }))
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
  const mb = bazi.pillars.month.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (TAO_HUA_MAP[yb]) targets.add(TAO_HUA_MAP[yb])
  if (TAO_HUA_MAP[mb]) targets.add(TAO_HUA_MAP[mb])
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
  // 【shensha-spec #20】年支+日支 → 地支(月支不参与,与规格书一致)
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
  // 【shensha-spec #21】年支+日支 → 地支(月支不参与,与规格书一致)
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
  const mb = bazi.pillars.month.branch
  const db = bazi.pillars.day.branch
  const targets = new Set<string>()
  if (JIANG_XING_MAP[yb]) targets.add(JIANG_XING_MAP[yb])
  if (JIANG_XING_MAP[mb]) targets.add(JIANG_XING_MAP[mb])
  if (JIANG_XING_MAP[db]) targets.add(JIANG_XING_MAP[db])
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '将星', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `将星，主领导才能，有决断力，适合管理岗位`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 天喜（年支 → 红鸾六冲位 → 查四柱地支）
const TIAN_XI_MAP: Record<string, string> = {
  '子': '酉', '丑': '申', '寅': '未', '卯': '午', '辰': '巳', '巳': '辰',
  '午': '卯', '未': '寅', '申': '丑', '酉': '子', '戌': '亥', '亥': '戌',
}

function findTianXi(bazi: BaziResult): ShenSha[] {
  const yb = bazi.pillars.year.branch
  const target = TIAN_XI_MAP[yb]
  if (!target) return []
  return matchBranch(bazi, [target]).map((k) => ({
    name: '天喜', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `天喜，主喜庆之事，婚恋顺利，人缘佳美`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 拱禄（相邻柱位地支相差2位，拱出日主之禄）
function findGongLu(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const luMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
  }
  const targetLu = luMap[dm]
  if (!targetLu) return []
  const results: ShenSha[] = []
  const br = branchesOf(bazi)
  const pairs: Array<[PillarKey, PillarKey]> = [
    ['day', 'hour'], ['month', 'day'], ['year', 'month'],
  ]
  for (const [k1, k2] of pairs) {
    const i1 = BRANCH_ORDER.indexOf(br[k1])
    const i2 = BRANCH_ORDER.indexOf(br[k2])
    // 相邻两位（顺时针差2）
    if ((i2 - i1 + 12) % 12 === 2) {
      const midIdx = (i1 + 1) % 12
      if (BRANCH_ORDER[midIdx] === targetLu) {
        // 拱禄涉及日柱则报在日柱
        const reportPillar: ShenSha['pillar'] =
          (k1 === 'day' || k2 === 'day') ? '日柱' : PILLAR_LABEL[k2]
        results.push({
          name: '拱禄', category: '泛星' as const, pillar: reportPillar,
          description: `拱禄，虚拱禄神，福禄自招，衣食丰足`,
          basis: '【通行惯例/《渊海子平》】',
        })
      }
    }
  }
  return results
}

// 红艳（按日干）
const HONG_YAN_MAP: Record<string, string> = {
  '甲': '午', '乙': '申', '丙': '寅', '丁': '未', '戊': '辰',
  '己': '辰', '庚': '戌', '辛': '酉', '壬': '子', '癸': '申',
}

function findHongYan(bazi: BaziResult): ShenSha[] {
  const dm = bazi.dayMaster
  const ys = bazi.pillars.year.stem
  const targets = new Set<string>()
  if (HONG_YAN_MAP[dm]) targets.add(HONG_YAN_MAP[dm])
  if (HONG_YAN_MAP[ys]) targets.add(HONG_YAN_MAP[ys])
  if (targets.size === 0) return []
  return matchBranch(bazi, [...targets]).map((k) => ({
    name: '红艳', category: '泛星' as const, pillar: PILLAR_LABEL[k],
    description: `红艳，主异性缘佳，情感丰富，需防桃花过旺`,
    basis: '【通行惯例/《渊海子平》】',
  }))
}

// 十灵（按日柱）
const SHI_LING_SET = new Set([
  '甲辰','乙亥','丙辰','丁酉','戊午',
  '庚午','庚戌','辛亥','壬寅','癸未',
  '甲戌',
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

// 六秀日（按日柱）
const LIU_XIU_SET = new Set([
  '丙午','丁未','戊子','戊午','己丑','己未',
])

function findLiuXiu(bazi: BaziResult): ShenSha[] {
  const combo = bazi.dayMaster + bazi.pillars.day.branch
  if (!LIU_XIU_SET.has(combo)) return []
  return [{
    name: '六秀', category: '泛星' as const, pillar: '日柱',
    description: `六秀日，主聪明秀气，才华出众，相貌俊秀`,
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
    ...findTianChu(bazi),
    ...findXueTang(bazi),
    ...findCiGuan(bazi),
    ...findLuShen(bazi),
    ...findTianShe(bazi),
    ...findSanQi(bazi),
    ...findRiDe(bazi),
    ...findTianDeHe(bazi),
    ...findYueDeHe(bazi),
    ...findTianYi2(bazi),
    // 凶星
    ...findYangRen(bazi),
    ...findGuLuan(bazi),
    ...findGuaSu(bazi),
    ...findJieSha(bazi),
    ...findDiaoKe(bazi),
    ...findJiuChou(bazi),
    ...findTongZi(bazi),
    ...findKongWang(bazi),
    ...findGuChen(bazi),
    ...findKuiGang(bazi),
    ...findTianLuoDiWang(bazi),
    ...findShiEBai(bazi),
    ...findJinShen(bazi),
    ...findWangShen(bazi),
    ...findZaiSha(bazi),
    ...findLiuE(bazi),
    ...findFeiRen(bazi),
    ...findLiuXia(bazi),
    ...findPiMa(bazi),
    ...findSangMen(bazi),
    ...findBingFu(bazi),
    ...findYinYangChaCuo(bazi),
    ...findYuanChen(bazi),
    ...findGouJiao(bazi),
    ...findAnJin(bazi),
    ...findSiFei(bazi),
    // 泛星
    ...findTaoHua(bazi),
    ...findYiMa(bazi),
    ...findHuaGai(bazi),
    ...findJiangXing(bazi),
    ...findTianXi(bazi),
    ...findGongLu(bazi),
    ...findHongYan(bazi),
    ...findShiLing(bazi),
    ...findLiuXiu(bazi),
  ]

  // 按柱位排序
  const pillarOrder: Record<string, number> = { '年柱': 0, '月柱': 1, '日柱': 2, '时柱': 3 }
  results.sort((a, b) => pillarOrder[a.pillar] - pillarOrder[b.pillar])
  return results
}
