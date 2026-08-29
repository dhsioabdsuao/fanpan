import type { BaziResult } from '@/types/bazi'
import { getTenGod, getStemElement } from '@/lib/bazi-utils'
import { getHiddenStemsSpec, detectAllHe } from '@/lib/bage/helpers'

const BANG_ZHU = new Set(['比肩', '劫财', '正印', '偏印'])

export interface StrengthResult {
  level: '身强' | '中和' | '身弱'
  deLing: boolean
  deDi: boolean
  deShi: '得势' | '失势' | '均衡'
  reason: string
}

// ── 季节划分 ──
type Season = '春' | '夏' | '秋' | '冬'

function getSeason(monthBranch: string): Season {
  if (['寅', '卯', '辰'].includes(monthBranch)) return '春'
  if (['巳', '午', '未'].includes(monthBranch)) return '夏'
  if (['申', '酉', '戌'].includes(monthBranch)) return '秋'
  return '冬' // 亥子丑
}

// ── 旺相休囚死（季节五行强度）──【强弱规格书 v1.1 §1.1】
// 春季(木旺): 木旺 火相 土死 金囚 水休
// 夏季(火旺): 火旺 土相 金死 水囚 木休
// 秋季(金旺): 金旺 水相 木死 火囚 土休
// 冬季(水旺): 水旺 木相 火死 土囚 金休
// 分值【本系统决策】:旺=3 相=2 休=1 囚=0.5 死=0
const SEASON_STRENGTH: Record<Season, Record<string, number>> = {
  '春': { '木': 3, '火': 2, '水': 1, '金': 0.5, '土': 0 },
  '夏': { '火': 3, '土': 2, '木': 1, '水': 0.5, '金': 0 },
  '秋': { '金': 3, '水': 2, '土': 1, '火': 0.5, '木': 0 },
  '冬': { '水': 3, '木': 2, '金': 1, '土': 0.5, '火': 0 },
}

/** 得令:季节分 ≥ 2(旺/相)即算【本系统决策】 */
const DE_LING_SEASON_SCORE = 2

// ── 强根位置（禄/旺/长生）──
const LU_POSITIONS: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
}

const WANG_POSITIONS: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
  '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
}

const CHANG_SHENG: Record<string, string> = {
  '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅',
  '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯',
}

/** 天干在地支是否有强根（禄/帝旺/长生）vs 普通根（余气/中气） */
function classifyRoots(
  dayMasterElement: string,
  branches: string[],
): { strongCount: number; weakCount: number } {
  let strong = 0
  let weak = 0
  for (const branch of branches) {
    const hidden = getHiddenStemsSpec(branch)
    for (let i = 0; i < hidden.length; i++) {
      const stem = hidden[i]
      if (getStemElement(stem) !== dayMasterElement) continue
      // 检查是否为同五行天干的禄/旺/长生位
      const isStrong = Object.entries(LU_POSITIONS).some(
        ([gan, pos]) => getStemElement(gan) === dayMasterElement && pos === branch,
      ) || Object.entries(WANG_POSITIONS).some(
        ([gan, pos]) => getStemElement(gan) === dayMasterElement && pos === branch,
      ) || Object.entries(CHANG_SHENG).some(
        ([gan, pos]) => getStemElement(gan) === dayMasterElement && pos === branch,
      )
      if (isStrong) {
        strong++
      } else if (i === 0) {
        // 本气非同五行禄旺 → 算弱根
        weak++
      } else {
        // 中气/余气 → 微根（不算）
      }
    }
  }
  return { strongCount: strong, weakCount: weak }
}

// ── 合会局对五行平衡的调整 ──
interface HeAdjustment {
  element: string
  bonus: number // 额外计为该元素的份数
}

function getHeAdjustments(branches: string[]): HeAdjustment[] {
  const allHe = detectAllHe(branches)
  const adjustments: HeAdjustment[] = []
  for (const he of allHe) {
    if (he.type === '三会') {
      // 三会局极强，大幅加权重
      adjustments.push({ element: he.element, bonus: 3 })
    } else if (he.type === '三合') {
      // 三合局强
      adjustments.push({ element: he.element, bonus: 2 })
    }
    // 六合不加权（力量较小，已在地支六合中体现）
  }
  return adjustments
}

export function determineStrength(bazi: BaziResult): StrengthResult {
  const { pillars, dayMaster, dayMasterElement } = bazi
  const monthBranch = pillars.month.branch
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  const season = getSeason(monthBranch)

  // ── 1.1 得令：季节旺相休囚死 ──
  const seasonalScore = SEASON_STRENGTH[season][dayMasterElement] ?? 0
  // 月支本气十神是否为帮扶（印/比）→ 额外加分
  const hidden = getHiddenStemsSpec(monthBranch)
  const benQi = hidden[0]
  const benQiTenGod = getTenGod(dayMaster, benQi)
  const hasBenQiHelp = BANG_ZHU.has(benQiTenGod)
  // 得令 = 季节分 ≥ 2（旺/相）或本气帮扶【强弱规格书 v1.1 §1.1】
  const deLing = seasonalScore >= DE_LING_SEASON_SCORE || hasBenQiHelp

  // ── 1.2 得地：区分强根/弱根【强弱规格书 v1.1 §1.2】──
  const { strongCount, weakCount } = classifyRoots(dayMasterElement, branches)
  // 有强根 → 得地；有 ≥2 弱根 → 也算得地【本系统决策】
  const DE_DI_WEAK_ROOT_MIN = 2
  const deDi = strongCount >= 1 || weakCount >= DE_DI_WEAK_ROOT_MIN

  // ── 1.3 得势：加权计数帮扶 vs 克泄耗【强弱规格书 v1.1 §1.3】──
  const counted: { char: string; source: string; tenGod: string; weight: number }[] = []

  // 天干（年/月/时）权重【本系统决策】:月干为纲,取 1.5;年干/时干 1.0
  const STEM_WEIGHTS = { year: 1.0, month: 1.5, hour: 1.0 }
  const stemSources = [
    { char: pillars.year.stem, label: '年干', weight: STEM_WEIGHTS.year },
    { char: pillars.month.stem, label: '月干', weight: STEM_WEIGHTS.month },
    { char: pillars.hour.stem, label: '时干', weight: STEM_WEIGHTS.hour },
  ]
  for (const { char, label, weight } of stemSources) {
    counted.push({ char, source: label, tenGod: getTenGod(dayMaster, char), weight })
  }

  // 地支藏干 — 权重：本气 > 中气 > 余气；日支 > 月支 > 时支 > 年支【本系统决策】
  const branchLabels = ['年支', '月支', '日支', '时支']
  const BRANCH_POSITION_WEIGHTS = [0.5, 0.8, 1.0, 0.6] // 日支最重要，月支其次
  const QI_WEIGHTS = [1.0, 0.6, 0.3] // 本气 > 中气 > 余气

  for (let i = 0; i < branches.length; i++) {
    const hs = getHiddenStemsSpec(branches[i])
    for (let j = 0; j < hs.length; j++) {
      const weight = BRANCH_POSITION_WEIGHTS[i] * QI_WEIGHTS[Math.min(j, QI_WEIGHTS.length - 1)]
      counted.push({
        char: hs[j],
        source: `${branchLabels[i]}藏干`,
        tenGod: getTenGod(dayMaster, hs[j]),
        weight,
      })
    }
  }

  // ── 合会局调整 ──
  const heAdjustments = getHeAdjustments(branches)
  for (const adj of heAdjustments) {
    // 合会局形成的五行对日主的十神
    const tenGod = getTenGod(dayMaster, adj.element)
    // 将该五行作为额外虚拟字加入计数【本系统决策】:帮扶方加成 ×1.5
    const isBang = BANG_ZHU.has(tenGod)
    const HE_BANG_MULTIPLIER = 1.5
    counted.push({
      char: `[${adj.element}局]`,
      source: '合会局',
      tenGod,
      weight: adj.bonus * (isBang ? HE_BANG_MULTIPLIER : 1.0),
    })
  }

  // 汇总帮扶 vs 克泄耗（加权）
  let bangWeight = 0
  let keWeight = 0
  const bangList: string[] = []
  const keList: string[] = []

  for (const { char, source, tenGod, weight } of counted) {
    const label = `${source}${char}(${tenGod})`
    if (BANG_ZHU.has(tenGod)) {
      bangWeight += weight
      bangList.push(label)
    } else {
      keWeight += weight
      keList.push(label)
    }
  }

  // 得势判断：加权帮扶 vs 克泄耗【强弱规格书 v1.1 §1.3】
  let deShi: '得势' | '失势' | '均衡'
  // 帮扶显著多于克泄耗(>20%)才算得势【本系统决策】
  const DE_SHI_MARGIN = 1.2
  if (bangWeight > keWeight * DE_SHI_MARGIN) {
    deShi = '得势'
  } else if (keWeight > bangWeight * DE_SHI_MARGIN) {
    deShi = '失势'
  } else {
    deShi = '均衡'
  }

  // ── 第二章 合成三档【强弱规格书 v1.1 §2】──
  // 用加权比例辅助判断
  const ratio = keWeight > 0 ? bangWeight / keWeight : (bangWeight > 0 ? 999 : 1)

  // 加权比例分档阈值【本系统决策】
  const RATIO_STRONG_LOW = 0.6   // 得令得地时:比值 ≥ 0.6 判身强
  const RATIO_WEAK_HIGH = 1.5    // 失令失地时:比值 ≤ 1.5 判身弱
  const RATIO_STRONG_MID = 1.3   // 得地得势时:比值 ≥ 1.3 判身强
  const RATIO_STRONG_HIGH = 1.5  // 兜底:比值 ≥ 1.5 判身强
  const RATIO_WEAK_LOW = 0.6     // 兜底:比值 ≤ 0.6 判身弱
  // 模糊带:比值落在阈值 ±0.05 内归「中和」,消灭阈值悬线【本系统决策】
  const RATIO_BAND = 0.05

  let level: '身强' | '中和' | '身弱'

  // 三要素权重：令 > 地 > 势
  // 得令=季节+月令最根本；得地=根基；得势=数量优势
  if (deLing && deDi && deShi === '得势') {
    // 三者全帮 → 身强
    level = '身强'
  } else if (!deLing && !deDi && deShi === '失势') {
    // 三者全不帮 → 身弱
    level = '身弱'
  } else if (deLing && deDi) {
    // 得令+得地 → 根基扎实，即使得势不占优也偏强
    // 但若加权比例过低（克泄耗远大于帮扶），则降为中和;阈值 ±0.05 模糊带归中和
    level = ratio >= RATIO_STRONG_LOW + RATIO_BAND ? '身强' : '中和'
  } else if (!deLing && !deDi) {
    // 失令+失地 → 根基全无，即使得势占优也偏弱;阈值 ±0.05 模糊带归中和
    level = ratio <= RATIO_WEAK_HIGH - RATIO_BAND ? '身弱' : '中和'
  } else if (deLing && deShi === '得势') {
    // 得令+得势（失地但有根在别处）
    level = '身强'
  } else if (deDi && deShi === '得势') {
    // 得地+得势（失令但根基和数量占优）;阈值 ±0.05 模糊带归中和
    level = ratio >= RATIO_STRONG_MID + RATIO_BAND ? '身强' : '中和'
  } else {
    // 其余组合用加权比例;阈值 ±0.05 模糊带归中和
    if (ratio >= RATIO_STRONG_HIGH + RATIO_BAND) {
      level = '身强'
    } else if (ratio <= RATIO_WEAK_LOW - RATIO_BAND) {
      level = '身弱'
    } else {
      level = '中和'
    }
  }

  // ── 理由 ──
  const lingLabel = deLing ? '得令' : '失令'
  const seasonNames: Record<Season, string> = { '春': '春', '夏': '夏', '秋': '秋', '冬': '冬' }
  const seasonName = seasonNames[season]
  const seasonalDesc = seasonalScore >= 2
    ? `${seasonName}季${dayMasterElement}${seasonalScore >= 3 ? '旺' : '相'}`
    : seasonalScore >= 1
      ? `${seasonName}季${dayMasterElement}休`
      : `${seasonName}季${dayMasterElement}${seasonalScore > 0 ? '囚' : '死'}`
  const lingDetail = deLing
    ? `${seasonalDesc},月支${monthBranch}本气${benQi}(${benQiTenGod})${hasBenQiHelp ? '为帮扶' : ''}`
    : `${seasonalDesc},月支${monthBranch}本气${benQi}(${benQiTenGod})为克泄耗`

  const diLabel = deDi ? '得地(有根)' : '失地(无根)'
  const diDetail = deDi
    ? `强根${strongCount}处${weakCount > 0 ? `,弱根${weakCount}处` : ''}`
    : '地支无日主同五行之强根'

  const shiDetail = `帮扶加权${bangWeight.toFixed(1)}[${bangList.join(',')}] vs 克泄耗加权${keWeight.toFixed(1)}[${keList.join(',')}]`
  if (heAdjustments.length > 0) {
    const heDesc = heAdjustments.map(h => `${h.element}局`).join('、')
    // shiDetail already has合会局 via counted; just note it
  }

  const parts: string[] = []
  parts.push(`${lingLabel}: ${lingDetail}`)
  parts.push(`${diLabel}: ${diDetail}`)
  parts.push(`${deShi}: ${shiDetail}`)

  if (level === '身强') {
    parts.push('→ 身强')
  } else if (level === '身弱') {
    parts.push('→ 身弱')
  } else {
    parts.push('→ 中和')
  }

  const reason = parts.join('; ')

  return { level, deLing, deDi, deShi, reason }
}
