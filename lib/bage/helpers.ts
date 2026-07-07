import type { ElementType, BaziResult } from '@/types/bazi'
import { getStemElement } from '@/lib/bazi-utils'
import { getTenGod } from '@/lib/bazi-utils'

// ── 规格书 1.3 藏干表 ──
const SPEC_HIDDEN_STEMS: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

export function getHiddenStemsSpec(branch: string): string[] {
  return [...(SPEC_HIDDEN_STEMS[branch] ?? [])]
}

// ── 规格书 1.4 禄位刃位表 ──
const LU_POSITIONS: Record<string, string> = {
  甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳',
  己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子',
}

const REN_POSITIONS: Record<string, string> = {
  甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子',
}

export function getLu(dayMaster: string): string {
  return LU_POSITIONS[dayMaster] ?? ''
}

export function isYangRen(branch: string, dayMaster: string): boolean {
  return REN_POSITIONS[dayMaster] === branch
}

// ── 规格书 2.1.1 地支六冲 ──
const SIX_CLASHES: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

export function isBranchClash(a: string, b: string): boolean {
  return SIX_CLASHES.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  )
}

export function getClashPartner(branch: string): string | null {
  for (const [x, y] of SIX_CLASHES) {
    if (x === branch) return y
    if (y === branch) return x
  }
  return null
}

// ── 规格书 2.1.2 地支六合 ──
const SIX_HE: [string, string, ElementType][] = [
  ['子', '丑', '土'],
  ['寅', '亥', '木'],
  ['卯', '戌', '火'],
  ['辰', '酉', '金'],
  ['巳', '申', '水'],
  ['午', '未', '土'],
]

export function getSixHePartner(branch: string): string | null {
  for (const [x, y] of SIX_HE) {
    if (x === branch) return y
    if (y === branch) return x
  }
  return null
}

export function getSixHeTransform(a: string, b: string): ElementType | null {
  for (const [x, y, el] of SIX_HE) {
    if ((x === a && y === b) || (x === b && y === a)) return el
  }
  return null
}

// ── 规格书 2.1.3 地支三合 ──
const SAN_HE: [string[], ElementType][] = [
  [['申', '子', '辰'], '水'],
  [['亥', '卯', '未'], '木'],
  [['寅', '午', '戌'], '火'],
  [['巳', '酉', '丑'], '金'],
]

export function getSanHeGroup(branch: string): string[] | null {
  for (const [members] of SAN_HE) {
    if (members.includes(branch)) return [...members]
  }
  return null
}

// ── 规格书 2.1.4 地支三会 ──
const SAN_HUI: [string[], ElementType][] = [
  [['寅', '卯', '辰'], '木'],
  [['巳', '午', '未'], '火'],
  [['申', '酉', '戌'], '金'],
  [['亥', '子', '丑'], '水'],
]

export function getSanHuiGroup(branch: string): string[] | null {
  for (const [members] of SAN_HUI) {
    if (members.includes(branch)) return [...members]
  }
  return null
}

// ── 规格书 2.1.5 天干五合 ──
const FIVE_COMBO: [string, string, ElementType][] = [
  ['甲', '己', '土'],
  ['乙', '庚', '金'],
  ['丙', '辛', '水'],
  ['丁', '壬', '木'],
  ['戊', '癸', '火'],
]

export function getFiveComboPartner(stem: string): string | null {
  for (const [x, y] of FIVE_COMBO) {
    if (x === stem) return y
    if (y === stem) return x
  }
  return null
}

export function getFiveComboTransform(a: string, b: string): ElementType | null {
  for (const [x, y, el] of FIVE_COMBO) {
    if ((x === a && y === b) || (x === b && y === a)) return el
  }
  return null
}

// ── 地支合会局检测 (规格书 3.2.7) ──

export interface FormedHe {
  type: '三合' | '三会' | '六合'
  element: ElementType
  members: string[]
}

/** 检测四柱地支中形成的所有合会局 */
export function detectAllHe(branches: string[]): FormedHe[] {
  const result: FormedHe[] = []
  const unique = new Set(branches)

  // 三会
  for (const [members, element] of SAN_HUI) {
    if (members.every((m) => unique.has(m))) {
      result.push({ type: '三会', element, members: [...members] })
    }
  }

  // 三合
  for (const [members, element] of SAN_HE) {
    if (members.every((m) => unique.has(m))) {
      result.push({ type: '三合', element, members: [...members] })
    }
  }

  // 六合
  for (const [a, b, element] of SIX_HE) {
    if (unique.has(a) && unique.has(b)) {
      result.push({ type: '六合', element, members: [a, b] })
    }
  }

  return result
}

// ── 取格用：月支是否参与三合/三会成局 (B.2) ──

export function monthBranchFormsHe(
  monthBranch: string,
  allBranches: string[],
): { element: ElementType; type: '三合' | '三会' } | null {
  const unique = new Set(allBranches)

  // 完整三会
  const huiGroup = getSanHuiGroup(monthBranch)
  if (huiGroup && huiGroup.every((m) => unique.has(m))) {
    for (const [members, element] of SAN_HUI) {
      if (members[0] === huiGroup[0]) return { element, type: '三会' }
    }
  }

  // 完整三合
  const heGroup = getSanHeGroup(monthBranch)
  if (heGroup && heGroup.every((m) => unique.has(m))) {
    for (const [members, element] of SAN_HE) {
      if (members[0] === heGroup[0]) return { element, type: '三合' }
    }
  }

  // 半合不参与取格（规格书 2.1.3 + B.2）
  return null
}

// ── 天干五合检测 ──

export function detectStemCombos(stems: string[]): { stem1: string; stem2: string; transform: ElementType }[] {
  const result: { stem1: string; stem2: string; transform: ElementType }[] = []
  for (const [a, b, el] of FIVE_COMBO) {
    if (stems.includes(a) && stems.includes(b)) {
      result.push({ stem1: a, stem2: b, transform: el })
    }
  }
  return result
}

// ── 化神是否在天干透出 (2.2.2) ──

export function isHuShenTransparent(element: ElementType, stems: string[]): boolean {
  return stems.some((s) => getStemElement(s) === element)
}

// ── 五行 → 十神映射 (用于会支取格 B.2) ──

/** 根据“会成五行”和“日主五行”以及阴阳，返回十神名称 */
export function elementToTenGod(
  element: ElementType,
  dayMasterElement: ElementType,
  yinYang: 'same' | 'diff',
): string {
  const EL_ORDER = ['木', '火', '土', '金', '水'] as const
  const dmIdx = EL_ORDER.indexOf(dayMasterElement as typeof EL_ORDER[number])
  const elIdx = EL_ORDER.indexOf(element)
  const diff = (elIdx - dmIdx + 5) % 5

  if (diff === 0) return yinYang === 'same' ? '比肩' : '劫财'
  if (diff === 1) return yinYang === 'same' ? '食神' : '伤官'
  if (diff === 2) return yinYang === 'same' ? '偏财' : '正财'
  if (diff === 3) return yinYang === 'same' ? '七杀' : '正官'
  return yinYang === 'same' ? '偏印' : '正印'
}

export { getStemElement }

// ── 十二长生：长生/帝旺位置（定性判断有根无根用）──

const CHANG_SHENG: Record<string, string> = {
  甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅',
  己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯',
}

const WANG_POSITIONS: Record<string, string> = {
  甲: '卯', 乙: '寅', 丙: '午', 丁: '巳', 戊: '午',
  己: '巳', 庚: '酉', 辛: '申', 壬: '子', 癸: '亥',
}

/** 天干在地支是否有强根（长生/禄/帝旺） */
function stemHasStrongRoot(stem: string, branches: string[]): boolean {
  const lu = getLu(stem)
  const changSheng = CHANG_SHENG[stem]
  const wang = WANG_POSITIONS[stem]
  return branches.includes(lu) || branches.includes(changSheng) || branches.includes(wang)
}

// ── 伤官/印强弱判断 ──

/** 伤官是否"旺"：伤官透干，且在地支有强根，或地支三会/三合成伤官局 */
export function isShangGuanStrong(bazi: BaziResult): boolean {
  const { dayMaster, pillars } = bazi
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]

  const shangGuanStem = touStems.find((s) => getTenGod(dayMaster, s) === '伤官')
  if (!shangGuanStem) return false

  // 透干的伤官是否有强根
  if (stemHasStrongRoot(shangGuanStem, branches)) return true

  // 地支是否三会/三合成伤官所属五行局
  const sgElement = getStemElement(shangGuanStem)
  const allHe = detectAllHe(branches)
  return allHe.some((h) => h.element === sgElement && (h.type === '三会' || h.type === '三合'))
}

/** 印是否有根：印星透干，且在地支有强根（长生/禄/帝旺） */
export function isYinYouGen(bazi: BaziResult): boolean {
  const { dayMaster, pillars } = bazi
  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]

  const yinStem = touStems.find((s) => {
    const tg = getTenGod(dayMaster, s)
    return tg === '正印' || tg === '偏印'
  })
  if (!yinStem) return false

  return stemHasStrongRoot(yinStem, branches)
}

// ── 调候判断 ──

/** 化刃为印：戊土日主 + 午月 + 天干透丙丁 + 地支会火局（巳午未/寅午戌）*/
export function isHuaRenWeiYin(bazi: BaziResult): boolean {
  const { dayMaster, pillars } = bazi

  if (dayMaster !== '戊') return false
  if (pillars.month.branch !== '午') return false

  const touStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem]
  if (!touStems.some((s) => s === '丙' || s === '丁')) return false

  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const unique = new Set(branches)
  const sanHui = ['巳', '午', '未'].every((b) => unique.has(b))
  const sanHe = ['寅', '午', '戌'].every((b) => unique.has(b))
  return sanHui || sanHe
}

/** 金水伤官喜见官：金日主生于亥子丑月，全局金寒水冷，见官星火反而喜 */
export function isJinShuiShangGuan(bazi: BaziResult): boolean {
  const { dayMasterElement, pillars, dayMaster } = bazi

  // 1. 日主为庚金或辛金
  if (dayMasterElement !== '金') return false

  // 2. 月令为亥、子、丑月（冬季水旺）
  const monthBranch = pillars.month.branch
  if (!['亥', '子', '丑'].includes(monthBranch)) return false

  // 3. 火土衰弱：地支无巳午火（无强根），天干火为官星可暖局
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const hasFireBranch = branches.some((b) => b === '巳' || b === '午')
  if (hasFireBranch) return false

  return true
}
