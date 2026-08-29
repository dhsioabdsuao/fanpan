// 曜金夜宴:光晕背景(墨夜:金/黛青两团光晕;浅色:暖纸渐变+淡金光)
// 用多层 LinearGradient 近似 aurora,性能优于整页模糊
import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme/ThemeContext';

export default function AuroraBackground() {
  const colors = useThemeColors();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 基底渐变 */}
      <LinearGradient
        colors={[colors.auroraStart, colors.auroraEnd]}
        style={StyleSheet.absoluteFill}
        // Android 全屏深色渐变保持 dither 默认开启,防色带
      />
      {/* 金色光晕(左下) */}
      <LinearGradient
        colors={[colors.glowGold, 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0.2 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 黛青光晕(右上,墨夜专属;浅色极淡) */}
      <LinearGradient
        colors={['rgba(47,72,88,0.14)', 'rgba(0,0,0,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      {Platform.OS === 'android' && (
        // Android 下渐变叠加后加一层极淡噪点近似(纯色,免性能损耗)
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.02)' }]} />
      )}
    </View>
  );
}
