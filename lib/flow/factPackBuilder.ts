import type { BaziResult } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength/types'
import { computeElementForce } from './elementForce'
import { computeFlowLinks } from './linkFlow'
import { computeStemBranchRelation } from './stemBranchRelation'
import { computeTenGodDistribution } from './tenGods'
import { computeClimaticBalance } from './climaticBalance'
import { computeConflictsAndHarmonies } from './conflictsAndHarmonies'
import { classifyFlow } from './flowClassifier'
import type { FlowFactPack } from './types'

export function buildFactPack(
  bazi: BaziResult,
  _strength: DayMasterStrength,
): FlowFactPack {
  // ── 日主层 ──
  const dayMaster = bazi.dayMaster
  const dayMasterElement = bazi.dayMasterElement

  // ── 月令层 ──
  const monthPillar = bazi.pillars.month
  const monthCommand = {
    branch: monthPillar.branch,
    element: monthPillar.branchElement,
    hiddenStems: monthPillar.hiddenStems,
  }

  // ── 五行力量 ──
  const elementForce = computeElementForce(bazi)

  // ── 相生链路 ──
  const flowLinks = computeFlowLinks(elementForce)

  // ── 干支关联 ──
  const stemBranchRelation = computeStemBranchRelation(bazi)

  // ── 十神分布 ──
  const tenGods = computeTenGodDistribution(bazi)

  // ── 调候 ──
  const climaticBalance = computeClimaticBalance(bazi, elementForce)

  // ── 刑冲合 ──
  const conflictsAndHarmonies = computeConflictsAndHarmonies(bazi)

  // ── 命局结构（13 种类型） ──
  const structureSummary = classifyFlow(
    elementForce,
    flowLinks,
    tenGods,
    dayMasterElement,
  )

  // 将阴阳质地注入命局结构
  structureSummary.yinYangLayer = stemBranchRelation.yinYangTexture

  // ── LLM 占位符 ──
  const placeholders: Record<string, string> = {
    mainNarrative: '{{MAIN_NARRATIVE}}',
    flowAdvice: '{{FLOW_ADVICE}}',
    structureInsight: '{{STRUCTURE_INSIGHT}}',
    climaticNote: '{{CLIMATIC_NOTE}}',
    conflictNote: '{{CONFLICT_NOTE}}',
    // 四柱占位符（供 LLM prompt 使用，LLM 输出 [日柱] 后被替换为真实八字）
    年柱: bazi.pillars.year.stem + bazi.pillars.year.branch,
    月柱: bazi.pillars.month.stem + bazi.pillars.month.branch,
    日柱: bazi.pillars.day.stem + bazi.pillars.day.branch,
    时柱: bazi.pillars.hour.stem + bazi.pillars.hour.branch,
    年干: bazi.pillars.year.stem,
    年支: bazi.pillars.year.branch,
    月干: bazi.pillars.month.stem,
    月支: bazi.pillars.month.branch,
    日干: bazi.pillars.day.stem,
    日支: bazi.pillars.day.branch,
    时干: bazi.pillars.hour.stem,
    时支: bazi.pillars.hour.branch,
    日主: bazi.dayMaster,
  }

  return {
    dayMaster,
    dayMasterElement,
    monthCommand,
    elementForce,
    flowLinks,
    stemBranchRelation,
    tenGods,
    climaticBalance,
    structureSummary,
    conflictsAndHarmonies,
    placeholders,
  }
}
