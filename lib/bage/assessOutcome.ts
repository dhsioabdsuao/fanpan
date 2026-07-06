import type { BaziResult } from '@/types/bazi'
import type { ElementType } from '@/types/bazi'
import type { Outcome, PatternCategory } from './types'
import type { ExtractResult } from './extractPattern'
import { determineStrength } from '@/lib/strength/determineStrength'
import {
  isBranchClash,
  getClashPartner,
  getSixHePartner,
  detectAllHe,
  detectStemCombos,
  getFiveComboPartner,
  getFiveComboTransform,
  getHiddenStemsSpec,
  getStemElement,
  isHuShenTransparent,
  elementToTenGod,
} from './helpers'
import type { FormedHe } from './helpers'
import { getTenGod } from '@/lib/bazi-utils'

// ── 图表上下文：预计算所有需要的信息 ──

interface ChartContext {
  stems: string[]
  branches: string[]
  stemTenGods: string[]        // 年/月/时干十神
  allHiddenStems: string[]     // 所有地支藏干（展开）
  hiddenTenGods: string[]      // 所有藏干十神
  formedHes: FormedHe[]        // 形成的合会局
  stemCombos: { stem1: string; stem2: string; transform: ElementType }[]
  monthBranch: string
  dayMaster: string
  dayMasterElement: ElementType
}

function buildContext(bazi: BaziResult): ChartContext {
  const { pillars, dayMaster, dayMasterElement } = bazi
  const stems = [pillars.year.stem, pillars.month.stem, dayMaster, pillars.hour.stem]
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]

  // 天干十神（年/月/时，不含日主）
  const stemTenGods = [
    getTenGod(dayMaster, pillars.year.stem),
    getTenGod(dayMaster, pillars.month.stem),
    getTenGod(dayMaster, pillars.hour.stem),
  ]

  // 所有藏干及十神
  const allHiddenStems: string[] = []
  const hiddenTenGods: string[] = []
  for (const b of branches) {
    const hs = getHiddenStemsSpec(b)
    for (const s of hs) {
      allHiddenStems.push(s)
      hiddenTenGods.push(getTenGod(dayMaster, s))
    }
  }

  return {
    stems,
    branches,
    stemTenGods,
    allHiddenStems,
    hiddenTenGods,
    formedHes: detectAllHe(branches),
    stemCombos: detectStemCombos(stems),
    monthBranch: pillars.month.branch,
    dayMaster,
    dayMasterElement,
  }
}

// ── 十神存在性检测 ──

/** 指定十神是否在天干中出现（不含日主） */
function hasTenGodInStems(ctx: ChartContext, target: string): boolean {
  return ctx.stemTenGods.includes(target)
}

/** 指定十神是否在任何藏干中出现 */
function hasTenGodInHidden(ctx: ChartContext, target: string): boolean {
  return ctx.hiddenTenGods.includes(target)
}

/** 指定十神是否在命局中存在（天干或藏干） */
function hasTenGodAnywhere(ctx: ChartContext, target: string): boolean {
  return hasTenGodInStems(ctx, target) || hasTenGodInHidden(ctx, target)
}

/** 指定十神是否活跃存在：天干透出 或 地支合会局形成（规格书3.2.7）。藏干单独不算。 */
function hasTenGodActive(ctx: ChartContext, target: string): boolean {
  if (hasTenGodInStems(ctx, target)) return true
  // 合会局形成的五行对应十神
  const cat = tenGodToCategory(target)
  if (cat && hesFormTenGodCategory(ctx, cat)) return true
  return false
}

function tenGodToCategory(tg: string): '官杀' | '食伤' | '财' | '印' | null {
  if (tg === '正官' || tg === '七杀') return '官杀'
  if (tg === '食神' || tg === '伤官') return '食伤'
  if (tg === '正财' || tg === '偏财') return '财'
  if (tg === '正印' || tg === '偏印') return '印'
  return null
}

/** 合会局是否形成特定十神类别（官杀/食伤/财/印）
 *  规格书2.2.2：六合需化神透干才算成立；三合/三会无需此条件。 */
function hesFormTenGodCategory(
  ctx: ChartContext,
  category: '官杀' | '食伤' | '财' | '印',
): boolean {
  for (const he of ctx.formedHes) {
    // 六合：化神必须透干才成立（2.2.2）
    if (he.type === '六合') {
      if (!isHuShenTransparent(he.element, ctx.stems)) continue
    }
    const tgSame = elementToTenGod(he.element, ctx.dayMasterElement, 'same')
    const tgDiff = elementToTenGod(he.element, ctx.dayMasterElement, 'diff')

    if (category === '官杀' && (tgSame === '七杀' || tgDiff === '正官')) return true
    if (category === '食伤' && (tgSame === '食神' || tgDiff === '伤官')) return true
    if (category === '财' && (tgSame === '偏财' || tgDiff === '正财')) return true
    if (category === '印' && (tgSame === '偏印' || tgDiff === '正印')) return true
  }
  return false
}

// ── 救应检测 ──

/** 月支是否被冲（冲支在命局中存在 + 无会合解） */
function isMonthBranchClashed(ctx: ChartContext): boolean {
  const mp = getClashPartner(ctx.monthBranch)
  if (!mp) return false
  if (!ctx.branches.includes(mp)) return false
  return !isClashResolved(ctx)
}

/** 地支是否被冲（冲支在命局中存在）。纯存在性检查。 */
function isBranchClashedInChart(branch: string, ctx: ChartContext): boolean {
  const cp = getClashPartner(branch)
  return cp !== null && ctx.branches.includes(cp)
}

/** 会合解冲：冲支是否被会合牵制。
 *  二次检查：解冲的合/会是否自身被冲散（合神/会局成员被冲）。
 *  【本系统决策】暂不做三次检查（冲散之冲再被合解），直接判解冲失效。 */
function isClashResolved(ctx: ChartContext): boolean {
  const clashPartner = getClashPartner(ctx.monthBranch)
  if (!clashPartner) return false
  if (!ctx.branches.includes(clashPartner)) return false

  // 冲支被六合牵制？
  const hePartner = getSixHePartner(clashPartner)
  if (hePartner && ctx.branches.includes(hePartner)) {
    // 二次检查：六合 pair 中 hePartner 是否被其冲支冲散
    // （clashPartner 的冲支就是 monthBranch，是原冲，不重复计入）
    const hepClash = getClashPartner(hePartner)
    if (!hepClash || !ctx.branches.includes(hepClash)) {
      return true
    }
    // hePartner 被冲散，六合失效，继续检查三合/三会
  }

  // 冲支参与三合/三会？
  for (const he of ctx.formedHes) {
    if (he.members.includes(clashPartner)) {
      // 二次检查：三合/三会中除 clashPartner 外的成员是否被冲
      const otherMembers = he.members.filter((m) => m !== clashPartner)
      const anyClashed = otherMembers.some((m) => isBranchClashedInChart(m, ctx))
      if (!anyClashed) return true
    }
  }

  return false
}

/** 印制伤：有印制伏伤官且印未被财克、未被合去。
 *  二次检查A：印是否被财克（财透干或成局）。
 *  二次检查B：印自身是否被五合合去。
 *  【本系统决策】暂不做三次检查（比劫制财护印），直接判印救失效。 */
function hasYinZhiShang(ctx: ChartContext): boolean {
  const hasYin = hasTenGodActive(ctx, '正印') || hasTenGodActive(ctx, '偏印')
  if (!hasYin) return false

  // 二次检查A：印未被财克
  const hasCaiKeYin =
    hasTenGodInStems(ctx, '正财') || hasTenGodInStems(ctx, '偏财') ||
    hesFormTenGodCategory(ctx, '财')
  if (hasCaiKeYin) return false

  // 二次检查B：印自身未被五合合去（印干被合 → 不制伤）
  const yinStems: string[] = []
  if (ctx.stemTenGods[0] === '正印' || ctx.stemTenGods[0] === '偏印') yinStems.push(ctx.stems[0])
  if (ctx.stemTenGods[1] === '正印' || ctx.stemTenGods[1] === '偏印') yinStems.push(ctx.stems[1])
  if (ctx.stemTenGods[2] === '正印' || ctx.stemTenGods[2] === '偏印') yinStems.push(ctx.stems[3])
  for (const ys of yinStems) {
    const p = getFiveComboPartner(ys)
    if (p && ctx.stems.includes(p)) return false // 印被合去，护官失效
  }

  return true
}

/** 财通关：伤官见官时有财通关（伤生财、财生官）。
 *  二次检查：财是否被比劫夺（比劫透干或成局克制财星）。
 *  【本系统决策】暂不做三次检查（官杀制比劫护财），比劫夺财直接判财通关失效。 */
function hasCaiTongGuan(ctx: ChartContext): boolean {
  const hasCai = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  if (!hasCai) return false
  // 二次检查：财是否被比劫夺（透干）
  if (hasTenGodInStems(ctx, '比肩') || hasTenGodInStems(ctx, '劫财')) return false
  // 二次检查：合会成比劫局
  for (const he of ctx.formedHes) {
    if (he.type === '六合' && !isHuShenTransparent(he.element, ctx.stems)) continue
    const tgSame = elementToTenGod(he.element, ctx.dayMasterElement, 'same')
    if (tgSame === '比肩' || tgSame === '劫财') return false
  }
  return true
}

/** 食神制杀：食神透干克杀。
 *  二次检查：食神是否被偏印（枭神）夺。
 *  【本系统决策】暂不做三次检查（财制枭护食），枭夺食直接判食制失效。 */
function hasShiZhiSha(ctx: ChartContext): boolean {
  if (!hasTenGodInStems(ctx, '食神')) return false
  // 二次检查：食神是否被偏印夺（枭神夺食）
  if (hasTenGodActive(ctx, '偏印')) return false
  return true
}

/** 印星化杀：有印（天干透出或合会成印局）化杀。藏干内单独的印不算。
 *  二次检查：印是否被财破（财透干或成局克印），逻辑与 hasYinZhiShang 一致。
 *  【本系统决策】暂不做三次检查（比劫制财护印），财破印直接判印化失效。 */
function hasYinHuaSha(ctx: ChartContext): boolean {
  const hasYin = hasTenGodInStems(ctx, '正印') || hasTenGodInStems(ctx, '偏印') ||
                 hesFormTenGodCategory(ctx, '印')
  if (!hasYin) return false
  // 二次检查：印是否被财破
  const hasCai = hasTenGodInStems(ctx, '正财') || hasTenGodInStems(ctx, '偏财') ||
                 hesFormTenGodCategory(ctx, '财')
  if (hasCai) return false
  return true
}

/** 合去忌神：指定的干是否被五合。
 *  二次检查：争合——同干多现争合神，合不牢。
 *  【本系统决策】争合暂不判破格，留给以后细化。 */
function isStemComboed(stem: string, ctx: ChartContext): boolean {
  const partner = getFiveComboPartner(stem)
  if (!partner) return false
  if (!ctx.stems.includes(partner)) return false
  // 二次检查：争合检测（多干争一合神，合不牢）
  // 暂不改变结果，留检测点供后续细化
  return true
}

// 天干阴阳
const GAN_YIN_YANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳',
  己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴',
}

// ── 逐格成败判定 ──

function assessZhengGuan(ctx: ChartContext, _extract: ExtractResult): { outcome: Outcome; reason: string } {
  const reasons: string[] = []
  let success = false

  // 成格条件：有财生官 OR 有印护官
  const hasCai = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  const hasYin = hasTenGodActive(ctx, '正印') || hasTenGodActive(ctx, '偏印')

  if (hasCai) {
    success = true
    reasons.push('有财生官')
  }
  if (hasYin) {
    success = true
    reasons.push('有印护官')
  }

  // 破格条件检查
  const failures: string[] = []

  // ① 伤官见官
  const hasShangGuan = hasTenGodInStems(ctx, '伤官')
  const hasZhengGuanInStems = hasTenGodInStems(ctx, '正官')
  if (hasShangGuan && hasZhengGuanInStems) {
    const yinRescue = hasYinZhiShang(ctx)
    const caiRescue = hasCaiTongGuan(ctx)
    if (!yinRescue && !caiRescue) {
      failures.push('伤官见官,无印制伤、无财通关')
    } else {
      reasons.push(yinRescue ? '印制伤解伤官见官' : '财通关解伤官见官')
    }
  }

  // ② 正官被冲
  if (isMonthBranchClashed(ctx)) {
    failures.push('正官(月支)被冲,无会合解')
  }

  // ③ 正官被合去
  if (_extract.patternStem && isStemComboed(_extract.patternStem, ctx)) {
    failures.push('正官被合去')
  }

  // ④ 官杀混杂（七杀混局）无制化
  if (hasTenGodActive(ctx, '七杀')) {
    const controlled = hasShiZhiSha(ctx) || hasYinHuaSha(ctx) || isStemComboed(
      ctx.stems.find((s) => getTenGod(ctx.dayMaster, s) === '七杀') ?? '', ctx)
    if (!controlled) {
      failures.push('官杀混杂(七杀混局)无制化')
    }
  }

  if (failures.length > 0) {
    return { outcome: '破格', reason: failures.join('; ') }
  }
  if (success) {
    return { outcome: '成格', reason: reasons.join('; ') }
  }
  return { outcome: '不成格', reason: '财印俱无、孤官无辅' }
}

function assessQiSha(ctx: ChartContext, _extract: ExtractResult): { outcome: Outcome; reason: string } {
  const reasons: string[] = []
  let success = false

  // 成格条件：食神制杀 OR 印星化杀
  const shiZhi = hasShiZhiSha(ctx)
  const yinHua = hasYinHuaSha(ctx)

  if (shiZhi) {
    success = true
    reasons.push('食神制杀')
  }
  if (yinHua) {
    success = true
    reasons.push('印星化杀')
  }

  // 破格条件检查
  const failures: string[] = []

  // ① 财生杀党杀无制化
  const hasCai = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  const hasSha = hasTenGodActive(ctx, '七杀')
  if (hasCai && hasSha && !shiZhi && !yinHua) {
    failures.push('财生杀党杀无制化')
  }

  // ② 地支三合/三会成官杀局，无制化（论势不论星，规格书3.2.9+4.2②）
  if (hesFormTenGodCategory(ctx, '官杀') && !shiZhi && !yinHua) {
    // 还要检查合绊制约
    const shaStems = ctx.stems.filter((s) => {
      const tg = getTenGod(ctx.dayMaster, s)
      return tg === '七杀' || tg === '正官'
    })
    const anyComboed = shaStems.some((s) => isStemComboed(s, ctx))
    if (!anyComboed) {
      failures.push('地支合会成官杀局,杀势极旺无制化(凶神成局必患)')
    }
  }

  // ③ 官杀混杂无制化：天干层面，正官与七杀同时透出（规格书4.2③：仅论天干并透之星）
  if (hasTenGodInStems(ctx, '正官') && hasTenGodInStems(ctx, '七杀') && !shiZhi && !yinHua) {
    failures.push('官杀混杂无制化')
  }

  // ④ 七杀被冲
  if (isMonthBranchClashed(ctx)) {
    failures.push('七杀(月支)被冲,无会合解')
  }

  if (failures.length > 0) {
    return { outcome: '破格', reason: failures.join('; ') }
  }
  if (success) {
    return { outcome: '成格', reason: reasons.join('; ') }
  }
  return { outcome: '不成格', reason: '无食制无印化,未被财党杀、未会成官杀局、未被冲' }
}

function assessCai(ctx: ChartContext, _extract: ExtractResult): { outcome: Outcome; reason: string } {
  const reasons: string[] = []
  let success = false

  // 成格条件：财生官 OR 食伤生财
  const hasGuan = hasTenGodActive(ctx, '正官')
  const hasShiShang = hasTenGodActive(ctx, '食神') || hasTenGodActive(ctx, '伤官')

  if (hasGuan) {
    success = true
    reasons.push('财生官(官护财)')
  }
  if (hasShiShang) {
    success = true
    reasons.push('食伤生财(财有源)')
  }

  // 破格条件
  const failures: string[] = []

  // ① 比劫夺财（无食伤通关、无官杀制比劫）
  const hasBiJie = hasTenGodActive(ctx, '比肩') || hasTenGodActive(ctx, '劫财')
  if (hasBiJie && !hasShiShang && !hasGuan && !hasTenGodActive(ctx, '七杀')) {
    failures.push('比劫夺财,无食伤通关、无官杀制比劫')
  }

  // ② 财透七杀党杀（无制化）
  const hasCaiStem = hasTenGodInStems(ctx, '正财') || hasTenGodInStems(ctx, '偏财')
  const hasSha = hasTenGodActive(ctx, '七杀')
  if (hasCaiStem && hasSha && !hasShiZhiSha(ctx) && !hasYinHuaSha(ctx)) {
    failures.push('财透七杀党杀,无制化')
  }

  // ③ 财被冲
  if (isMonthBranchClashed(ctx)) {
    failures.push('财(月支)被冲')
  }

  if (failures.length > 0) {
    return { outcome: '破格', reason: failures.join('; ') }
  }
  if (success) {
    return { outcome: '成格', reason: reasons.join('; ') }
  }
  return { outcome: '不成格', reason: '财孤(无食伤生、无官护),未被比劫夺尽' }
}

function assessYin(ctx: ChartContext, _extract: ExtractResult): { outcome: Outcome; reason: string } {
  const reasons: string[] = []
  let success = false

  // 成格条件：官杀生印 OR 印旺用食伤泄秀
  const hasGuanSha = hasTenGodActive(ctx, '正官') || hasTenGodActive(ctx, '七杀')
  const hasShiShang = hasTenGodActive(ctx, '食神') || hasTenGodActive(ctx, '伤官')

  if (hasGuanSha) {
    success = true
    reasons.push('官杀生印')
  }
  if (hasShiShang) {
    success = true
    reasons.push('印旺用食伤泄秀')
  }

  // 破格条件
  const failures: string[] = []

  // ① 财破印（贪财坏印，无比劫制财、无官杀通关）
  const hasCai = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  if (hasCai) {
    const hasBiJie = hasTenGodActive(ctx, '比肩') || hasTenGodActive(ctx, '劫财')
    const hasGuanShaCtl = hasGuanSha
    if (!hasBiJie && !hasGuanShaCtl) {
      failures.push('财破印(贪财坏印),无比劫制财、无官杀通关')
    }
  }

  // ② 印被冲
  if (isMonthBranchClashed(ctx)) {
    failures.push('印(月支)被冲')
  }

  if (failures.length > 0) {
    return { outcome: '破格', reason: failures.join('; ') }
  }
  if (success) {
    return { outcome: '成格', reason: reasons.join('; ') }
  }
  return { outcome: '不成格', reason: '印孤(无官杀生),未被财破' }
}

function assessShiShen(ctx: ChartContext, _extract: ExtractResult): { outcome: Outcome; reason: string } {
  const reasons: string[] = []
  let success = false

  // 成格条件：食神生财（吐秀生财）—— 规格书：只实现食神生财，不实现食神制杀
  const hasCai = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  if (hasCai) {
    success = true
    reasons.push('食神生财(吐秀生财)')
  }

  // 破格条件
  const failures: string[] = []

  // ① 枭神夺食（偏印克食，无财制枭）
  const hasPianYin = hasTenGodActive(ctx, '偏印')
  const hasCaiActive2 = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  if (hasPianYin && !hasCaiActive2) {
    failures.push('枭神夺食(偏印克食),无财制枭')
  }

  // ② 食神被冲
  if (isMonthBranchClashed(ctx)) {
    failures.push('食神(月支)被冲')
  }

  if (failures.length > 0) {
    return { outcome: '破格', reason: failures.join('; ') }
  }
  if (success) {
    return { outcome: '成格', reason: reasons.join('; ') }
  }
  return { outcome: '不成格', reason: '食神孤(不生财、未被枭夺)' }
}

function assessShangGuan(ctx: ChartContext, _extract: ExtractResult): { outcome: Outcome; reason: string } {
  const reasons: string[] = []
  let success = false

  // 成格条件：伤官生财 OR 伤官佩印 OR 伤官带杀无财
  const hasCai = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  const hasYin = hasTenGodActive(ctx, '正印') || hasTenGodActive(ctx, '偏印')
  const hasSha = hasTenGodActive(ctx, '七杀')
  const hasShi = hasTenGodActive(ctx, '食神')

  if (hasCai) {
    success = true
    reasons.push('伤官生财')
  }

  // 伤官佩印：印在干支出现 且 印未被财破
  // "印未被财破"：财必须活跃（透干或合会成局）才算能破印；藏干内单独的财不算
  const hasCaiActive = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
  if (hasYin) {
    const yinBroken = hasCaiActive && !hasTenGodActive(ctx, '比肩') && !hasTenGodActive(ctx, '劫财')
    if (!yinBroken) {
      success = true
      reasons.push('伤官佩印')
    }
  }

  // 伤官带杀无财：七杀透干 且 无食制、无印化、无合绊
  const hasShaStem = hasTenGodInStems(ctx, '七杀')
  if (hasShaStem && !hasShi && !hasYin) {
    // 检查七杀是否被合绊
    const shaStems = ctx.stems.filter((s) => getTenGod(ctx.dayMaster, s) === '七杀')
    const shaComboed = shaStems.some((s) => isStemComboed(s, ctx))
    if (!shaComboed && !hasCaiActive) {
      success = true
      reasons.push('伤官带杀无财')
    }
  }

  // 破格条件
  const failures: string[] = []

  // ① 伤官见官（无印制伤、无财通关）
  if (hasTenGodInStems(ctx, '伤官') && hasTenGodInStems(ctx, '正官')) {
    if (!hasYinZhiShang(ctx) && !hasCaiTongGuan(ctx)) {
      failures.push('伤官见官,无印制伤、无财通关')
    } else {
      reasons.push(hasYinZhiShang(ctx) ? '印制伤解伤官见官' : '财通关解伤官见官')
    }
  }

  // ② 伤官被合去
  if (_extract.patternStem && isStemComboed(_extract.patternStem, ctx)) {
    failures.push('伤官被合去')
  }

  // ③ 伤官被冲
  if (isMonthBranchClashed(ctx)) {
    failures.push('伤官(月支)被冲')
  }

  if (failures.length > 0) {
    return { outcome: '破格', reason: failures.join('; ') }
  }
  if (success) {
    return { outcome: '成格', reason: reasons.join('; ') }
  }
  return { outcome: '不成格', reason: '伤官孤(不生财、无印佩、无杀配),未见官破' }
}

function assessLuJie(ctx: ChartContext, extract: ExtractResult): { outcome: Outcome; reason: string } {
  // 建禄月劫格：格名已定，成败看天干所透用神，套对应格规则
  if (!extract.luJieYongShenTenGod) {
    return { outcome: '不成格', reason: '天干无财官杀食可取(纯比劫印)' }
  }

  const yongShenTenGod = extract.luJieYongShenTenGod

  // 根据用神十神套对应格的成败规则
  if (yongShenTenGod === '正官') {
    // 透官套官格
    const hasCai = hasTenGodActive(ctx, '正财') || hasTenGodActive(ctx, '偏财')
    const hasYin = hasTenGodActive(ctx, '正印') || hasTenGodActive(ctx, '偏印')
    if (hasCai || hasYin) {
      return { outcome: '成格', reason: `用神${yongShenTenGod},透官逢${hasCai ? '财' : ''}${hasCai && hasYin ? '/' : ''}${hasYin ? '印' : ''}` }
    }
    return { outcome: '不成格', reason: `用神${yongShenTenGod},财印俱无` }
  }

  if (yongShenTenGod === '七杀') {
    // 透杀套七杀格：需要制伏
    const shiZhi = hasShiZhiSha(ctx)
    const yinHua = hasYinHuaSha(ctx)

    // 合绊算制约 (3.2.5)
    const shaStems = ctx.stems.filter((s) => getTenGod(ctx.dayMaster, s) === '七杀')
    const shaComboed = shaStems.some((s) => isStemComboed(s, ctx))

    if (shiZhi) {
      return { outcome: '成格', reason: `用神${yongShenTenGod},透杀遇食神制伏` }
    }
    // 合绊算制约 (3.2.5)，层次受损
    if (shaComboed) {
      const parts = [`用神${yongShenTenGod},透杀被合绊制约(层次受损)`]
      if (yinHua) parts.push('兼有印化')
      return { outcome: '成格', reason: parts.join('; ') }
    }
    if (yinHua) {
      return { outcome: '成格', reason: `用神${yongShenTenGod},透杀遇印星化杀` }
    }

    return { outcome: '破格', reason: '透杀无制(无食制、无印化、无合绊)' }
  }

  if (yongShenTenGod === '正财' || yongShenTenGod === '偏财') {
    // 透财套财格：需要食伤生财（转劫生财）
    const hasShiShang = hasTenGodActive(ctx, '食神') || hasTenGodActive(ctx, '伤官')
    if (hasShiShang) {
      return { outcome: '成格', reason: `用神${yongShenTenGod},透财逢食伤(转劫生财)` }
    }
    // 比劫夺财？
    const hasBiJie = hasTenGodActive(ctx, '比肩') || hasTenGodActive(ctx, '劫财')
    // 日主就是比劫之一（建禄月劫本身比劫当令），所以比劫重
    if (!hasShiShang && hasBiJie) {
      return { outcome: '破格', reason: '透财被比劫夺尽' }
    }
    return { outcome: '不成格', reason: `用神${yongShenTenGod},配套不全` }
  }

  if (yongShenTenGod === '食神' || yongShenTenGod === '伤官') {
    // 透食伤泄秀
    return { outcome: '成格', reason: `用神${yongShenTenGod},透食伤泄秀(无财官时,秀气)` }
  }

  return { outcome: '不成格', reason: `用神${yongShenTenGod},配套不全` }
}

function assessYangRen(ctx: ChartContext, _extract: ExtractResult): { outcome: Outcome; reason: string } {
  // 阳刃格：用官杀制刃
  const hasGuan = hasTenGodActive(ctx, '正官')
  const hasSha = hasTenGodActive(ctx, '七杀')
  const hasShangGuan = hasTenGodInStems(ctx, '伤官')
  const hasYin = hasTenGodActive(ctx, '正印') || hasTenGodActive(ctx, '偏印')

  if (!hasGuan && !hasSha) {
    return { outcome: '破格', reason: '阳刃无官煞制(刃失制→破格)' }
  }

  // 官煞制刃但见伤官 → 破格（无救）
  if (hasShangGuan) {
    const yinRescue = hasYinZhiShang(ctx)
    const caiRescue = hasCaiTongGuan(ctx)
    if (!yinRescue && !caiRescue) {
      return { outcome: '破格', reason: '官煞制刃但见伤官,无印制伤、无财通关' }
    }
  }

  // 制刃的官煞被冲？检查月支
  if (isMonthBranchClashed(ctx)) {
    return { outcome: '破格', reason: '制刃的官煞(月支)被冲,无会合解' }
  }

  const reasons = ['透官煞制刃']
  if (!hasShangGuan) reasons.push('不见伤官')
  if (hasYin) reasons.push('有财印相随')

  return { outcome: '成格', reason: reasons.join('; ') }
}

// ── 主入口 ──

export function assessOutcome(
  bazi: BaziResult,
  extract: ExtractResult,
): { outcome: Outcome; reason: string } {
  const ctx = buildContext(bazi)

  switch (extract.category) {
    case '官格':
      return assessZhengGuan(ctx, extract)
    case '杀格': {
      const result = assessQiSha(ctx, extract)
      // 七杀格食神制杀成格 → 加身强层次标注（非成格门槛，规格书4.2补充）
      if (result.outcome === '成格' && result.reason.includes('食神制杀')) {
        const str = determineStrength(bazi)
        const layer = str.level === '身强'
          ? '身强担杀,层次较高'
          : '日主非身强,食制成立但层次受损'
        result.reason = result.reason + '; ' + layer
      }
      return result
    }
    case '财格':
      return assessCai(ctx, extract)
    case '印格':
      return assessYin(ctx, extract)
    case '食神格':
      return assessShiShen(ctx, extract)
    case '伤官格':
      return assessShangGuan(ctx, extract)
    case '建禄月劫格':
      return assessLuJie(ctx, extract)
    case '阳刃格':
      return assessYangRen(ctx, extract)
    default:
      return { outcome: '不成格', reason: '未知格局类型' }
  }
}
