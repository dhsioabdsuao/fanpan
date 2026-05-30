import type { BaziResult } from '@/types/bazi'
import type { BageResult } from './types'
import { getTenGod, getStemElement } from '@/lib/bazi-utils'
import { getMonthHiddenStems, buildStemPool } from './helpers'

// ── 展示用字段 ──

export interface BageDisplay {
  patternName: string
  outcomeType: string
  patternReason: string
  outcomeReason: string
}

function pillarCn(p: 'year' | 'month' | 'hour'): string {
  return { year: '年', month: '月', hour: '时' }[p]
}

// ── 主入口 ──

export function buildPatternExplanation(bazi: BaziResult, bage: BageResult): BageDisplay {
  const monthBranch = bazi.pillars.month.branch
  const dayMaster = bazi.dayMaster
  const hiddenStems = getMonthHiddenStems(monthBranch)
  const pool = buildStemPool(bazi)
  const dayElement = getStemElement(dayMaster)

  // 天干十神（排除日主）
  const stemTenGods = pool.entries.map(e => ({
    stem: e.stem,
    pillar: e.pillar,
    tenGod: getTenGod(dayMaster, e.stem),
  }))

  // ── 取格原因 ──
  const hiddenDesc = hiddenStems.map(hs => {
    const tg = getTenGod(dayMaster, hs.stem)
    return `${hs.stem}（${hs.position}·${tg}）`
  }).join('、')

  const stemDesc = stemTenGods.map(s =>
    `${s.stem}（${pillarCn(s.pillar)}干，${s.tenGod}）`
  ).join('、')

  let patternReason = `月支${monthBranch}，藏${hiddenDesc}。日主${dayMaster}${dayElement}。天干除日主外有：${stemDesc}。`

  // 按取格来源补具体原因
  if (bage.patternOrigin === '透干') {
    const chosenHs = hiddenStems.find(hs => hs.stem === bage.patternGod)
    const match = stemTenGods.find(s => s.stem === bage.patternGod)
    if (chosenHs && match) {
      patternReason += `${chosenHs.position}${bage.patternGod}透于${pillarCn(match.pillar)}干。`
    }
    patternReason += `${bage.patternGod}对${dayMaster}日主为${bage.patternGodType}，故立${bage.patternName}。`
  } else if (bage.patternOrigin === '禄刃借透') {
    patternReason += `${bage.patternGodSource}`
  } else if (bage.patternName === '建禄格' || bage.patternName === '月刃格') {
    // 本气不透 + 禄刃格：说明禄刃判定
    const benQi = hiddenStems[0]
    const luInfo = getLuRenInfo(dayMaster, monthBranch)
    if (luInfo) {
      patternReason += `${monthBranch}中藏${benQi.stem}为日主${bage.patternGodType}，月令归禄刃月。${luInfo}。故立${bage.patternName}。`
    } else {
      patternReason += `${monthBranch}中藏${benQi.stem}为日主${bage.patternGodType}，月令归禄刃月。${dayMaster}之禄非${monthBranch}、${dayMaster}之阳刃亦非${monthBranch}，故以杂气比肩立${bage.patternName}。`
    }
  } else {
    // 本气不透 + 普通格局
    patternReason += `月令藏干均未透于天干，取本气${bage.patternGod}（${bage.patternGodType}）立${bage.patternName}。`
  }

  // ── 成败原因 ──
  const outcomeReason = buildOutcomeReason(bazi, bage, pool.stems, stemTenGods)

  return {
    patternName: bage.patternName,
    outcomeType: bage.outcomeType,
    patternReason,
    outcomeReason,
  }
}

// ── 禄刃判定信息 ──

const LU_POSITION: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
  '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
  '壬': '亥', '癸': '子',
}

const YANG_REN_POSITION: Record<string, string> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
}

function getLuRenInfo(dayMaster: string, monthBranch: string): string | null {
  const lu = LU_POSITION[dayMaster]
  const ren = YANG_REN_POSITION[dayMaster]
  if (monthBranch === lu) return `${dayMaster}之禄在${lu}，月支恰为禄位`
  if (monthBranch === ren) return `${dayMaster}之阳刃在${ren}，月支恰为阳刃位`
  return null
}

// ── 成败原因生成 ──

function buildOutcomeReason(
  bazi: BaziResult,
  bage: BageResult,
  poolStems: string[],
  stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  const monthBranch = bazi.pillars.month.branch
  const dayMaster = bazi.dayMaster

  // 天干十神集合描述（供复用）
  const poolDesc = stemTenGods.map(s => `${s.stem}（${pillarCn(s.pillar)}干，${s.tenGod}）`).join('、')

  // ── 禄刃格 ──
  if (bage.patternName === '建禄格' || bage.patternName === '月刃格') {
    if (bage.success === true) {
      return buildLuRenCheng(bazi, monthBranch)
    }
    if (bage.success === null) {
      return buildLuRenZhongLi(bazi, monthBranch, bage.successDetail)
    }
  }

  // ── 正官格 ──
  if (bage.patternName === '正官格') {
    return buildZhengGuanReason(bage, poolDesc, stemTenGods)
  }

  // ── 七杀格 ──
  if (bage.patternName === '七杀格') {
    return buildQiShaReason(bage, poolDesc, stemTenGods)
  }

  // ── 正印格 ──
  if (bage.patternName === '正印格') {
    return buildZhengYinReason(bage, poolDesc, stemTenGods)
  }

  // ── 偏印格 ──
  if (bage.patternName === '偏印格') {
    return buildPianYinReason(bage, poolDesc, stemTenGods)
  }

  // ── 正财格 / 偏财格 ──
  if (bage.patternName === '正财格' || bage.patternName === '偏财格') {
    return buildCaiReason(bage, poolDesc, stemTenGods)
  }

  // ── 食神格 ──
  if (bage.patternName === '食神格') {
    return buildShiShenReason(bage, poolDesc, stemTenGods)
  }

  // ── 伤官格 ──
  if (bage.patternName === '伤官格') {
    return buildShangGuanReason(bage, poolDesc, stemTenGods)
  }

  // 兜底
  return bage.successDetail || '格局存疑。'
}

// ── 各格成败文案 ──

function buildLuRenCheng(bazi: BaziResult, monthBranch: string): string {
  const otherBranches = [
    { pillar: '年', branch: bazi.pillars.year.branch },
    { pillar: '日', branch: bazi.pillars.day.branch },
    { pillar: '时', branch: bazi.pillars.hour.branch },
  ]
  const parts = otherBranches.map(ob => `${ob.pillar}支${ob.branch}——${monthBranch}${ob.branch}不冲`)
  return `建禄格月令无冲即自成立。月支${monthBranch}，查年、日、时支是否与之相冲（六冲：子午、丑未、寅申、卯酉、辰戌、巳亥）。${parts.join('；')}。月令无冲，格局自成立。`
}

function buildLuRenZhongLi(_bazi: BaziResult, monthBranch: string, detail: string): string {
  return `建禄格月令逢冲则根基动摇。${detail}。`
}

function buildZhengGuanReason(
  bage: BageResult,
  poolDesc: string,
  stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  if (bage.success === true && bage.xiangShen) {
    return `正官格喜财生或印护。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起${bage.xiangShen.role}作用，故成格。`
  }
  if (bage.success === false) {
    return `正官格忌伤官见官。命局天干有伤官克制正官，此为破格；天干无正印制伤护官、无财通关（伤生财→财生官），故破格。`
  }
  if (bage.success === null) {
    // 官杀混杂或中立
    if (bage.successDetail.includes('官杀混杂')) {
      return `正官格忌官杀混杂（正官与七杀同现），难以判定何方主导，故中立。`
    }
    return `正官格喜财生或印护。天干无伤官破格，亦无财印相助，故中立。`
  }
  return bage.successDetail
}

function buildQiShaReason(
  bage: BageResult,
  poolDesc: string,
  _stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  if (bage.success === true && bage.xiangShen) {
    return `七杀格需食神制杀或印星化杀。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起${bage.xiangShen.role}作用，故成格。`
  }
  if (bage.success === false) {
    return `七杀格需食神制杀或印星化杀。命局天干：${poolDesc}。天干中无食神（制杀）、无印星（化杀），故七杀无制，判不成格。`
  }
  if (bage.success === null) {
    if (bage.successDetail.includes('制化两立')) {
      return `七杀格有食神制杀与印星化杀同现（制化两立），无财通关调和，难以判定，故中立。`
    }
    return `七杀格需食神制杀或印星化杀。${bage.successDetail}`
  }
  return bage.successDetail
}

function buildZhengYinReason(
  bage: BageResult,
  poolDesc: string,
  _stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  if (bage.success === true && bage.xiangShen) {
    return `正印格忌财破印，喜官杀生印或比劫制财护印。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起${bage.xiangShen.role}作用，故成格。`
  }
  if (bage.success === null) {
    if (bage.successDetail.includes('财印并见')) {
      return `正印格忌财破印。命局天干：${poolDesc}。财印并见，无比劫调和（制财护印），故中立。`
    }
    return `正印格忌财破印、喜官杀生印。天干无财破印，亦无官杀生助，故中立。`
  }
  return bage.successDetail
}

function buildPianYinReason(
  bage: BageResult,
  poolDesc: string,
  _stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  if (bage.success === true && bage.xiangShen) {
    // 枭神夺食有财救
    return `偏印格见食神为枭神夺食（偏印为病），需财制枭护食。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起${bage.xiangShen.role}作用，故成格。`
  }
  if (bage.success === false) {
    return `偏印格见食神为枭神夺食（偏印为病），需财制枭护食。命局天干有偏印夺食，但无财星制枭，故破格。`
  }
  if (bage.success === null) {
    if (bage.successDetail.includes('财来破印') || bage.successDetail.includes('财印相战')) {
      return `偏印格无食神（偏印不为病，而是生身之用神）。命局天干：${poolDesc}。有财则财来破印（贪财坏印），财印相战，故中立。`
    }
    if (bage.successDetail.includes('制杀与枭印')) {
      return `偏印格中食神制杀与枭印并见，格局复杂，难以判定，故中立。`
    }
    return `偏印格无食神（偏印不为病），天干无财破印亦无官杀生印，故中立。`
  }
  return bage.successDetail
}

function buildCaiReason(
  bage: BageResult,
  poolDesc: string,
  _stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  if (bage.success === true && bage.xiangShen) {
    if (bage.xiangShen.role.includes('食伤生财')) {
      return `${bage.patternName}喜食伤生财。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起食伤生财作用，故成格。`
    }
    // 官杀制比劫护财
    return `${bage.patternName}忌比劫夺财，需官杀制比劫护财。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起${bage.xiangShen.role}作用，故成格。`
  }
  if (bage.success === null) {
    if (bage.successDetail.includes('比劫透干') || bage.successDetail.includes('无官杀护卫')) {
      return `${bage.patternName}忌比劫夺财。命局天干：${poolDesc}。比劫透干夺财，但无官杀制比劫护财，故中立。`
    }
    return `${bage.patternName}喜食伤生财或官杀护财。天干无比劫破格，亦无食伤/官杀相助，故中立。`
  }
  return bage.successDetail
}

function buildShiShenReason(
  bage: BageResult,
  poolDesc: string,
  _stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  if (bage.success === true && bage.xiangShen) {
    if (bage.xiangShen.role.includes('财制枭护食')) {
      return `食神格忌偏印（枭神夺食），需财制枭护食。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起财制枭护食作用，故成格。`
    }
    return `食神格喜生财或制杀。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起${bage.xiangShen.role}作用，故成格。`
  }
  if (bage.success === false) {
    return `食神格忌偏印（枭神夺食），需财制枭护食。命局天干有偏印夺食，但无财星制枭，故破格。`
  }
  if (bage.success === null) {
    if (bage.successDetail.includes('制杀与枭印')) {
      return `食神格中食神制杀与枭印并见，格局复杂，难以判定，故中立。`
    }
    return `食神透干，无偏印破格，亦无财/杀相助，故中立。`
  }
  return bage.successDetail
}

function buildShangGuanReason(
  bage: BageResult,
  poolDesc: string,
  _stemTenGods: { stem: string; pillar: 'year' | 'month' | 'hour'; tenGod: string }[],
): string {
  if (bage.success === true && bage.xiangShen) {
    if (bage.xiangShen.role.includes('印制伤护官')) {
      return `伤官格忌伤官见官（伤官克正官）。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起印制伤护官作用，故成格。`
    }
    if (bage.xiangShen.role.includes('财通关')) {
      return `伤官格忌伤官见官（伤官克正官）。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起财通关作用（伤生财→财生官），故成格。`
    }
    return `伤官格喜生财或配印。命局天干：${poolDesc}。${bage.xiangShen.gan}（${bage.xiangShen.type}）起${bage.xiangShen.role}作用，故成格。`
  }
  if (bage.success === false) {
    return `伤官格忌伤官见官（伤官克正官）。命局天干有伤官克制正官，此为破格；天干无正印制伤、无财通关，故破格。`
  }
  if (bage.success === null) {
    return `伤官透干，无正官破格，亦无财/印相助，故中立。`
  }
  return bage.successDetail
}
