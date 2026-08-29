// ─────────────────────────────────────────────────────────────
// 设计令牌(Web 与 RN 共用单一来源)——B+D 方案:墨金新中式 + 墨夜模式
//
// 五行色已经 dataviz 校验脚本双面验证(2026-08-29):
//   light surface #fcfcfb 与 dark surface #0e1420 均 ALL CHECKS PASS
//   (明度带/色度底线/色盲分离/全色觉分辨/表面对比度),
//   颜色跟随五行实体,明暗模式共用同一套。
// ─────────────────────────────────────────────────────────────

export type ElementColorKey = '木' | '火' | '土' | '金' | '水'

/** 五行传统色(明暗共用,已验证) */
export const ELEMENT_COLORS: Record<ElementColorKey, string> = {
  '木': '#2d7d46',
  '火': '#e02b1f',
  '土': '#bf8414',
  '金': '#b8860b',
  '水': '#2563eb',
}

export interface ThemeTokens {
  /** 页面背景 */
  background: string
  /** 卡片表面 */
  card: string
  /** 卡片边框 */
  cardBorder: string
  /** 文字三级 */
  inkPrimary: string
  inkSecondary: string
  inkMuted: string
  /** 暖金 ramp */
  gold: string
  goldLight: string
  goldDark: string
  /** 点缀 */
  cinnabar: string  // 朱砂(印章/警示点缀)
  indigo: string    // 黛青(辅助)
  /** 状态 */
  good: string
  warning: string
  danger: string
  /** 分隔线 */
  divider: string
}

/** 浅色:墨金(宣纸暖白 + 金描边) */
export const LIGHT_THEME: ThemeTokens = {
  background: '#faf6f0',
  card: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(184, 136, 11, 0.22)',
  inkPrimary: '#2c2416',
  inkSecondary: '#6b5f4e',
  inkMuted: '#a09888',
  gold: '#b8860b',
  goldLight: '#d4c9b2',
  goldDark: '#8b7355',
  cinnabar: '#c44d34',
  indigo: '#2f4858',
  good: '#2d7d46',
  warning: '#bf8414',
  danger: '#c44d34',
  divider: 'rgba(160, 140, 110, 0.25)',
}

/** 深色:墨夜(墨蓝黑底 + 琉璃金发光) */
export const DARK_THEME: ThemeTokens = {
  background: '#0e1420',
  card: 'rgba(23, 32, 48, 0.72)',
  cardBorder: 'rgba(184, 136, 11, 0.35)',
  inkPrimary: '#efe7d6',
  inkSecondary: '#b7ac97',
  inkMuted: '#7d7568',
  gold: '#d4a94e',
  goldLight: '#e8d7a8',
  goldDark: '#9a7d3a',
  cinnabar: '#e06a4d',
  indigo: '#8fa8bd',
  good: '#4caf7d',
  warning: '#e0b64d',
  danger: '#e06a4d',
  divider: 'rgba(212, 169, 78, 0.2)',
}

export const THEMES = { light: LIGHT_THEME, dark: DARK_THEME } as const
export type ThemeMode = keyof typeof THEMES
