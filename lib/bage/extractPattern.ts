import type { BaziResult } from '@/types/bazi'
import type { PatternCategory, PatternDisplayName, PatternOrigin } from './types'
import {
  getHiddenStemsSpec,
  isYangRen,
  getSanHeGroup,
  monthBranchFormsHe,
  getStemElement,
  elementToTenGod,
  isHuaRenWeiYin,
} from './helpers'
import { getTenGod } from '@/lib/bazi-utils'
import { isCongShaDetailed, isCongCaiDetailed } from './congGe'
import { isHuaGeDetailed, recalculateShiShen, getHuaQiDayMaster } from './huaGe'
import type { HuaQiShiShenResult } from './huaGe'

// ── 十神 → 格局映射 ──
const TEN_GOD_TO_CATEGORY: Record<string, PatternCategory> = {
  正官: '官格', 七杀: '杀格',
  正财: '财格', 偏财: '财格',
  正印: '印格', 偏印: '印格',
  食神: '食神格', 伤官: '伤官格',
}

const TEN_GOD_TO_DISPLAY: Record<string, PatternDisplayName> = {
  正官: '正官格', 七杀: '七杀格',
  正财: '正财格', 偏财: '偏财格',
  正印: '正印格', 偏印: '偏印格',
  食神: '食神格', 伤官: '伤官格',
}

const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬'])

/** 五合化气：日主 → 合神 */
const HUA_PARTNER_MAP: Record<string, string> = {
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
}

export interface ExtractResult {
  category: PatternCategory
  displayName: PatternDisplayName
  /**
   * legacy 字段:内容为格神/另取用神,不是机制用神。
   * 自 S4 起,喜忌用神由 computeXiYong 依据成败层 conditions 推导,
   * 禁止新代码读取本字段推导喜用/忌神。
   */
  yongShen: string
  /** 格神描述(展示用) */
  patternGod: string
  /** 格神十神(如七杀格的格神十神=七杀);化格/从格无传统格神,为 null */
  patternGodTenGod: string | null
  origin: PatternOrigin
  /** 透干的格神所在天干位置（仅透干取格时有值） */
  patternStem: string | null
  /** 会支取格时形成的五行 */
  patternElement: string | null
  /** 建禄月劫格：天干所透的用神十神 */
  luJieYongShenTenGod: string | null
  /** 化格：化气后十神重排数据 */
  huaQiShiShen: HuaQiShiShenResult | null
  /**
   * 判定轨迹【格局规格书 §0.4】:每步级联检查了什么、依据哪条、命中与否。
   * 供"判定依据"展示与测试核验。
   */
  judgementTrace: string[]
}

function fmtChain(steps: { label: string; met: boolean; note: string }[]): string {
  return steps.map((s) => `${s.label}${s.met ? '✓' : '✗'}(${s.note})`).join(' → ')
}

function fmtSteps(label: string, steps: { label: string; met: boolean; note: string }[]): string {
  return `【${label}】` + fmtChain(steps)
}

export function extractPattern(bazi: BaziResult): ExtractResult {
  const { pillars, dayMaster } = bazi
  const monthBranch = pillars.month.branch
  const hidden = getHiddenStemsSpec(monthBranch)
  const benQi = hidden[0]
  const zhongQi = hidden[1] ?? null
  const yuQi = hidden[2] ?? null
  const trace: string[] = []

  // 所有天干（不含日干，日干不透）
  const allStems = [
    pillars.year.stem,
    pillars.month.stem,
    bazi.dayMaster,
    pillars.hour.stem,
  ]
  const touGanStems = [
    pillars.year.stem,
    pillars.month.stem,
    pillars.hour.stem,
  ] // 透干的候选位置（年/月/时）

  // 所有地支
  const allBranches = [
    pillars.year.branch,
    pillars.month.branch,
    pillars.day.branch,
    pillars.hour.branch,
  ]

  // ── 化格优先判定（《滴天髓》原文·任铁樵注）──
  // 优先级最高：化格 > 从格 > 八格。真化直取化格，假化（返回null）继续。
  // 【格局规格书 §0.1 优先级链】

  const huaDetail = isHuaGeDetailed(bazi)
  if (huaDetail.result) {
    trace.push(fmtSteps('化格', huaDetail.steps) + ` → 取${huaDetail.result.name}`)
    const { name, huaShen } = huaDetail.result
    // 合神（partner stem）即化神五行之干
    const huaPartner = HUA_PARTNER_MAP[dayMaster]
    const huaStem = touGanStems.find((s) => s === huaPartner)
    const newDayMaster = getHuaQiDayMaster(dayMaster, huaPartner)
    const huaQiShiShen = newDayMaster ? recalculateShiShen(bazi, newDayMaster) : null
    return {
      category: name as PatternCategory,
      displayName: name as PatternDisplayName,
      yongShen: huaStem ?? huaShen,
      patternGod: `日主${dayMaster}合${huaPartner}化${huaShen},化气成格`,
      patternGodTenGod: null,
      origin: '化格',
      patternStem: huaStem ?? null,
      patternElement: huaShen,
      luJieYongShenTenGod: null,
      huaQiShiShen,
      judgementTrace: trace,
    }
  }
  {
    trace.push(`【化格】未成化:${fmtChain(huaDetail.steps)}`)
  }

  // ── 从格优先判定（《滴天髓》原文·任铁樵注）──
  // 从格在八格之前判定。真从则直取从格，假从（返回null）继续走八格。
  // 【格局规格书 §0.2 从格不依赖强弱模块】

  const congShaDetail = isCongShaDetailed(bazi)
  if (congShaDetail.result) {
    trace.push(fmtSteps('从杀', congShaDetail.steps) + ' → 取从杀格')
    const shaStem = touGanStems.find((s) => {
      const tg = getTenGod(dayMaster, s)
      return tg === '正官' || tg === '七杀'
    })
    return {
      category: '从杀格',
      displayName: '从杀格',
      yongShen: shaStem ?? '官杀',
      patternGod: `日主${dayMaster}无根,全局官杀强旺,从杀为格`,
      patternGodTenGod: null,
      origin: '从格',
      patternStem: shaStem ?? null,
      patternElement: null,
      luJieYongShenTenGod: null,
      huaQiShiShen: null,
      judgementTrace: trace,
    }
  }
  {
    trace.push(`【从杀】未成从:${fmtChain(congShaDetail.steps)}`)
  }

  const congCaiDetail = isCongCaiDetailed(bazi)
  if (congCaiDetail.result) {
    trace.push(fmtSteps('从财', congCaiDetail.steps) + ' → 取从财格')
    const caiStem = touGanStems.find((s) => {
      const tg = getTenGod(dayMaster, s)
      return tg === '正财' || tg === '偏财'
    })
    return {
      category: '从财格',
      displayName: '从财格',
      yongShen: caiStem ?? '财星',
      patternGod: `日主${dayMaster}无根,全局财星强旺,从财为格`,
      patternGodTenGod: null,
      origin: '从格',
      patternStem: caiStem ?? null,
      patternElement: null,
      luJieYongShenTenGod: null,
      huaQiShiShen: null,
      judgementTrace: trace,
    }
  }
  {
    trace.push(`【从财】未成从:${fmtChain(congCaiDetail.steps)}`)
  }

  // 调候特例：化刃为印——戊土日主 + 午月 + 天干透丙丁 + 地支会火局
  // 必须在分流之前检查，因为午月本气丁火为正印，不会进入比劫分支
  if (isHuaRenWeiYin(bazi)) {
    const fireStems = touGanStems.filter((s) => s === '丙' || s === '丁')
    const primaryFire = fireStems[0]
    const tenGod = getTenGod(dayMaster, primaryFire)
    const displayName = tenGod === '偏印' ? '偏印格' : '正印格'
    trace.push(`【化刃为印】戊土+午刃+透丙丁[${fireStems.join(',')}]+会火局 → 取${displayName}`)

    return {
      category: '印格',
      displayName,
      yongShen: primaryFire,
      patternGod: `月支午(刃)化火印,${primaryFire}(${tenGod})透干`,
      patternGodTenGod: tenGod,
      origin: '比劫当令',
      patternStem: primaryFire,
      patternElement: null,
      luJieYongShenTenGod: null,
      huaQiShiShen: null,
      judgementTrace: trace,
    }
  }

  // 第一步：判断月支本气对日主的十神
  const benQiTenGod = getTenGod(dayMaster, benQi)

  // 第二步分流：月支本气是不是比劫？
  const isBiJie = benQiTenGod === '比肩' || benQiTenGod === '劫财'
  trace.push(`【分流】月支${monthBranch}本气${benQi}(${benQiTenGod})${isBiJie ? '为比劫 → 分支A(建禄/阳刃)' : '非比劫 → 分支B(八格)'}`)

  if (isBiJie) {
    // ── 分支 A：月支本气是比劫 ──

    // A.1 阳刃格：日主为阳干 且 月支 = 该日主的刃位
    if (YANG_GAN.has(dayMaster) && isYangRen(monthBranch, dayMaster)) {
      // 用神：以官杀为用（制刃者），从天干中找
      const touStems = touGanStems.filter((s) => {
        const tg = getTenGod(dayMaster, s)
        return tg === '正官' || tg === '七杀'
      })
      const yongShen = touStems.length > 0 ? touStems[0] : '官杀'
      trace.push(`【阳刃】日主${dayMaster}阳干+月支${monthBranch}为刃 → 取阳刃格,用官杀[${touStems.join(',') || '无透,取官杀'}]`)

      return {
        category: '阳刃格',
        displayName: '阳刃格',
        yongShen,
        patternGod: `月支${monthBranch}(刃)`,
        patternGodTenGod: benQiTenGod,
        origin: '比劫当令',
        patternStem: null,
        patternElement: null,
        luJieYongShenTenGod: null,
        huaQiShiShen: null,
        judgementTrace: trace,
      }
    }

    // A.2 建禄月劫格
    // 从天干找另取的用神：官/杀优先，其次财，再次食伤【本系统决策·待规格书4.7定序】
    const touStemTenGods = touGanStems.map((s) => ({
      stem: s,
      tenGod: getTenGod(dayMaster, s),
    }))

    // 优先级：官/杀 > 财 > 食伤
    const priorityOrder = ['七杀', '正官', '偏财', '正财', '食神', '伤官']
    let selectedYongShen: { stem: string; tenGod: string } | null = null
    for (const p of priorityOrder) {
      const found = touStemTenGods.find((t) => t.tenGod === p)
      if (found) {
        selectedYongShen = found
        break
      }
    }

    const yongShen = selectedYongShen
      ? `${selectedYongShen.stem}(${selectedYongShen.tenGod})`
      : '无财官杀食可取'
    trace.push(`【建禄月劫】另取用神,按序(七杀>正官>偏财>正财>食神>伤官)${selectedYongShen ? `取${selectedYongShen.stem}(${selectedYongShen.tenGod})` : '无财官杀食可取'}`)

    return {
      category: '建禄月劫格',
      displayName: '建禄月劫格',
      yongShen,
      patternGod: `月支${monthBranch}(比劫当令)`,
      patternGodTenGod: benQiTenGod,
      origin: '比劫当令',
      patternStem: null,
      patternElement: null,
      luJieYongShenTenGod: selectedYongShen?.tenGod ?? null,
      huaQiShiShen: null,
      judgementTrace: trace,
    }
  }

  // ── 分支 B：月支本气非比劫 ──

  // B.1 透干取格（过滤比劫：比肩/劫财不可独立成格）
  const transparent = hidden.filter((hs) => {
    if (!touGanStems.includes(hs)) return false
    const tg = getTenGod(dayMaster, hs)
    return tg !== '比肩' && tg !== '劫财'
  })

  if (transparent.length > 0) {
    // 本气优先（若本气为八格十神且透干）
    let selectedStem: string
    if (transparent.includes(benQi)) {
      selectedStem = benQi
    } else {
      selectedStem = transparent[0] // 透出的第一个八格十神（中气或余气）
    }

    const tenGod = getTenGod(dayMaster, selectedStem)
    const category = TEN_GOD_TO_CATEGORY[tenGod]
    const displayName = TEN_GOD_TO_DISPLAY[tenGod]

    if (!category) {
      throw new Error(`无法确定格局：${selectedStem}(${tenGod})`)
    }

    // 确定透出位置
    const pos =
      pillars.year.stem === selectedStem ? '年干'
      : pillars.month.stem === selectedStem ? '月干'
      : '时干'

    const qiLabel = selectedStem === benQi ? '本气' : selectedStem === zhongQi ? '中气' : '余气'
    trace.push(`【透干取格】月支${monthBranch}藏干${selectedStem}(${tenGod},${qiLabel})透${pos} → 取${displayName}`)

    return {
      category,
      displayName,
      yongShen: selectedStem,
      patternGod: `${selectedStem}(${tenGod},月支${monthBranch}${qiLabel}透${pos})`,
      patternGodTenGod: tenGod,
      origin: '透干',
      patternStem: selectedStem,
      patternElement: null,
      luJieYongShenTenGod: null,
      huaQiShiShen: null,
      judgementTrace: trace,
    }
  }

  // B.2 会支取格（三支齐全，规格书 B.2：取会成五行对日主的十神）
  const heResult = monthBranchFormsHe(monthBranch, allBranches)
  if (heResult) {
    const element = heResult.element
    // 会成五行对日主的十神；局按整体气势论，取‘same’阴阳侧（偏/杀/食/偏印）
    const tenGod = elementToTenGod(element, bazi.dayMasterElement, 'same')

    // 【格局规格书 1.2-B.2】会成比劫局不可独立成格 → 回落本气取格
    if (tenGod === '比肩' || tenGod === '劫财') {
      trace.push(`【会支取格】月支${monthBranch}${heResult.type}${element}局成${tenGod},比劫不可成格 → 回落本气取格`)
    } else {
      const category = TEN_GOD_TO_CATEGORY[tenGod]
      const displayName = TEN_GOD_TO_DISPLAY[tenGod]

      if (!category) {
        throw new Error(`无法确定格局：会${element}局(${tenGod})`)
      }

      trace.push(`【会支取格】月支${monthBranch}${heResult.type}${element}局(${tenGod}) → 取${displayName}`)

      return {
        category,
        displayName,
        yongShen: `会${element}局`,
        patternGod: `月支${monthBranch}${heResult.type}${element}局(${tenGod})`,
        patternGodTenGod: tenGod,
        origin: '会支',
        patternStem: null,
        patternElement: element,
        luJieYongShenTenGod: null,
        huaQiShiShen: null,
        judgementTrace: trace,
      }
    }
  }

  // B.3 不透不会 → 仅以本气论
  const tenGod = benQiTenGod
  const category = TEN_GOD_TO_CATEGORY[tenGod]
  const displayName = TEN_GOD_TO_DISPLAY[tenGod]

  if (!category) {
    throw new Error(`无法确定格局：本气${benQi}(${tenGod})`)
  }

  trace.push(`【本气取格】月支${monthBranch}本气${benQi}(${tenGod})不透不会 → 取${displayName}`)

  return {
    category,
    displayName,
    yongShen: benQi,
    patternGod: `月支${monthBranch}本气${benQi}(${tenGod}),不透不会,取本气`,
    patternGodTenGod: tenGod,
    origin: '不透不会',
    patternStem: null,
    patternElement: null,
    luJieYongShenTenGod: null,
    huaQiShiShen: null,
    judgementTrace: trace,
  }
}
