// 曜金夜宴:玻璃拟态卡片(Liquid Glass 配方在 RN 的实现)
// - BlurView blurMethod=dimezisBlurViewSdk31Plus(Android 12+ 高效;更低版本
//   退化为半透明面板,靠金色描边+阴影仍保有层次)
// - 金色极细描边(hairline)+ 外发光阴影 + 内斜面高光线
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors, useIsDark } from '../../theme/ThemeContext';
import { BorderRadius } from '../../theme';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 玻璃强度(1-100,建议 25-45) */
  intensity?: number;
  /** 是否加金色高光顶线 */
  goldHairline?: boolean;
  style?: object;
  contentStyle?: object;
}

export default function GlassCard({
  children,
  intensity = 32,
  goldHairline = true,
  style,
  contentStyle,
}: Props) {
  const colors = useThemeColors();
  const isDark = useIsDark();

  return (
    <View style={[styles.shell, style]}>
      <BlurView
        blurMethod="dimezisBlurViewSdk31Plus"
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.glass, { borderColor: colors.hairlineGold }]}
      >
        {goldHairline && (
          <View style={[styles.hairline, { backgroundColor: colors.hairlineGold }]} />
        )}
        <View style={[styles.content, contentStyle]}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
  },
  glass: {
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: StyleSheet.hairlineWidth * 2,
  },
  content: {
    padding: 16,
  },
});
