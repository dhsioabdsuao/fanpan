// 墨夜模式色板(曜金夜宴)——覆盖 Colors 全部键,与 lib/theme-tokens.ts 对齐
import { DARK_THEME } from '@/lib/theme-tokens';

export const ColorsDark = {
  yang: '#0e1420',
  yin: '#efe7d6',
  background: DARK_THEME.background,
  bgGradientStart: '#0b111c',
  bgGradientEnd: '#101a2b',

  surface: DARK_THEME.card,
  surfaceBorder: DARK_THEME.cardBorder,
  surfaceShadow: 'rgba(0,0,0,0.45)',

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

  guiRen: '#4caf7d',
  xiongXing: '#e06a4d',
  fanXing: '#8fa8bd',
  tianHeDiHe: '#4caf7d',
  tianKeDiChong: '#e06a4d',
  fuYin: '#8fa8bd',
  suiYunBingLin: '#e0b64d',
  currentYearBg: '#2a2414',

  dryHot: '#3a1d16',
  cold: '#16283a',
  balanced: '#12291f',

  // ── 曜金夜宴:玻璃拟态令牌 ──
  glassBg: 'rgba(23, 32, 48, 0.66)',
  hairlineGold: 'rgba(212, 169, 78, 0.4)',
  glowGold: 'rgba(212, 169, 78, 0.25)',
  auroraStart: '#0e1420',
  auroraEnd: '#101a2b',
} as const;
