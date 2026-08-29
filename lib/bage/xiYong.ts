// ─────────────────────────────────────────────────────────────
// 喜忌综合层(诊断流程 L7)——全软件喜用/忌神的唯一计算处
// 规则依据:《喜忌规格书 v1.0》
// 铁律:喜用 ∩ 忌神 = ∅;八格杀格之格神元素永不在喜用中;
//      建禄月劫的另取用神是机制用神,可入喜用。
// 所有文案与 UI 只消费本模块结果,禁止自行推导喜忌。
// ─────────────────────────────────────────────────────────────

import type { ElementType } from '@/types/bazi'
import {
  getControllingElement,
  getControlledElement,
  getGeneratingElement,
  getGeneratedElement,
  getStemElement,
} from '@/lib/bazi-utils'
import type { ExtractResult } from './extractPattern'
import type { AssessResult } from './assessOutcome'

export interface XiJiConflict {
  element: ElementType
  role: '调候' | '通关'
  conflictingWith: '格局忌神' | '过旺五行' | '气候方向性忌神'
  resolution: '调候优先' | '通关转换' | '气候已足不需补' | '格局优先剔除'
  note: string
}

export interface XiYongResult {
  /** 喜用五行,有序:第一位为最喜 */
  favorable: ElementType[]
  /** 忌神五行(铁律:与 favorable 不相交) */
  avoid: ElementType[]
  primaryFavorable: ElementType | null
  secondaryFavorable: ElementType | null
  /** 通关元素(来自流通层) */
  tongGuan: ElementType | null
  /** 机制用神十神(如 食神制杀 → 食神;化格/从格为 null) */
  yongShenTenGod: string | null
  /** 格神十神(来自取格层) */
  patternGodTenGod: string | null
  conflicts: XiJiConflict[]
  /** 规则轨迹:每条记录应用的规则与依据【喜忌规格书 x.y】 */
  ruleTrace: string[]
}

export interface XiYongInput {
  pattern: ExtractResult
  outcome: AssessResult
  tiaoHouType: '火炎土燥' | '金寒水冷' | '寒暖适中'
  /** 穷通宝鉴调候天干(原文) */
  tiaoHouGods: string[]
  liuTongTongGuan: ElementType | null
  elementCount: Record<ElementType, number>
  dayMasterElement: ElementType
}

const ELEMENTS: ElementType[] = ['木', '火', '土', '金', '水']

function cond(outcome: AssessResult, label: string): boolean {
  return outcome.conditions.some((c) => c.label === label && c.met)
}

// ═══ 第一章:化格/从格 ═══

function deriveHuaCong(
  pattern: ExtractResult,
  dayMasterElement: ElementType,
): { favorable: ElementType[]; avoid: ElementType[]; trace: string[] } | null {
  const huaElement = pattern.patternElement as ElementType | null

  if (pattern.category.startsWith('化') && huaElement) {
    // 化神五行 + 化神泄秀【喜忌规格书 1.1】
    const xieXiu = getGeneratedElement(huaElement)
    const ke = getControllingElement(huaElement)
    return {
      favorable: [huaElement, xieXiu],
      avoid: [ke],
      trace: [
        `化格成立,只论化【喜忌规格书 1.1】→ 喜化神${huaElement}+泄秀${xieXiu},忌克化神${ke}`,
      ],
    }
  }

  if (pattern.category === '从杀格') {
    // 从神(官杀)+ 从神泄秀(官杀所生=印? 不对:官杀泄秀=官杀所生即印;但从格喜泄从神之气:
    // 从杀喜财生杀 + 泄杀之秀? 通行:从杀喜财(生杀)、食伤(制杀为忌)……
    // 【喜忌规格书 1.2】从神五行+从神之泄秀:从杀 → 官杀元素 + 官杀所生(印)?印化杀为破格因素,
    // 故从杀泄秀取"财"(从神之母?)——本系统按 1.2 从简:喜从神+生从神者(财生杀、食伤生财)。
    const congElement = getControllingElement(dayMasterElement)
    const shengCong = getGeneratingElement(congElement) // 财生官杀
    const yinEl = getGeneratingElement(dayMasterElement)
    const shiShangEl = getGeneratedElement(dayMasterElement)
    return {
      favorable: [congElement, shengCong],
      avoid: [yinEl, shiShangEl], // 印化杀、食伤制杀为从杀破格因素
      trace: [
        `从杀格成立,只论从【喜忌规格书 1.2】→ 喜从神${congElement}+生从神${shengCong},忌印${yinEl}化杀、食伤${shiShangEl}制杀`,
      ],
    }
  }

  if (pattern.category === '从财格') {
    const congElement = getControlledElement(dayMasterElement)
    const shengCong = getGeneratedElement(congElement) // 食伤生财
    const biJieEl = dayMasterElement
    const yinEl = getGeneratingElement(dayMasterElement)
    return {
      favorable: [congElement, shengCong],
      avoid: [biJieEl, yinEl], // 比劫夺财、印帮身为从财破格因素
      trace: [
        `从财格成立,只论从【喜忌规格书 1.2】→ 喜从神${congElement}+生从神${shengCong},忌比劫${biJieEl}夺财、印${yinEl}帮身`,
      ],
    }
  }

  return null
}

// ═══ 第二章:正格体系机制用神 ═══

function deriveMechanism(
  pattern: ExtractResult,
  outcome: AssessResult,
  dayMasterElement: ElementType,
): { elements: ElementType[]; yongShenTenGod: string | null; trace: string[] } {
  const caiEl = getControlledElement(dayMasterElement)
  const guanShaEl = getControllingElement(dayMasterElement)
  const yinEl = getGeneratingElement(dayMasterElement)
  const shiShangEl = getGeneratedElement(dayMasterElement)
  const biJieEl = dayMasterElement

  const byCond = (labels: string[], els: ElementType[], tenGod: string) => {
    if (labels.some((l) => cond(outcome, l))) {
      return { elements: els, yongShenTenGod: tenGod }
    }
    return null
  }

  switch (pattern.category) {
    case '官格': {
      const cai = byCond(['财生官'], [caiEl], '财星')
      const yin = byCond(['印护官'], [yinEl], '印星')
      if (cai && yin) {
        return { elements: [caiEl, yinEl], yongShenTenGod: '财星', trace: ['官格:财生官+印护官【喜忌规格书 2.2】→ 喜财、印'] }
      }
      if (cai) return { elements: [caiEl], yongShenTenGod: '财星', trace: ['官格:财生官【喜忌规格书 2.2】→ 喜财'] }
      if (yin) return { elements: [yinEl], yongShenTenGod: '印星', trace: ['官格:印护官【喜忌规格书 2.2】→ 喜印'] }
      return { elements: [caiEl, yinEl], yongShenTenGod: null, trace: ['官格不成格:补财或印【喜忌规格书 2.2】'] }
    }
    case '杀格': {
      const shi = byCond(['食神制杀'], [shiShangEl], '食神')
      const yin = byCond(['印星化杀'], [yinEl], '印星')
      if (shi && yin) {
        return { elements: [shiShangEl, yinEl], yongShenTenGod: '食神', trace: ['杀格:食神制杀+印星化杀【喜忌规格书 2.2】→ 喜食伤、印;格神七杀不入喜用'] }
      }
      if (shi) return { elements: [shiShangEl], yongShenTenGod: '食神', trace: ['杀格:食神制杀【喜忌规格书 2.2】→ 喜食伤;格神七杀不入喜用'] }
      if (yin) return { elements: [yinEl], yongShenTenGod: '印星', trace: ['杀格:印星化杀【喜忌规格书 2.2】→ 喜印;格神七杀不入喜用'] }
      return { elements: [shiShangEl, yinEl], yongShenTenGod: null, trace: ['杀格不成格:补食伤或印【喜忌规格书 2.2】;格神七杀不入喜用'] }
    }
    case '财格': {
      const shiShang = byCond(['食伤生财'], [shiShangEl], '食伤')
      const guan = byCond(['财生官'], [guanShaEl], '官星')
      if (shiShang && guan) {
        return { elements: [shiShangEl, guanShaEl], yongShenTenGod: '食伤', trace: ['财格:食伤生财+财生官【喜忌规格书 2.2】→ 喜食伤、官'] }
      }
      if (shiShang) return { elements: [shiShangEl], yongShenTenGod: '食伤', trace: ['财格:食伤生财【喜忌规格书 2.2】→ 喜食伤'] }
      if (guan) return { elements: [guanShaEl], yongShenTenGod: '官星', trace: ['财格:财生官【喜忌规格书 2.2】→ 喜官'] }
      return { elements: [shiShangEl, guanShaEl], yongShenTenGod: null, trace: ['财格不成格:补食伤或官【喜忌规格书 2.2】'] }
    }
    case '印格': {
      const guanSha = byCond(['官杀生印'], [guanShaEl], '官杀')
      const xieXiu = byCond(['食伤泄秀'], [shiShangEl], '食伤')
      if (guanSha && xieXiu) {
        return { elements: [guanShaEl, shiShangEl], yongShenTenGod: '官杀', trace: ['印格:官杀生印+食伤泄秀【喜忌规格书 2.2】→ 喜官杀、食伤'] }
      }
      if (guanSha) return { elements: [guanShaEl], yongShenTenGod: '官杀', trace: ['印格:官杀生印【喜忌规格书 2.2】→ 喜官杀'] }
      if (xieXiu) return { elements: [shiShangEl], yongShenTenGod: '食伤', trace: ['印格:食伤泄秀【喜忌规格书 2.2】→ 喜食伤'] }
      return { elements: [guanShaEl, shiShangEl], yongShenTenGod: null, trace: ['印格不成格:补官杀或食伤【喜忌规格书 2.2】'] }
    }
    case '食神格': {
      const cai = byCond(['食神生财'], [caiEl], '财星')
      const qiShi = byCond(['弃食就煞而透印'], [yinEl, guanShaEl], '印星')
      if (cai) return { elements: [caiEl], yongShenTenGod: '财星', trace: ['食神格:食神生财【喜忌规格书 2.2】→ 喜财'] }
      if (qiShi) return { elements: [yinEl, guanShaEl], yongShenTenGod: '印星', trace: ['食神格:弃食就煞而透印(杀印相生)【喜忌规格书 2.2】→ 喜印、杀'] }
      return { elements: [caiEl], yongShenTenGod: null, trace: ['食神格不成格:补财【喜忌规格书 2.2】'] }
    }
    case '伤官格': {
      if (outcome.tiaoHouSpecial === '金水伤官喜见官') {
        return { elements: [getControllingElement(dayMasterElement)], yongShenTenGod: '官星', trace: ['伤官格:金水伤官喜见官(调候为急)【喜忌规格书 2.2】→ 喜官(火)'] }
      }
      const cai = byCond(['伤官生财'], [caiEl], '财星')
      const yin = byCond(['伤官佩印'], [yinEl], '印星')
      const sha = byCond(['伤官带杀无财'], [guanShaEl], '七杀')
      if (cai && yin) {
        return { elements: [caiEl, yinEl], yongShenTenGod: '财星', trace: ['伤官格:伤官生财+伤官佩印【喜忌规格书 2.2】→ 喜财、印'] }
      }
      if (cai) return { elements: [caiEl], yongShenTenGod: '财星', trace: ['伤官格:伤官生财【喜忌规格书 2.2】→ 喜财'] }
      if (yin) return { elements: [yinEl], yongShenTenGod: '印星', trace: ['伤官格:伤官佩印【喜忌规格书 2.2】→ 喜印'] }
      if (sha) return { elements: [guanShaEl], yongShenTenGod: '七杀', trace: ['伤官格:伤官带杀【喜忌规格书 2.2】→ 喜杀'] }
      return { elements: [caiEl, yinEl], yongShenTenGod: null, trace: ['伤官格不成格:补财或印【喜忌规格书 2.2】'] }
    }
    case '建禄月劫格': {
      const tg = pattern.luJieYongShenTenGod
      if (tg === '七杀') {
        if (cond(outcome, '杀有制约')) {
          return { elements: [guanShaEl], yongShenTenGod: '七杀', trace: ['建禄月劫:另取用神七杀制劫,杀有制约【喜忌规格书 2.2】→ 喜杀(机制用神)'] }
        }
        return { elements: [shiShangEl, yinEl], yongShenTenGod: null, trace: ['建禄月劫透杀无制:补食伤或印【喜忌规格书 2.2】'] }
      }
      if (tg === '正官') {
        return { elements: [caiEl, yinEl], yongShenTenGod: '正官', trace: ['建禄月劫:另取用神正官【喜忌规格书 2.2】→ 喜财、印辅官'] }
      }
      if (tg === '正财' || tg === '偏财') {
        return { elements: [shiShangEl], yongShenTenGod: '财星', trace: ['建禄月劫:另取用神财,需食伤生财(转劫生财)【喜忌规格书 2.2】→ 喜食伤'] }
      }
      if (tg === '食神' || tg === '伤官') {
        return { elements: [shiShangEl], yongShenTenGod: '食伤', trace: ['建禄月劫:另取用神食伤泄秀【喜忌规格书 2.2】→ 喜食伤'] }
      }
      return { elements: [], yongShenTenGod: null, trace: ['建禄月劫无财官杀食可取:无机制用神【喜忌规格书 2.2】'] }
    }
    case '阳刃格': {
      return { elements: [guanShaEl], yongShenTenGod: '官杀', trace: ['阳刃格:官杀制刃【喜忌规格书 2.2】→ 喜官杀'] }
    }
    default:
      return { elements: [], yongShenTenGod: null, trace: ['未知格局:无机制用神'] }
  }
}

// ═══ 2.4 结构忌神 ═══

function structuralAvoid(pattern: ExtractResult, dayMasterElement: ElementType): ElementType[] {
  const caiEl = getControlledElement(dayMasterElement)
  const guanShaEl = getControllingElement(dayMasterElement)
  const yinEl = getGeneratingElement(dayMasterElement)
  const shiShangEl = getGeneratedElement(dayMasterElement)
  const biJieEl = dayMasterElement

  switch (pattern.category) {
    case '官格': return [shiShangEl] // 伤官克官
    case '杀格': return [caiEl, guanShaEl] // 财党杀、官杀混杂
    case '财格': return [biJieEl] // 比劫夺财
    case '印格': return [caiEl] // 财破印
    case '食神格': return [yinEl] // 枭夺食
    case '伤官格': return [guanShaEl] // 伤官见官
    case '建禄月劫格': return [biJieEl] // 比劫当令为病【本系统决策】
    case '阳刃格': return [biJieEl] // 刃宜伏制,忌比劫帮刃【本系统决策】
    default: return [] // 从格/化格在 deriveHuaCong 中单独处理
  }
}

// ═══ 主入口 ═══

export function computeXiYong(input: XiYongInput): XiYongResult {
  const { pattern, outcome, tiaoHouType, tiaoHouGods, liuTongTongGuan, elementCount, dayMasterElement } = input
  const trace: string[] = []
  const conflicts: XiJiConflict[] = []

  // ── 第一章:化格/从格 ──
  const huaCong = deriveHuaCong(pattern, dayMasterElement)
  if (huaCong) {
    trace.push(...huaCong.trace)
    // 过旺失衡(从格/化格同样适用,剔除喜用)
    const over = ELEMENTS.filter((el) => elementCount[el] >= 3 && !huaCong.favorable.includes(el))
    for (const el of over) huaCong.avoid.push(el)
    huaCong.avoid = [...new Set(huaCong.avoid)].filter((el) => !huaCong.favorable.includes(el))
    return {
      favorable: huaCong.favorable,
      avoid: huaCong.avoid,
      primaryFavorable: huaCong.favorable[0] ?? null,
      secondaryFavorable: huaCong.favorable[1] ?? null,
      tongGuan: liuTongTongGuan,
      yongShenTenGod: null,
      patternGodTenGod: pattern.patternGodTenGod,
      conflicts,
      ruleTrace: trace,
    }
  }

  // ── 第二章:正格体系 ──
  const mechanism = deriveMechanism(pattern, outcome, dayMasterElement)
  trace.push(...mechanism.trace)

  const climateExtreme = tiaoHouType !== '寒暖适中'
  const fixElement: ElementType | null =
    tiaoHouType === '火炎土燥' ? '水' : tiaoHouType === '金寒水冷' ? '火' : null

  const tiaoHouElements = [...new Set(tiaoHouGods.map((g) => getStemElement(g)))]

  const favorable: ElementType[] = []
  const roles: Record<string, string[]> = {}

  // 2.1 调候调度:气候极端 → 救治元素列第一
  if (climateExtreme && fixElement) {
    favorable.push(fixElement)
    roles[fixElement] = ['调候救治']
    trace.push(`气候${tiaoHouType}:调候救治元素${fixElement}列第一【喜忌规格书 2.1·穷通宝鉴调候为急】`)
  }

  // 2.2 机制用神
  for (const el of mechanism.elements) {
    if (!favorable.includes(el)) {
      favorable.push(el)
      roles[el] = ['格局机制用神']
    }
  }

  // 调候表其余元素(仅参考列后)
  for (const el of tiaoHouElements) {
    if (!favorable.includes(el)) {
      favorable.push(el)
      roles[el] = ['调候参考']
    }
  }
  if (!climateExtreme) {
    trace.push(`气候寒暖适中:格局用神列第一,调候${tiaoHouElements.join('/')}仅作参考列后【喜忌规格书 2.1】`)
  }

  // 2.3 通关列后(即使元素已在喜用中,也记录通关角色,供冲突裁决识别)
  if (liuTongTongGuan) {
    if (!favorable.includes(liuTongTongGuan)) {
      favorable.push(liuTongTongGuan)
    }
    roles[liuTongTongGuan] = [...(roles[liuTongTongGuan] ?? []), '通关']
    trace.push(`流通淤堵,通关元素${liuTongTongGuan}列后【喜忌规格书 2.3】`)
  }

  // 2.4 忌神三类并集
  const avoid = new Set<ElementType>(structuralAvoid(pattern, dayMasterElement))
  for (const el of ELEMENTS) {
    if (elementCount[el] >= 3 && !favorable.includes(el)) avoid.add(el)
  }
  if (tiaoHouType === '火炎土燥') avoid.add('火')
  if (tiaoHouType === '金寒水冷') avoid.add('水')
  trace.push(`忌神=结构忌神[${[...avoid].join('/')}]+过旺(≥3)+气候方向性忌神【喜忌规格书 2.4】`)

  // 2.5 冲突裁决【喜忌规格书 2.5】
  //  1) 调候救治元素 ∈ 忌神 → 保留(救急优先)
  //  2) 调候表其余参考元素 ∈ 忌神 → 从喜用剔除(格局优先)
  //  3) 通关元素 ∈ 忌神 → 保留(通关优先)
  const dropped: ElementType[] = []
  for (const el of favorable) {
    if (!avoid.has(el)) continue
    const rolesEl = roles[el] ?? []
    const isTongGuan = rolesEl.includes('通关')
    const isFix = rolesEl.includes('调候救治')
    const isTiaoHouRef = rolesEl.includes('调候参考') && !isFix
    if (!isTongGuan && !isFix && !isTiaoHouRef) continue

    const conflictingWith: XiJiConflict['conflictingWith'] =
      (tiaoHouType === '火炎土燥' && el === '火') || (tiaoHouType === '金寒水冷' && el === '水')
        ? '气候方向性忌神'
        : elementCount[el] >= 3 ? '过旺五行'
        : '格局忌神'

    if (isTongGuan) {
      // 3) 通关保留
      conflicts.push({ element: el, role: '通关', conflictingWith, resolution: '通关转换', note: `通关元素${el}与忌神冲突,保留在喜用中(通关优先)` })
      avoid.delete(el)
      trace.push(`冲突裁决:${el}∈忌神但为通关 → 保留喜用【喜忌规格书 2.5-3】`)
    } else if (isFix) {
      // 1) 调候救治保留
      conflicts.push({ element: el, role: '调候', conflictingWith, resolution: '调候优先', note: `调候救治${el}与忌神冲突,救急优先,保留在喜用中` })
      avoid.delete(el)
      trace.push(`冲突裁决:${el}∈忌神但为调候救治 → 保留喜用【喜忌规格书 2.5-1】`)
    } else {
      // 2) 调候参考剔除(格局优先)
      const isDirectional = conflictingWith === '气候方向性忌神'
      const note = isDirectional
        ? (tiaoHouType === '火炎土燥'
          ? `调候表含${el},但命局火候已足(火炎土燥),${el}反增燥,不再补`
          : `调候表含${el},但命局水寒已足(金寒水冷),${el}反增寒,不再补`)
        : `调候表含${el},但${el}为格局忌神/过旺,格局优先,不列喜用`
      conflicts.push({
        element: el, role: '调候', conflictingWith,
        resolution: isDirectional ? '气候已足不需补' : '格局优先剔除',
        note,
      })
      dropped.push(el)
      trace.push(`冲突裁决:调候参考${el}∈忌神 → 从喜用剔除(${note})【喜忌规格书 2.5-2】`)
    }
  }
  const finalFavorable = favorable.filter((el) => !dropped.includes(el))

  // 2.6 不变量
  const avoidList = [...avoid].filter((el) => !finalFavorable.includes(el))
  trace.push(`不变量校验:喜用[${finalFavorable.join('/')}] ∩ 忌神[${avoidList.join('/')}] = ∅ ✓【喜忌规格书 2.6】`)

  return {
    favorable: finalFavorable,
    avoid: avoidList,
    primaryFavorable: finalFavorable[0] ?? null,
    secondaryFavorable: finalFavorable[1] ?? null,
    tongGuan: liuTongTongGuan,
    yongShenTenGod: mechanism.yongShenTenGod,
    patternGodTenGod: pattern.patternGodTenGod,
    conflicts,
    ruleTrace: trace,
  }
}
