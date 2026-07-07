// ── 调候查表（《穷通宝鉴》原文·常用项）──
//
// 结构：Map<dayMaster, Map<monthBranch, tiaoHouList>>
// 仅收录已查证的核心条目，其他组合返回空数组

const TIAO_HOU_TABLE: Map<string, Map<string, string[]>> = new Map()

function set(dayMaster: string, monthBranch: string, gods: string[]) {
  if (!TIAO_HOU_TABLE.has(dayMaster)) {
    TIAO_HOU_TABLE.set(dayMaster, new Map())
  }
  TIAO_HOU_TABLE.get(dayMaster)!.set(monthBranch, gods)
}

// ── 甲木 ──
set('甲', '午', ['壬', '庚', '丁'])

// ── 乙木 ──
set('乙', '午', ['癸', '丙'])

// ── 丙火 ──
set('丙', '子', ['甲', '戊', '庚'])

// ── 丁火 ──
set('丁', '子', ['甲', '庚'])

// ── 戊土 ──
set('戊', '午', ['壬', '甲', '丙'])

// ── 己土 ──
set('己', '午', ['癸', '丙'])

// ── 庚金 ──
set('庚', '子', ['丙', '甲'])

// ── 辛金 ──
set('辛', '子', ['丙', '戊', '壬'])

// ── 壬水 ──
set('壬', '午', ['癸', '庚', '辛'])

// ── 癸水 ──
set('癸', '午', ['庚', '辛', '癸'])

/**
 * 根据日主和月令查《穷通宝鉴》调候用神。
 * @returns 调候天干列表（可能为空），按原文顺序排列
 */
export function getTiaoHouYongShen(dayMaster: string, monthBranch: string): string[] {
  const inner = TIAO_HOU_TABLE.get(dayMaster)
  if (!inner) return []
  return inner.get(monthBranch) ?? []
}
