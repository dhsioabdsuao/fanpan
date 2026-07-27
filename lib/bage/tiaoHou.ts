// ── 调候查表（《穷通宝鉴》原文·常用项）──
//
// 结构：Map<dayMaster, Map<monthBranch, tiaoHouList>>
// 依据《穷通宝鉴》徐乐吾评注本，逐月收录十天干调候用神

const TIAO_HOU_TABLE: Map<string, Map<string, string[]>> = new Map()

function set(dayMaster: string, monthBranch: string, gods: string[]) {
  if (!TIAO_HOU_TABLE.has(dayMaster)) {
    TIAO_HOU_TABLE.set(dayMaster, new Map())
  }
  TIAO_HOU_TABLE.get(dayMaster)!.set(monthBranch, gods)
}

// ── 甲木 ──
set('甲', '寅', ['丙', '癸'])
set('甲', '卯', ['庚', '丙', '丁'])
set('甲', '辰', ['庚', '丁', '壬'])
set('甲', '巳', ['癸', '丁', '庚'])
set('甲', '午', ['壬', '庚', '丁'])
set('甲', '未', ['癸', '丁', '壬'])
set('甲', '申', ['庚', '丁', '壬'])
set('甲', '酉', ['庚', '丁', '丙'])
set('甲', '戌', ['庚', '甲', '丁'])
set('甲', '亥', ['庚', '丁', '丙'])
set('甲', '子', ['丁', '庚', '丙'])
set('甲', '丑', ['丁', '庚', '丙'])

// ── 乙木 ──
set('乙', '寅', ['丙', '癸'])
set('乙', '卯', ['丙', '癸'])
set('乙', '辰', ['癸', '丙', '戊'])
set('乙', '巳', ['癸'])
set('乙', '午', ['癸', '丙'])
set('乙', '未', ['癸', '丙'])
set('乙', '申', ['丙', '癸', '己'])
set('乙', '酉', ['癸', '丙', '丁'])
set('乙', '戌', ['癸', '辛'])
set('乙', '亥', ['丙', '戊'])
set('乙', '子', ['丙'])
set('乙', '丑', ['丙'])

// ── 丙火 ──
set('丙', '寅', ['壬', '庚'])
set('丙', '卯', ['壬', '己'])
set('丙', '辰', ['壬', '甲'])
set('丙', '巳', ['壬', '庚', '癸'])
set('丙', '午', ['壬', '庚'])
set('丙', '未', ['壬', '庚'])
set('丙', '申', ['壬', '戊'])
set('丙', '酉', ['壬', '癸'])
set('丙', '戌', ['甲', '壬'])
set('丙', '亥', ['甲', '戊', '庚'])
set('丙', '子', ['甲', '戊', '庚'])
set('丙', '丑', ['壬', '甲'])

// ── 丁火 ──
set('丁', '寅', ['甲', '庚'])
set('丁', '卯', ['庚', '甲'])
set('丁', '辰', ['甲', '庚'])
set('丁', '巳', ['甲', '庚'])
set('丁', '午', ['壬', '庚', '癸'])
set('丁', '未', ['甲', '壬', '庚'])
set('丁', '申', ['甲', '庚', '丙'])
set('丁', '酉', ['甲', '庚', '丙'])
set('丁', '戌', ['甲', '庚', '戊'])
set('丁', '亥', ['甲', '庚'])
set('丁', '子', ['甲', '庚'])
set('丁', '丑', ['甲', '庚'])

// ── 戊土 ──
set('戊', '寅', ['丙', '甲', '癸'])
set('戊', '卯', ['丙', '甲', '癸'])
set('戊', '辰', ['甲', '丙', '癸'])
set('戊', '巳', ['甲', '丙', '癸'])
set('戊', '午', ['壬', '甲', '丙'])
set('戊', '未', ['癸', '丙', '甲'])
set('戊', '申', ['丙', '癸', '甲'])
set('戊', '酉', ['丙', '癸'])
set('戊', '戌', ['甲', '丙', '癸'])
set('戊', '亥', ['甲', '丙'])
set('戊', '子', ['丙', '甲'])
set('戊', '丑', ['丙', '甲'])

// ── 己土 ──
set('己', '寅', ['丙', '庚', '甲'])
set('己', '卯', ['甲', '癸', '丙'])
set('己', '辰', ['丙', '癸', '甲'])
set('己', '巳', ['癸', '丙'])
set('己', '午', ['癸', '丙'])
set('己', '未', ['癸', '丙'])
set('己', '申', ['丙', '癸'])
set('己', '酉', ['丙', '癸'])
set('己', '戌', ['甲', '丙', '癸'])
set('己', '亥', ['丙', '甲', '戊'])
set('己', '子', ['丙', '甲', '戊'])
set('己', '丑', ['丙', '甲', '戊'])

// ── 庚金 ──
set('庚', '寅', ['丙', '戊', '甲'])
set('庚', '卯', ['丁', '甲', '丙'])
set('庚', '辰', ['甲', '丁', '壬'])
set('庚', '巳', ['壬', '丙', '戊'])
set('庚', '午', ['壬', '癸'])
set('庚', '未', ['丁', '甲'])
set('庚', '申', ['丁', '甲'])
set('庚', '酉', ['丁', '甲', '丙'])
set('庚', '戌', ['甲', '壬'])
set('庚', '亥', ['丁', '丙'])
set('庚', '子', ['丙', '甲'])
set('庚', '丑', ['丙', '丁', '甲'])

// ── 辛金 ──
set('辛', '寅', ['己', '壬', '庚'])
set('辛', '卯', ['壬', '甲'])
set('辛', '辰', ['壬', '甲'])
set('辛', '巳', ['壬', '甲', '癸'])
set('辛', '午', ['壬', '己', '癸'])
set('辛', '未', ['壬', '庚', '甲'])
set('辛', '申', ['壬', '甲', '戊'])
set('辛', '酉', ['壬', '甲'])
set('辛', '戌', ['壬', '甲'])
set('辛', '亥', ['壬', '丙'])
set('辛', '子', ['丙', '戊', '壬'])
set('辛', '丑', ['丙', '壬', '戊'])

// ── 壬水 ──
set('壬', '寅', ['庚', '丙', '戊'])
set('壬', '卯', ['戊', '辛', '庚'])
set('壬', '辰', ['甲', '庚'])
set('壬', '巳', ['壬', '辛', '庚'])
set('壬', '午', ['癸', '庚', '辛'])
set('壬', '未', ['辛', '甲'])
set('壬', '申', ['戊', '丁'])
set('壬', '酉', ['甲', '庚'])
set('壬', '戌', ['甲', '丙'])
set('壬', '亥', ['戊', '丙', '庚'])
set('壬', '子', ['戊', '丙'])
set('壬', '丑', ['丙', '甲'])

// ── 癸水 ──
set('癸', '寅', ['辛', '丙'])
set('癸', '卯', ['庚', '辛'])
set('癸', '辰', ['丙', '辛', '甲'])
set('癸', '巳', ['辛'])
set('癸', '午', ['庚', '辛', '癸'])
set('癸', '未', ['庚', '辛', '癸'])
set('癸', '申', ['丁'])
set('癸', '酉', ['辛', '丙'])
set('癸', '戌', ['辛', '甲', '壬'])
set('癸', '亥', ['庚', '辛', '戊'])
set('癸', '子', ['丙', '辛'])
set('癸', '丑', ['丙', '丁'])

/**
 * 根据日主和月令查《穷通宝鉴》调候用神。
 * @returns 调候天干列表（可能为空），按原文顺序排列
 */
export function getTiaoHouYongShen(dayMaster: string, monthBranch: string): string[] {
  const inner = TIAO_HOU_TABLE.get(dayMaster)
  if (!inner) return []
  return inner.get(monthBranch) ?? []
}

// ── 五行计数与调候类型判定 ──
// 依据：【本系统算法·基于《穷通宝鉴》调候原理】

import type { BaziResult } from '@/types/bazi'
import { getStemElement, getBranchElement } from '@/lib/bazi-utils'

/**
 * 统计全局（天干 + 地支本气）各五行数量。
 * 天干计4个 + 地支本气计4个 = 8个数据点。
 */
export function countWuXing(bazi: BaziResult): Record<string, number> {
  const count: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
  const p = bazi.pillars
  const stems = [p.year.stem, p.month.stem, p.day.stem, p.hour.stem]
  const branches = [p.year.branch, p.month.branch, p.day.branch, p.hour.branch]
  for (const s of stems) count[getStemElement(s)]++
  for (const b of branches) count[getBranchElement(b)]++
  return count
}

/**
 * 调候类型判定。
 *
 * 火炎土燥：(夏月（巳午未）∧ 水≤1) ∨ (非冬月（亥子丑）∧ 火+土≥5 ∧ 水≤1)
 * 金寒水冷：(冬月（亥子丑）∧ 火≤1) ∨ (非夏月（巳午未）∧ 金+水≥5 ∧ 火≤1)
 * 其他：寒暖适中
 *
 * 安全闸：冬月永不判火炎土燥；夏月永不判金寒水冷。
 */
export function getTiaoHouType(
  bazi: BaziResult,
  wuXingCount?: Record<string, number>,
): '火炎土燥' | '金寒水冷' | '寒暖适中' {
  const cnt = wuXingCount ?? countWuXing(bazi)
  const fire = cnt['火'] ?? 0
  const water = cnt['水'] ?? 0
  const earth = cnt['土'] ?? 0
  const metal = cnt['金'] ?? 0

  const mb = bazi.pillars.month.branch
  const isSummer = ['巳', '午', '未'].includes(mb)
  const isWinter = ['亥', '子', '丑'].includes(mb)

  // 火炎土燥
  if (isSummer && water <= 1) return '火炎土燥'
  if (!isWinter && fire + earth >= 5 && water <= 1) return '火炎土燥'

  // 金寒水冷
  if (isWinter && fire <= 1) return '金寒水冷'
  if (!isSummer && metal + water >= 5 && fire <= 1) return '金寒水冷'

  return '寒暖适中'
}

// ── 调候叙事化 ──

const MONTH_NAMES: Record<string, string> = {
  '寅': '正月', '卯': '二月', '辰': '三月', '巳': '四月',
  '午': '五月', '未': '六月', '申': '七月', '酉': '八月',
  '戌': '九月', '亥': '十月', '子': '十一月', '丑': '十二月',
};

const ELEMENT_ROLE: Record<string, string> = {
  '甲': '疏通', '乙': '柔润', '丙': '暖局', '丁': '温养',
  '戊': '制衡', '己': '润泽', '庚': '锻造成材', '辛': '清润提纯',
  '壬': '淘洗灌溉', '癸': '雨露滋润',
};

/**
 * 生成调候叙事。
 * 根据日主+月令的气候类型、调候用神、命局五行现状，生成 2-3 句解释。
 * @returns 叙事文本，调候用神为空时返回 null
 */
export function getTiaoHouNarrative(bazi: BaziResult): string | null {
  const gods = getTiaoHouYongShen(bazi.dayMaster, bazi.pillars.month.branch);
  if (gods.length === 0) return null;

  const climate = getTiaoHouType(bazi);
  const cnt = countWuXing(bazi);
  const monthName = MONTH_NAMES[bazi.pillars.month.branch] || `${bazi.pillars.month.branch}月`;
  const godElements = [...new Set(gods.map((g) => getStemElement(g)))];

  // 用神中哪些五行在命局里已有、哪些缺失
  const has: string[] = [];
  const miss: string[] = [];
  for (const el of godElements) {
    if ((cnt[el] ?? 0) >= 1) has.push(el);
    else miss.push(el);
  }

  // 用神天干的作用描述
  const roleParts = gods.map((g) => {
    const el = getStemElement(g);
    return `${g}${el}（${ELEMENT_ROLE[g] || '调节'}）`;
  });

  // 现状判断
  let statusText = '';
  if (has.length === godElements.length && has.length >= 2) {
    statusText = `好消息——你命局中${has.join('、')}气不弱，调候的条件已经具备大半。`;
  } else if (has.length > 0) {
    statusText = `你命局中已有${has.join('、')}，但${miss.length > 0 ? `还缺${miss.join('、')}——这是你最有价值的补充方向` : '还需进一步强化'}。`;
  } else {
    statusText = `你命局中这些元素都偏弱——需从大运流转、外部环境或合作搭档中补足。`;
  }

  // 气候叙事
  if (climate === '火炎土燥') {
    return `你生于${monthName}，命局偏燥——火土过旺而水气不足，如盛夏久旱的花园。《穷通宝鉴》认为${bazi.dayMaster}日主在此月需${roleParts.join('、')}来降温润局。${statusText}`;
  }
  if (climate === '金寒水冷') {
    return `你生于${monthName}，命局偏寒——金水过重而火力不足，如深冬不见阳光的湖面。《穷通宝鉴》认为${bazi.dayMaster}日主在此月需${roleParts.join('、')}来暖局解冻。${statusText}`;
  }
  // 寒暖适中
  return `你生于${monthName}，命局寒暖适中，不需特殊温度调节。但《穷通宝鉴》仍以${roleParts.join('、')}为${bazi.dayMaster}日主在此月的锦上添花——不为救急，为更好。${statusText}`;
}
