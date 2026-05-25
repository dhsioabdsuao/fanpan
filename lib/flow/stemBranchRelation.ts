import type { BaziResult, ElementType } from '@/types/bazi'
import { getStemElement, getBranchElement } from '@/lib/bazi-utils'
import { BRANCH_HIDDEN_STEMS } from '@/lib/strength/conflictHelpers'
import { elementControls } from '@/lib/strength/conflictHelpers'
import type {
  StemBranchPair,
  BranchExpressReport,
  HiddenStemExpress,
  StemBranchReport,
  YinYangTexture,
  RelationType,
} from './types'

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬'])

const YANG_BRANCHES = new Set(['子', '寅', '辰', '午', '申', '戌'])
const YIN_BRANCHES = new Set(['丑', '卯', '巳', '未', '酉', '亥'])

const POSITIONS = ['year', 'month', 'day', 'hour'] as const

export function computeStemBranchRelation(bazi: BaziResult): StemBranchReport {
  // ── 四柱干支配对 ──
  const pairs: StemBranchPair[] = []
  const allStems: string[] = []

  for (const pos of POSITIONS) {
    const stem = bazi.pillars[pos].stem
    const branch = bazi.pillars[pos].branch
    allStems.push(stem)

    const stemEl = getStemElement(stem)
    const branchEl = getBranchElement(branch)
    const relation = classifyStemBranchRelation(stem, stemEl, branch, branchEl)
    const detail = buildRelationDetail(stem, branch, relation, stemEl, branchEl)

    pairs.push({
      position: pos,
      stem,
      branch,
      stemElement: stemEl,
      branchElement: branchEl,
      relation,
      detail,
    })
  }

  // ── 地支藏干透出 ──
  const branchExpressions: BranchExpressReport[] = []
  for (const pos of POSITIONS) {
    const branch = bazi.pillars[pos].branch
    const hidden = BRANCH_HIDDEN_STEMS[branch]
    if (!hidden) continue

    const expresses: HiddenStemExpress[] = hidden.map((entry) => ({
      stem: entry.stem,
      position: entry.position,
      expressed: allStems.includes(entry.stem),
    }))

    branchExpressions.push({
      branch,
      branchPosition: pos,
      hidden: expresses,
    })
  }

  // ── 阴阳质地（日主优先法） ──
  const dayMasterStem = bazi.dayMaster
  const branches = POSITIONS.map((pos) => bazi.pillars[pos].branch)
  const yangTexture = determineYinYangLayer(dayMasterStem, branches, allStems)

  const textureDetail =
    `日主${dayMasterStem}(${YANG_STEMS.has(dayMasterStem) ? '阳' : '阴'})，地支阳${branches.filter((b) => YANG_BRANCHES.has(b)).length}阴${branches.filter((b) => YIN_BRANCHES.has(b)).length}`

  return {
    pairs,
    branchExpressions,
    yinYangTexture: yangTexture,
    detail: textureDetail,
  }
}

function classifyStemBranchRelation(
  stem: string,
  stemEl: ElementType,
  branch: string,
  branchEl: ElementType,
): RelationType {
  const hidden = BRANCH_HIDDEN_STEMS[branch]
  if (!hidden) return '虚浮'

  // 检查通根：藏干中有同五行的
  const hasSameElement = hidden.some((h) => getStemElement(h.stem) === stemEl)

  // 检查得地：本气或中气与天干同五行
  const hasStrongRoot = hidden.some(
    (h) => (h.position === '本气' || h.position === '中气') && getStemElement(h.stem) === stemEl,
  )

  // 检查是否被克
  const branchControlsStem = elementControls(branchEl) === stemEl

  if (hasStrongRoot) return '得地'
  if (hasSameElement) return '通根'
  if (branchControlsStem) return '被截脚'
  return '虚浮'
}

function buildRelationDetail(
  stem: string,
  branch: string,
  relation: RelationType,
  stemEl: ElementType,
  branchEl: ElementType,
): string {
  switch (relation) {
    case '得地':
      return `${stem}(${stemEl})坐${branch}(${branchEl})，地支本气/中气有根，得地有力`
    case '通根':
      return `${stem}(${stemEl})坐${branch}(${branchEl})，地支藏干有同五行根，通根`
    case '被截脚':
      return `${stem}(${stemEl})坐${branch}(${branchEl})，天干被地支所克，截脚`
    case '虚浮':
      return `${stem}(${stemEl})坐${branch}(${branchEl})，地支无根且不被克，虚浮`
  }
}

function determineYinYangLayer(
  dayMasterStem: string,
  branches: string[],
  allStems: string[],
): YinYangTexture {
  const dmIsYang = YANG_STEMS.has(dayMasterStem)
  const yangBranchCount = branches.filter((b) => YANG_BRANCHES.has(b)).length
  const otherStemsAllYang = allStems
    .filter((s) => s !== dayMasterStem)
    .every((s) => YANG_STEMS.has(s))
  const otherStemsAllYin = allStems
    .filter((s) => s !== dayMasterStem)
    .every((s) => !YANG_STEMS.has(s))

  if (dmIsYang) {
    // 纯阳：日主阳 + 四地支全阳 + 其余天干全阳
    if (yangBranchCount === 4 && otherStemsAllYang) return '纯阳'
    if (yangBranchCount >= 3) return '阳主阴辅'
    if (yangBranchCount >= 2) return '阳主阴辅'
    if (yangBranchCount === 0 && otherStemsAllYin) return '阴主阳辅'
    return '阴阳均衡'
  } else {
    // 纯阴：日主阴 + 四地支全阴（0阳支）+ 其余天干全阴
    if (yangBranchCount === 0 && otherStemsAllYin) return '纯阴'
    if (yangBranchCount <= 1) return '阴主阳辅'
    if (yangBranchCount <= 2) return '阴主阳辅'
    if (yangBranchCount === 4 && otherStemsAllYang) return '阳主阴辅'
    return '阴阳均衡'
  }
}
