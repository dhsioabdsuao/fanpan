import type { BaziResult } from '@/types/bazi'
import { getTenGod, getStemElement } from '@/lib/bazi-utils'
import { getHiddenStemsSpec } from '@/lib/bage/helpers'

const BANG_ZHU = new Set(['比肩', '劫财', '正印', '偏印'])

export interface StrengthResult {
  level: '身强' | '中和' | '身弱'
  deLing: boolean
  deDi: boolean
  deShi: '得势' | '失势' | '均衡'
  reason: string
}

export function determineStrength(bazi: BaziResult): StrengthResult {
  const { pillars, dayMaster, dayMasterElement } = bazi
  const monthBranch = pillars.month.branch
  const hidden = getHiddenStemsSpec(monthBranch)
  const benQi = hidden[0]

  // ── 1.1 得令：月支本气十神是否为帮扶 ──
  const benQiTenGod = getTenGod(dayMaster, benQi)
  const deLing = BANG_ZHU.has(benQiTenGod)

  // ── 1.2 得地：四地支藏干有无日主同五行 ──
  const allBranches = [
    pillars.year.branch,
    pillars.month.branch,
    pillars.day.branch,
    pillars.hour.branch,
  ]
  let deDi = false
  const allHiddenStems: string[] = []
  for (const branch of allBranches) {
    const hs = getHiddenStemsSpec(branch)
    allHiddenStems.push(...hs)
    if (!deDi) {
      deDi = hs.some((s) => getStemElement(s) === dayMasterElement)
    }
  }

  // ── 1.3 得势：全局帮扶 vs 克泄耗计数 ──
  const counted: { char: string; source: string; tenGod: string }[] = []

  // 天干：年、月、时（日干=日主自身，不参与计数）
  const stemSources = [
    { char: pillars.year.stem, label: '年干' },
    { char: pillars.month.stem, label: '月干' },
    { char: pillars.hour.stem, label: '时干' },
  ]
  for (const { char, label } of stemSources) {
    counted.push({ char, source: label, tenGod: getTenGod(dayMaster, char) })
  }

  // 地支藏干：全部
  const branchLabels = ['年支', '月支', '日支', '时支']
  for (let i = 0; i < allBranches.length; i++) {
    const hs = getHiddenStemsSpec(allBranches[i])
    for (const s of hs) {
      counted.push({ char: s, source: `${branchLabels[i]}藏干`, tenGod: getTenGod(dayMaster, s) })
    }
  }

  let bangCount = 0
  let keCount = 0
  const bangList: string[] = []
  const keList: string[] = []

  for (const { char, source, tenGod } of counted) {
    if (BANG_ZHU.has(tenGod)) {
      bangCount++
      bangList.push(`${source}${char}(${tenGod})`)
    } else {
      keCount++
      keList.push(`${source}${char}(${tenGod})`)
    }
  }

  let deShi: '得势' | '失势' | '均衡'
  if (bangCount > keCount) {
    deShi = '得势'
  } else if (bangCount < keCount) {
    deShi = '失势'
  } else {
    deShi = '均衡'
  }

  // ── 第二章 合成三档 ──
  let level: '身强' | '中和' | '身弱'
  if (deLing && deDi && deShi === '得势') {
    level = '身强'
  } else if (!deLing && !deDi && deShi === '失势') {
    level = '身弱'
  } else {
    level = '中和'
  }

  // ── 理由 ──
  const lingLabel = deLing ? '得令' : '失令'
  const diLabel = deDi ? '得地(有根)' : '失地(无根)'
  const lingDetail = deLing
    ? `月支${monthBranch}本气${benQi}(${benQiTenGod})为帮扶`
    : `月支${monthBranch}本气${benQi}(${benQiTenGod})为克泄耗`

  const diDetail = deDi
    ? '地支藏干有日主同五行之根'
    : '地支藏干无日主同五行之字'

  const shiDetail = `帮扶[${bangList.join(',')}] vs 克泄耗[${keList.join(',')}]`

  const parts: string[] = []
  parts.push(`${lingLabel}: ${lingDetail}`)
  parts.push(`${diLabel}: ${diDetail}`)
  parts.push(`${deShi}: ${shiDetail}`)

  if (level === '身强') {
    parts.push('→ 身强: 得令且得地且得势，三者全帮')
  } else if (level === '身弱') {
    parts.push('→ 身弱: 失令且无根且失势，三者全不帮')
  } else {
    parts.push('→ 中和: 三要素不全一致')
  }

  const reason = parts.join('; ')

  return { level, deLing, deDi, deShi, reason }
}
