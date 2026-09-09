import { useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontSize, FONT_SERIF, Spacing, FONT_SANS } from '../theme';
import { useThemeColors } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/ThemeContext';

const SECTIONS = [
  {
    title: '排盘数据与本地存储',
    body: '排盘功能完全离线：出生信息与排盘历史仅存储在设备本地文件系统，可在历史页随时删除。删除后数据不可恢复。',
  },
  {
    title: '账号与手机号',
    body: '广场社区功能需使用手机号验证码登录（短信由 LeanCloud 国内版服务发送）。手机号仅用于登录验证，不对其他用户展示；社区中显示的是掩码昵称（如「命友·138****5678」）。',
  },
  {
    title: '广场帖子信息（脱敏）',
    body: '发布求测帖时，仅上传四柱八字、性别及格局、强弱、喜忌、神煞、大运摘要等衍生信息。我们不会收集或存储您的精确出生分钟、姓名、出生地点。四柱本身可能被推算者反推出大致出生日期，发布即视为您自愿公开。帖子可随时删除。',
  },
  {
    title: '第三方服务',
    body: '社区功能使用 LeanCloud 国内版（腾讯云运营）提供数据存储与短信服务，数据存储于中国大陆境内。除此外无任何第三方分析、广告或追踪服务。',
  },
  {
    title: '账号注销',
    body: '您可以在「我的」页退出登录；注销账号入口位于「我的」页「注销账号」（需二次确认），注销后账号与相关数据将被删除且不可恢复。',
  },
  {
    title: '内容治理',
    body: '社区内容经敏感词过滤；如发现违规内容可使用举报功能，我们将在后台核实处理。批注内容为用户个人观点，不代表本应用立场。',
  },
  {
    title: '免责声明',
    body: '本工具仅供文化研究与娱乐参考，不构成任何人生决策建议。命理学是传统文化的一部分，请理性看待，不要据此做出重大决定。',
  },
];

export default function PrivacyScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header */}
        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>

        <Text style={styles.title}>隐私政策</Text>
        <Text style={styles.updateDate}>更新日期：2026年8月30日</Text>

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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl * 2 + 32, // 底部悬浮 tab bar 留白
  },
  backLink: {
    marginBottom: Spacing.lg,
    padding: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.base,
    color: colors.goldText,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: colors.goldText,
    textAlign: 'center',
    fontFamily: FONT_SERIF,
  },
  updateDate: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
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
    backgroundColor: colors.goldTextSubtle as string,
  },
  dividerDiamond: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.xs,
    color: colors.goldTextSubtle as string,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: FONT_SERIF,
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  footer: {
    fontSize: FontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontFamily: FONT_SERIF,
  },
});
