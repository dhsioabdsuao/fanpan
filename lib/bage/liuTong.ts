// ── 五行流通诊断（《滴天髓》原文·任铁樵注）──
//
// “何处起根源？流到何方住？”
// 从最强五行出发，沿相生顺序检查每一环的流转。
// 若遇强弱断崖（前一环远强于下一环），则气堵于此。
// 堵点之后的弱环即通关用神——补之则流通复畅。

import type { BaziResult, ElementType } from '@/types/bazi'
import { getHiddenStemsSpec, getStemElement } from './helpers'

// ── 常量 ──

const GENERATING: Record<ElementType, ElementType> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const ELEMENT_ORDER: ElementType[] = ['木', '火', '土', '金', '水']

// ── 返回类型 ──

export interface LiuTongResult {
  /** 源头五行（命局中力量最强的五行） */
  source: ElementType
  /** 堵点五行（气在此处受阻）。若流通顺畅则为 null */
  blockage: ElementType | null
  /** 通关用神（需补的五行以恢复流转）。若流通顺畅则为 null */
  tongGuan: ElementType | null
  /** 流通诊断描述文本 */
  description: string
}

// ── 内部：统计五行力量（天干 + 所有地支藏干）──

function countAllElements(bazi: BaziResult): Record<ElementType, number> {
  const { pillars } = bazi
  const counts: Record<ElementType, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  // 四柱天干
  const stems = [pillars.year.stem, pillars.month.stem, bazi.dayMaster, pillars.hour.stem]
  for (const s of stems) counts[getStemElement(s)]++

  // 四柱地支藏干
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
  for (const b of branches) {
    for (const hs of getHiddenStemsSpec(b)) counts[getStemElement(hs)]++
  }

  return counts
}

// ── 主入口 ──

/**
 * 诊断命局五行流通状态。
 * 沿相生环（木→火→土→金→水→木）检查强弱断崖，
 * 找到气堵之处及通关用神。
 */
export function analyzeWuXingLiuTong(bazi: BaziResult): LiuTongResult {
  const counts = countAllElements(bazi)

  // 找源头：力量最强的五行（平局取第一个）
  let source: ElementType = '木'
  let maxCount = 0
  for (const el of ELEMENT_ORDER) {
    if (counts[el] > maxCount) {
      maxCount = counts[el]
      source = el
    }
  }

  // 沿相生环找最大正落差（前一环远强于后一环 = 强弱断崖）
  let blockage: ElementType | null = null
  let tongGuan: ElementType | null = null
  let maxDrop = 0

  for (const el of ELEMENT_ORDER) {
    const next = GENERATING[el]
    const drop = counts[el] - counts[next]
    // 只有正向落差（当前强 → 下一弱）且落差≥2 且下一环≤2 才算堵
    if (drop >= 2 && counts[next] <= 2 && drop > maxDrop) {
      maxDrop = drop
      blockage = el
      tongGuan = next
    }
  }

  if (blockage && tongGuan) {
    const nextAfter = GENERATING[tongGuan]
    const desc = `源头为${source}（${counts[source]}），气行至${blockage}（${counts[blockage]}）→${tongGuan}（${counts[tongGuan]}）时断崖跌落，${tongGuan}气枯竭难接。宜补${tongGuan}通关，引${blockage}之气下注${nextAfter}，恢复流转。`
    return { source, blockage, tongGuan, description: desc }
  }

  return {
    source,
    blockage: null,
    tongGuan: null,
    description: '五行流通顺畅，气机生生不息，无显著堵点。',
  }
}
