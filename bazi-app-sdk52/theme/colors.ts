// Warm premium palette — modern Chinese aesthetic
export const Colors = {
  // Background
  yang: '#faf6f0',          // Warm cream (light mode bg)
  yin: '#1a1815',           // Deep ink (dark accents)
  background: '#faf6f0',    // 宣纸暖色调
  bgGradientStart: '#f5efe5',
  bgGradientEnd: '#ede4d8',

  // Surface / Cards
  surface: 'rgba(255,255,255,0.88)',
  surfaceBorder: 'rgba(180,160,130,0.18)',
  surfaceShadow: 'rgba(60,40,20,0.06)',

  // Gold accent system
  gold: '#b8a88a',          // Warm gold — main accent
  goldLight: '#d4c9b2',     // Light gold — hover/secondary
  goldDark: '#8b7355',      // Deep gold — headings
  goldMuted: '#b8a88ab3',   // ~70% opacity

  // Backward compat aliases
  goldText: '#b8a88a',
  goldTextMuted: '#b8a88ab3' as string,
  goldTextSubtle: '#b8a88a80' as string,

  // Text
  textPrimary: '#2c2416',   // Near-black warm
  textSecondary: '#6b5f4e', // Warm gray
  textMuted: '#a09888',     // Light warm gray
  textSubtle: '#d4cdc0',   // Very light

  // Ink accent
  ink: '#2c2416',
  inkLight: 'rgba(44,36,22,0.06)',

  // Decorative
  divider: 'rgba(160,140,110,0.25)',
  sealRed: '#c44d34',       // 印章红 — for accent badges/stamps

  // Semantic
  destructive: '#c44d34',
  destructiveForeground: '#fef5f2',

  // Element colors (五行) — lib/theme-tokens.ts 双面验证值
  gold_elem: '#b8860b',     // 金
  wood: '#2d7d46',          // 木
  water: '#2563eb',         // 水
  fire: '#e02b1f',          // 火
  earth: '#bf8414',         // 土

  // Day master highlight
  dayMasterBg: '#fef9e7',
  dayMasterBorder: '#f0e0a0',
  dayMasterBadge: '#e8d48b',

  // Analysis cards — tinted backgrounds
  analysisSummaryBg: '#fdfaf3',
  analysisSummaryBorder: 'rgba(180,160,130,0.25)',

  // Shensha categories
  guiRen: '#059669',
  xiongXing: '#dc2626',
  fanXing: '#94a3b8',

  // LiuNian annotation badges
  tianHeDiHe: '#dcfce7',
  tianKeDiChong: '#fee2e2',
  fuYin: '#fef3c7',
  suiYunBingLin: '#ffedd5',

  // Current year highlight
  currentYearBg: '#fef3c7',

  // TiaoHou type colors
  dryHot: '#fef2f2',
  cold: '#eff6ff',
  balanced: '#ecfdf5',
} as const;

export type ColorKey = keyof typeof Colors;
