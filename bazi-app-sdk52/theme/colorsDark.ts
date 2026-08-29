// 墨夜模式色板(lib/theme-tokens.ts DARK_THEME 的 RN 映射,UI-3 全面启用)
import { DARK_THEME } from '@/lib/theme-tokens';

export const ColorsDark = {
  yang: '#0e1420',
  yin: '#efe7d6',
  background: DARK_THEME.background,
  bgGradientStart: '#0b111c',
  bgGradientEnd: '#101a2b',

  surface: DARK_THEME.card,
  surfaceBorder: DARK_THEME.cardBorder,
  surfaceShadow: 'rgba(0,0,0,0.4)',

  gold: DARK_THEME.gold,
  goldLight: DARK_THEME.goldLight,
  goldDark: DARK_THEME.goldDark,
  goldMuted: `${DARK_THEME.gold}B3`,
  goldText: DARK_THEME.gold,
  goldTextMuted: `${DARK_THEME.gold}B3`,
  goldTextSubtle: `${DARK_THEME.gold}80`,

  textPrimary: DARK_THEME.inkPrimary,
  textSecondary: DARK_THEME.inkSecondary,
  textMuted: DARK_THEME.inkMuted,
  textSubtle: '#4a5468',

  ink: DARK_THEME.inkPrimary,
  inkLight: 'rgba(239,231,214,0.06)',

  divider: DARK_THEME.divider,
  sealRed: DARK_THEME.cinnabar,

  destructive: DARK_THEME.danger,
  destructiveForeground: '#1a0f0c',

  gold_elem: '#b8860b',
  wood: '#2d7d46',
  water: '#2563eb',
  fire: '#e02b1f',
  earth: '#bf8414',

  dayMasterBg: '#2a2414',
  dayMasterBorder: '#4a4024',
  dayMasterBadge: '#3a321a',

  analysisSummaryBg: '#1a2233',
  analysisSummaryBorder: 'rgba(212,169,78,0.25)',
} as const;
