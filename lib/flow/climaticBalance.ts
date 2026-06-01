import type { BaziResult, ElementType } from '@/types/bazi'
import type { ElementForceReport, ClimaticReport, ColdWarm, DryWet, ClimaticPattern } from './types'

const COLD_MONTHS = new Set(['亥', '子', '丑', '申', '酉', '戌'])
const WARM_MONTHS = new Set(['寅', '卯', '辰', '巳', '午', '未'])

const DRY_MONTHS = new Set(['巳', '午', '未', '戌'])
const WET_MONTHS = new Set(['亥', '子', '丑', '辰'])

export function computeClimaticBalance(
  bazi: BaziResult,
  forceReport: ElementForceReport,
): ClimaticReport {
  const monthBranch = bazi.pillars.month.branch
  const avg = forceReport.average

  const fireForce = forceReport.forces['火'].force
  const waterForce = forceReport.forces['水'].force
  const earthForce = forceReport.forces['土'].force
  const metalForce = forceReport.forces['金'].force
  const woodForce = forceReport.forces['木'].force

  // ── 寒暖判定 ──
  let coldWarm: ColdWarm
  if (COLD_MONTHS.has(monthBranch) && fireForce < 0.5 * avg) {
    coldWarm = '偏寒'
  } else if (WARM_MONTHS.has(monthBranch) && waterForce < 0.5 * avg) {
    coldWarm = '偏暖'
  } else {
    coldWarm = '平衡'
  }

  // ── 燥湿判定 ──
  let dryWet: DryWet
  if (DRY_MONTHS.has(monthBranch) && fireForce + earthForce > waterForce * 3) {
    dryWet = '偏燥'
  } else if (WET_MONTHS.has(monthBranch) && waterForce + earthForce > fireForce * 3) {
    dryWet = '偏湿'
  } else {
    dryWet = '平衡'
  }

  // ── 格局判定（穷通宝鉴模式） ──
  const pattern = classifyPattern(fireForce, earthForce, waterForce, metalForce, woodForce, avg)

  // ── 调候需求 ──
  const needs = deriveNeeds(pattern, forceReport, avg)

  // 火炎土燥但有金水救应：金泄土生水，调候已有出路
  // 古籍："用金泄土，无水金熔" — 必须金水双全才算救应
  const hasRescue =
    pattern === '火炎土燥' &&
    metalForce >= 0.5 * avg &&
    waterForce >= 0.5 * avg

  const detail = `月令${monthBranch}，寒暖${coldWarm}，燥湿${dryWet}，格局${pattern}`

  return { coldWarm, dryWet, pattern, needs, detail, hasRescue }
}

function classifyPattern(
  fire: number,
  earth: number,
  water: number,
  metal: number,
  wood: number,
  avg: number,
): ClimaticPattern {
  // 火炎土燥：火土 ≥ 2.5×水 AND (火 ≥ avg OR 土 ≥ 1.5×avg)
  if (
    water > 0 &&
    fire + earth >= 2.5 * water &&
    (fire >= avg || earth >= 1.5 * avg)
  ) {
    return '火炎土燥'
  }

  // 金水寒滞：金水 ≥ 2.5×火 AND (水 ≥ avg OR 金 ≥ 1.5×avg)
  if (
    fire > 0 &&
    metal + water >= 2.5 * fire &&
    (water >= avg || metal >= 1.5 * avg)
  ) {
    return '金水寒滞'
  }

  // 水冷土湿：水土 ≥ 2.5×火 AND 水 ≥ avg AND 土 ≥ 0.8×avg
  if (
    fire > 0 &&
    water + earth >= 2.5 * fire &&
    water >= avg &&
    earth >= 0.8 * avg
  ) {
    return '水冷土湿'
  }

  // 木火通明：木火 ≥ 2.5×金 AND (火 ≥ avg OR 木 ≥ 1.5×avg)
  if (
    metal > 0 &&
    wood + fire >= 2.5 * metal &&
    (fire >= avg || wood >= 1.5 * avg)
  ) {
    return '木火通明'
  }

  return '平衡'
}

function deriveNeeds(
  pattern: ClimaticPattern,
  forceReport: ElementForceReport,
  avg: number,
): ElementType[] {
  const needs: ElementType[] = []

  switch (pattern) {
    case '火炎土燥':
      needs.push('水', '金')
      break
    case '金水寒滞':
      needs.push('火', '木')
      break
    case '水冷土湿':
      needs.push('火', '土')
      break
    case '木火通明':
      needs.push('水', '金')
      break
    case '平衡':
      break
  }

  // 补充极端五行缺失（不在 pattern 覆盖范围内的极弱元素）
  const weakThreshold = 0.25 * avg
  for (const el of ['金', '木', '水', '火', '土'] as ElementType[]) {
    if (forceReport.forces[el].force < weakThreshold && !needs.includes(el)) {
      needs.push(el)
    }
  }

  return needs
}
