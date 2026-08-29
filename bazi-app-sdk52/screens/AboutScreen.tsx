import { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Svg, { Circle, Path, ClipPath, Defs, Rect } from 'react-native-svg';
import { FontSize, FONT_SERIF, Spacing } from '../theme';
import { useThemeColors } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/ThemeContext';

export default function AboutScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>关于本站</Text>

        {/* Decorative divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDiamond}>◆</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.paragraph}>
          本站基于《渊海子平》《三命通会》《滴天髓》《穷通宝鉴》等经典古籍，
          辅以现代天文算法（真太阳时校正、节气精确匹配），对您的生辰八字进行系统化排盘分析。
        </Text>
        <Text style={styles.paragraph}>
          格局判定遵循《子平真诠》体系，强弱判定采用《滴天髓》任铁樵注本的三要素法（得令、得地、得势），
          调候用神参考《穷通宝鉴》的月令调候表。
        </Text>
        <Text style={styles.paragraph}>
          本工具仅供文化研究与娱乐参考，不构成任何人生决策建议。
        </Text>
        <Text style={styles.paragraph}>
          知命而不认命，愿您在了解命理的同时，更能把握当下、创造未来。
        </Text>
        <Text style={styles.footer}>— 四柱八字排盘</Text>

        <Pressable
          style={styles.privacyLink}
          onPress={() => navigation.navigate('Privacy')}
        >
          <Text style={styles.privacyLinkText}>隐私政策 →</Text>
        </Pressable>

        {/* Static small taiji */}
        <View style={styles.taijiWrapper}>
          <Svg viewBox="0 0 200 200" style={styles.taiji}>
            <Defs>
              <ClipPath id="about-tai">
                <Path d="M 100,12 A 88,88 0 0,1 100,188 A 44,44 0 0,0 100,100 A 44,44 0 0,1 100,12 Z" />
              </ClipPath>
            </Defs>
            <Circle cx="100" cy="100" r="88" fill="#f5f0e8" />
            <Circle cx="100" cy="100" r="88" fill="#1f1d1a" clipPath="url(#about-tai)" />
            <Circle cx="84" cy="156" r="8" fill="#f5f0e8" />
            <Circle cx="116" cy="44" r="8" fill="#1f1d1a" />
            <Circle cx="100" cy="100" r="88" fill="none" stroke="#a09888" strokeWidth="0.5" opacity="0.3" />
          </Svg>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl * 2,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: colors.goldText,
    textAlign: 'center',
    fontFamily: FONT_SERIF,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.goldTextSubtle as string,
  },
  dividerDiamond: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.xs,
    color: colors.goldTextSubtle as string,
  },
  paragraph: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  footer: {
    fontSize: FontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontFamily: FONT_SERIF,
  },
  taijiWrapper: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    opacity: 0.3,
  },
  taiji: {
    width: 80,
    height: 80,
  },
  privacyLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  privacyLinkText: {
    fontSize: FontSize.sm,
    color: colors.goldText,
    fontWeight: '500',
  },
});
