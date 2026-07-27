import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FONT_SERIF, Spacing, FONT_SANS } from '../theme';

const SECTIONS = [
  {
    title: '数据收集',
    body: '本应用不收集任何个人信息。您的出生时间、姓名等全部数据仅存储在设备本地，不会上传至任何服务器。',
  },
  {
    title: '本地存储',
    body: '排盘历史记录使用设备本地文件系统存储，您可以随时在首页滑动删除。删除后数据不可恢复。',
  },
  {
    title: '网络使用',
    body: '本应用不依赖网络连接。排盘计算、格局判定、神煞查表、大运流年等全部功能均在设备本地完成。',
  },
  {
    title: '第三方服务',
    body: '本应用不使用任何第三方分析、广告或追踪服务。',
  },
  {
    title: '免责声明',
    body: '本工具仅供文化研究与娱乐参考，不构成任何人生决策建议。命理学是传统文化的一部分，请理性看待，不要据此做出重大决定。',
  },
];

export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header */}
        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>

        <Text style={styles.title}>隐私政策</Text>
        <Text style={styles.updateDate}>更新日期：2026年7月27日</Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDiamond}>◆</Text>
          <View style={styles.dividerLine} />
        </View>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>— 四柱八字</Text>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  backLink: {
    marginBottom: Spacing.lg,
    padding: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.base,
    color: Colors.goldText,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.goldText,
    textAlign: 'center',
    fontFamily: FONT_SERIF,
  },
  updateDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
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
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FONT_SERIF,
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  footer: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontFamily: FONT_SERIF,
  },
});
