// 墨夜模式上下文:根据系统深浅色返回 Colors 或 ColorsDark
// 组件用 useThemeColors() 替代静态 Colors 导入,逐步迁移
import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from './colors';
import { ColorsDark } from './colorsDark';

export type ThemeColors = typeof Colors;

const ThemeContext = createContext<ThemeColors>(Colors);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? (ColorsDark as unknown as ThemeColors) : Colors;
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext);
}
