// Earthy stone/gold palette matching the website
export const Colors = {
  // Background split (taiji)
  yang: '#f5f0e8',       // Light cream (yang side)
  yin: '#1f1d1a',         // Dark near-black (yin side)

  // Accents
  accent: '#a09888',       // Stone gray (S-curve outline, trigrams)
  goldText: '#aa9c82',     // Gold text for headings
  goldTextMuted: '#aa9c82cc',   // ~80% opacity gold
  goldTextSubtle: '#aa9c82b3',  // ~70% opacity gold

  // UI surface colors
  background: '#f5f0e8',       // 宣纸色
  surface: 'rgba(255,255,255,0.85)',   // 毛玻璃卡片底色
  surfaceBorder: '#e7e5e4', // stone-200

  // Text
  textPrimary: '#1c1917',   // stone-900
  textSecondary: '#78716c', // stone-500
  textMuted: '#a8a29e',     // stone-400
  textSubtle: '#d6d3d1',    // stone-300

  // Semantic
  destructive: '#ef4444',
  destructiveForeground: '#fef2f2',

  // Element colors (五行)
  gold: '#ca8a04',     // 金 - yellow-600
  wood: '#047857',     // 木 - emerald-700
  water: '#1d4ed8',    // 水 - blue-700
  fire: '#dc2626',     // 火 - red-600
  earth: '#b45309',    // 土 - amber-700

  // Day master highlight
  dayMasterBg: '#fef9c3',      // yellow-50
  dayMasterBorder: '#fef08a',  // yellow-200
  dayMasterBadge: '#fde047',   // yellow-200

  // Analysis cards
  analysisSummaryBg: '#fffbeb',       // amber-50/60
  analysisSummaryBorder: '#fde68a',   // amber-200

  // Shensha categories
  guiRen: '#059669',     // 贵人 - emerald-600
  xiongXing: '#ef4444',  // 凶星 - red-500
  fanXing: '#94a3b8',    // 泛星 - slate-400

  // LiuNian annotation badges
  tianHeDiHe: '#dcfce7',     // 天合地合 - emerald-100
  tianKeDiChong: '#fee2e2',  // 天克地冲 - red-100
  fuYin: '#fef3c7',          // 伏吟 - amber-100
  suiYunBingLin: '#ffedd5',  // 岁运并临 - orange-100

  // Current year highlight
  currentYearBg: '#fef3c7',  // amber-100

  // TiaoHou type colors
  dryHot: '#fef2f2',    // red-50
  cold: '#eff6ff',      // blue-50
  balanced: '#ecfdf5',  // emerald-50
} as const;

export type ColorKey = keyof typeof Colors;
