import type { BaziResult } from '@/types/bazi'
import type { ConflictsHarmoniesReport } from './types'

const SIX_CLASHES: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const THREE_PUNISHMENTS_DEFS: { name: string; branches: string[] }[] = [
  { name: '寅巳申三刑', branches: ['寅', '巳', '申'] },
  { name: '丑戌未三刑', branches: ['丑', '戌', '未'] },
  { name: '子卯刑', branches: ['子', '卯'] },
  { name: '午午自刑', branches: ['午', '午'] },
  { name: '辰辰自刑', branches: ['辰', '辰'] },
  { name: '酉酉自刑', branches: ['酉', '酉'] },
  { name: '亥亥自刑', branches: ['亥', '亥'] },
]

const SIX_COMBOS: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

const THREE_UNIONS: { name: string; branches: [string, string, string] }[] = [
  { name: '申子辰合水', branches: ['申', '子', '辰'] },
  { name: '亥卯未合木', branches: ['亥', '卯', '未'] },
  { name: '寅午戌合火', branches: ['寅', '午', '戌'] },
  { name: '巳酉丑合金', branches: ['巳', '酉', '丑'] },
]

export function computeConflictsAndHarmonies(bazi: BaziResult): ConflictsHarmoniesReport {
  const branches = [
    bazi.pillars.year.branch,
    bazi.pillars.month.branch,
    bazi.pillars.day.branch,
    bazi.pillars.hour.branch,
  ]

  // ── 六冲 ──
  const sixClashes: string[] = []
  const branchSet = new Set(branches)

  for (const [a, b] of SIX_CLASHES) {
    if (branchSet.has(a) && branchSet.has(b)) {
      sixClashes.push(`${a}${b}冲`)
    }
  }

  // ── 三刑 ──
  const threePunishments: string[] = []
  for (const def of THREE_PUNISHMENTS_DEFS) {
    const needed = new Set(def.branches)
    // Count occurrences of each needed branch
    const available = branches.filter((b) => needed.has(b))
    // Check if all needed branches appear sufficient times
    const match = [...needed].every((b) => {
      const needCount = def.branches.filter((x) => x === b).length
      const haveCount = available.filter((x) => x === b).length
      return haveCount >= needCount
    })
    if (match) {
      threePunishments.push(def.name)
    }
  }

  // ── 六合 ──
  const sixCombinations: string[] = []
  for (const [a, b] of SIX_COMBOS) {
    if (branchSet.has(a) && branchSet.has(b)) {
      sixCombinations.push(`${a}${b}合`)
    }
  }

  // ── 三合局 ──
  const threeUnions: string[] = []
  const halfUnions: string[] = []
  const archUnions: string[] = []

  for (const { name, branches: trio } of THREE_UNIONS) {
    const [a, b, c] = trio
    const hasA = branchSet.has(a)
    const hasB = branchSet.has(b)
    const hasC = branchSet.has(c)
    const count = (hasA ? 1 : 0) + (hasB ? 1 : 0) + (hasC ? 1 : 0)

    if (count === 3) {
      threeUnions.push(name)
    } else if (count === 2) {
      // 半合 or 拱合
      if (hasA && hasB) {
        // a-b 相邻 → 半合；a-b 隔一位 → 拱合
        const idxA = trio.indexOf(a)
        const idxB = trio.indexOf(b)
        if (Math.abs(idxA - idxB) === 1) {
          halfUnions.push(`${a}${b}半合`)
        } else {
          // 拱合：两端隔一位夹中间
          const middle = trio[1]
          archUnions.push(`${a}${b}拱${middle}`)
        }
      } else if (hasB && hasC) {
        halfUnions.push(`${b}${c}半合`)
      } else if (hasA && hasC) {
        // a-c: 跳过中间的 b → 拱合
        archUnions.push(`${a}${c}拱${b}`)
      }
    }
  }

  return {
    sixClashes,
    threePunishments,
    sixCombinations,
    threeUnions,
    halfUnions,
    archUnions,
  }
}
