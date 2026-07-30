import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Colors, FontSize, FONT_SERIF, Spacing } from '../theme';

export default function AboutScreen() {
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

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    color: Colors.goldText,
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
    backgroundColor: Colors.goldTextSubtle as string,
  },
  dividerDiamond: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.xs,
    color: Colors.goldTextSubtle as string,
  },
  paragraph: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  footer: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontFamily: FONT_SERIF,
  },
  privacyLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  privacyLinkText: {
    fontSize: FontSize.sm,
    color: Colors.goldText,
    fontWeight: '500',
  },
});
