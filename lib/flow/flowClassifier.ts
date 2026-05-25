import type { ElementType } from '@/types/bazi'
import type {
  ElementForceReport,
  FlowLink,
  TenGodDistribution,
  FlowType,
  FlowTypeEntry,
  StructureSummary,
} from './types'

const ALL_ELEMENTS: ElementType[] = ['金', '木', '水', '火', '土']

export function classifyFlow(
  forceReport: ElementForceReport,
  flowLinks: FlowLink[],
  tenGods: TenGodDistribution,
  dayMasterElement: ElementType,
): StructureSummary {
  const avg = forceReport.average
  const forces = ALL_ELEMENTS.map((e) => forceReport.forces[e].force)
  const maxForce = Math.max(...forces)
  const minForce = Math.min(...forces)

  const entries: FlowTypeEntry[] = []
  const blockedCount = flowLinks.filter((l) => l.status === 'blocked').length
  const allFlowing = flowLinks.every((l) => l.status === 'flowing')
  const allAboveHalf = forces.every((f) => f >= 0.5 * avg)
  const allAbove06 = forces.every((f) => f >= 0.6 * avg)
  const maxBelow14 = maxForce <= 1.4 * avg

  const dmForce = forceReport.forces[dayMasterElement].force

  // ── 优先级 1: 4a 双行交战 ──
  const warPairs = findDualWar(forceReport)
  if (warPairs.length >= 2 && entries.length < 3) {
    entries.push({
      type: '4a_双行交战',
      priority: 1,
      trigger: `双行交战：${warPairs.join('、')}`,
    })
  }

  // ── 优先级 2: 偏枯类 ──
  if (minForce <= 0.35 * avg && entries.length < 3) {
    // 找最旺的组合（两个相邻元素相加）
    const combos = computeElementCombos(forceReport)
    for (const combo of combos) {
      if (combo.force >= 1.6 * avg) {
        entries.push({
          type: combo.type,
          priority: 2,
          trigger: `最弱${elementAtMin(forceReport)}≤0.35×avg，${combo.name}≥1.6×avg`,
        })
        break
      }
    }
    // 如果没有命名的偏枯类型，给一个通用偏枯
    if (!entries.some((e) => e.priority === 2) && maxForce >= 1.6 * avg) {
      entries.push({
        type: '2e_全偏枯',
        priority: 2,
        trigger: `最弱元素≤0.35×avg，最旺元素≥1.6×avg`,
      })
    }
  }

  // ── 优先级 3: 偏堵类 ──
  if (entries.length < 3) {
    const dudType = findDudType(tenGods, dmForce)
    if (dudType) {
      entries.push(dudType)
    }
  }

  // ── 优先级 4: 5a 散乱 ──
  const inMidRange = forces.every((f) => f >= 0.5 * avg && f <= 1.4 * avg)
  const hasMainAxis = detectMainAxis(forceReport, flowLinks)
  if (inMidRange && !hasMainAxis && blockedCount >= 1 && entries.length < 3) {
    entries.push({
      type: '5a_散乱',
      priority: 4,
      trigger: '各元素在0.5-1.4×avg，无主轴，有链路堵塞',
    })
  }

  // ── 优先级 5: 1b 起伏 ──
  if (allAboveHalf && allFlowing && hasMainAxis && entries.length < 3) {
    entries.push({
      type: '1b_起伏',
      priority: 5,
      trigger: `全≥0.5×avg，链路全通，有主轴`,
    })
  }

  // ── 优先级 6: 1a 周流 ──
  if (allAbove06 && allFlowing && maxBelow14 && entries.length < 3) {
    entries.push({
      type: '1a_周流',
      priority: 6,
      trigger: `全≥0.6×avg，链路全通，最旺≤1.4×avg`,
    })
  }

  // 如果没有分类，给默认
  if (entries.length === 0) {
    entries.push({
      type: '1b_起伏',
      priority: 5,
      trigger: '默认分类',
    })
  }

  // 最多 3 段
  const primaryTypes = entries.slice(0, 3)

  return {
    primaryTypes,
    mainAxis: hasMainAxis ? describeMainAxis(forceReport, flowLinks) : null,
    overallTone: buildOverallTone(primaryTypes, forceReport),
    yinYangLayer: '阴阳均衡', // 由 factPackBuilder 覆盖
  }
}

// ── 辅助函数 ──

function findDualWar(fr: ElementForceReport): string[] {
  const avg = fr.average
  const controlling: [ElementType, ElementType][] = [
    ['金', '木'], ['木', '土'], ['土', '水'], ['水', '火'], ['火', '金'],
  ]
  const pairs: string[] = []
  for (const [ctrl, victim] of controlling) {
    const cForce = fr.forces[ctrl].force
    const vForce = fr.forces[victim].force
    if (cForce >= 1.3 * avg && vForce >= 1.3 * avg) {
      const gap = Math.abs(cForce - vForce) / Math.max(cForce, vForce)
      if (gap < 0.25) {
        pairs.push(`${ctrl}${victim}对峙`)
      }
    }
  }
  return pairs
}

interface ElementCombo {
  type: FlowType
  name: string
  force: number
}

function computeElementCombos(fr: ElementForceReport): ElementCombo[] {
  const combos: ElementCombo[] = [
    { type: '2a_火土偏枯', name: '火土', force: fr.forces['火'].force + fr.forces['土'].force },
    { type: '2b_金水偏枯', name: '金水', force: fr.forces['金'].force + fr.forces['水'].force },
    { type: '2c_木火偏枯', name: '木火', force: fr.forces['木'].force + fr.forces['火'].force },
    { type: '2d_水土偏枯', name: '水土', force: fr.forces['水'].force + fr.forces['土'].force },
  ]
  combos.sort((a, b) => b.force - a.force)
  return combos
}

function elementAtMin(fr: ElementForceReport): string {
  let minEl = '金'
  let minVal = Infinity
  for (const e of ALL_ELEMENTS) {
    if (fr.forces[e].force < minVal) {
      minVal = fr.forces[e].force
      minEl = e
    }
  }
  return minEl
}

function findDudType(tenGods: TenGodDistribution, dmForce: number): FlowTypeEntry | null {
  const threshold = 1.5 * dmForce
  if (tenGods.yinStar >= threshold) {
    return { type: '3a_印星过旺', priority: 3, trigger: `印星${tenGods.yinStar.toFixed(2)}≥1.5×日主力${dmForce.toFixed(2)}` }
  }
  if (tenGods.biJie >= threshold) {
    return { type: '3b_比劫过旺', priority: 3, trigger: `比劫${tenGods.biJie.toFixed(2)}≥1.5×日主力${dmForce.toFixed(2)}` }
  }
  if (tenGods.shiShang >= threshold) {
    return { type: '3c_食伤过旺', priority: 3, trigger: `食伤${tenGods.shiShang.toFixed(2)}≥1.5×日主力${dmForce.toFixed(2)}` }
  }
  const caiGuan = tenGods.cai + tenGods.guanSha
  if (caiGuan >= threshold) {
    return { type: '3d_财官过旺', priority: 3, trigger: `财官${caiGuan.toFixed(2)}≥1.5×日主力${dmForce.toFixed(2)}` }
  }
  return null
}

function detectMainAxis(fr: ElementForceReport, links: FlowLink[]): boolean {
  const avg = fr.average
  // 主轴：存在一个 ≥ 1.3×avg 的元素，且从它开始的相生链是连通的
  for (const e of ALL_ELEMENTS) {
    if (fr.forces[e].force >= 1.3 * avg) {
      // 检查从这个元素出发的链路是否流通
      const outLink = links.find((l) => l.from === e)
      if (outLink && outLink.status === 'flowing') return true
    }
  }
  return false
}

function describeMainAxis(fr: ElementForceReport, links: FlowLink[]): string {
  const avg = fr.average
  const dominant = ALL_ELEMENTS.find((e) => fr.forces[e].force >= 1.3 * avg)
  if (dominant) {
    const outLink = links.find((l) => l.from === dominant)
    if (outLink) return `${dominant}→${outLink.to}主轴`
    return `${dominant}主导`
  }
  return '无明显主轴'
}

function buildOverallTone(types: FlowTypeEntry[], fr: ElementForceReport): string {
  if (types.length === 0) return '平衡流通'
  const mainType = types[0].type
  if (mainType.startsWith('1')) return '周流通畅，五行循环良好'
  if (mainType.startsWith('2')) return '五行偏枯，某些元素过强或过弱'
  if (mainType.startsWith('3')) return '十神偏堵，某类十神过旺影响命局'
  if (mainType === '4a_双行交战') return '双行对峙，力量僵持'
  if (mainType === '5a_散乱') return '五行散乱，缺乏流通主轴'
  return '命局结构待评估'
}
