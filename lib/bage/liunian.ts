import { isBranchClash, getSixHePartner, getFiveComboPartner } from './helpers'
import { getStemElement } from '@/lib/bazi-utils'

export interface LiuNianAnnotation {
  type: '天合地合' | '天克地冲' | '伏吟' | '岁运并临'
  label: string
  detail: string
}

const KE_MAP: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

function isElementKe(a: string, b: string): boolean {
  return KE_MAP[getStemElement(a)] === getStemElement(b)
    || KE_MAP[getStemElement(b)] === getStemElement(a)
}

const PILLAR_RELATION: Record<string, string> = {
  '年柱': '长辈、祖业',
  '月柱': '父母、事业、兄弟宫',
  '日柱': '自身、婚姻宫',
  '时柱': '子女、下属、晚年',
}

/**
 * 检查流年干支与四柱、大运的特殊关系，返回注解列表
 */
export function getLiuNianAnnotations(params: {
  liuNianGanZhi: string
  daYunGanZhi: string
  yearGanZhi: string
  monthGanZhi: string
  dayGanZhi: string
  hourGanZhi: string
}): LiuNianAnnotation[] {
  const { liuNianGanZhi, daYunGanZhi, yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi } = params
  const lnStem = liuNianGanZhi[0]
  const lnBranch = liuNianGanZhi[1]
  const annotations: LiuNianAnnotation[] = []

  const pillars: { name: string; gz: string }[] = [
    { name: '年柱', gz: yearGanZhi },
    { name: '月柱', gz: monthGanZhi },
    { name: '日柱', gz: dayGanZhi },
    { name: '时柱', gz: hourGanZhi },
  ]

  // ── 天合地合（流年与任一柱） ──
  for (const p of pillars) {
    const pStem = p.gz[0]
    const pBranch = p.gz[1]
    if (
      getFiveComboPartner(lnStem) === pStem &&
      getSixHePartner(lnBranch) === pBranch
    ) {
      // 天合地合是典型的“天地鸳鸯合”，代表因缘际会、环境变化或合作关系加强
      annotations.push({
        type: '天合地合',
        label: `${p.name}天合地合`,
        detail: `流年${liuNianGanZhi}与${p.name}${p.gz}天合地合（${lnStem}${pStem}合、${lnBranch}${pBranch}合），多应机遇、合作或${PILLAR_RELATION[p.name]}方面的重要变化。`,
      })
    }
  }

  // ── 天克地冲（流年与任一柱） ──
  for (const p of pillars) {
    const pStem = p.gz[0]
    const pBranch = p.gz[1]
    if (isElementKe(lnStem, pStem) && isBranchClash(lnBranch, pBranch)) {
      // 天克地冲又称“反吟”，是岁运中最激烈的冲克，主变动、压力
      annotations.push({
        type: '天克地冲',
        label: `${p.name}天克地冲`,
        detail: `流年${liuNianGanZhi}与${p.name}${p.gz}天克地冲（${lnStem}${pStem}相克、${lnBranch}${pBranch}相冲），${PILLAR_RELATION[p.name]}方面易有大的变动或压力。`,
      })
    }
  }

  // ── 伏吟（流年与任一柱相同） ──
  for (const p of pillars) {
    if (liuNianGanZhi === p.gz) {
      annotations.push({
        type: '伏吟',
        label: `伏吟${p.name}`,
        detail: `流年${liuNianGanZhi}与${p.name}${p.gz}伏吟（干支完全相同），${PILLAR_RELATION[p.name]}方面易有反复或停滞，需沉住气。`,
      })
    }
  }

  // ── 岁运并临 ──
  if (liuNianGanZhi === daYunGanZhi) {
    annotations.push({
      type: '岁运并临',
      label: '岁运并临',
      detail: `流年${liuNianGanZhi}与大运${daYunGanZhi}干支相同（岁运并临），岁运叠加，吉凶力量加倍。`,
    })
  }

  return annotations
}
