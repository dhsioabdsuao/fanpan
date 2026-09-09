import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { FontSize, FontWeight, FONT_SERIF, Spacing } from '../../theme';
import AuroraBackground from '../../components/layout/AuroraBackground';
import { BlurTargetView } from 'expo-blur';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '一、服务说明',
    body: [
      '「四柱八字」App 提供命盘排盘工具与广场社区功能。社区功能中,您可将命盘发布为求测帖,其他用户可对帖子进行批注。',
      '本应用所有内容仅供文化研究与娱乐参考,不构成任何人生决策建议。',
    ],
  },
  {
    title: '二、账号与手机号',
    body: [
      '社区功能使用手机号验证码登录,验证码短信由 LeanCloud 国内版服务提供。',
      '您的手机号仅用于登录验证与账号安全,不向其他用户展示;社区中展示的是掩码昵称(如「命友·138****5678」)。',
      '您可在「我的」页退出登录;账号注销入口位于「我的」页(后续版本提供,或联系支持邮箱)。',
    ],
  },
  {
    title: '三、求测帖与脱敏',
    body: [
      '发布求测帖时,仅上传四柱八字、性别及格局/强弱/喜忌/神煞/大运摘要等衍生信息。',
      '我们不会收集或存储您的精确出生分钟、姓名、出生地点等原始信息。四柱本身可能被推算者反推出大致出生日期,发布即视为您自愿公开,请知悉。',
      '您发布的帖子可随时删除,删除后该帖的批注一并处理。',
    ],
  },
  {
    title: '四、社区行为规范',
    body: [
      '批注内容需与命理讨论相关,不得发布色情低俗、赌博、违法违规、广告营销等内容。',
      '请勿恶意灌水、刷称号。系统对批注有长度、频率与每日数量限制;自帖批注不计入称号。',
      '如发现违规内容,请使用举报功能,我们将在后台核实处理。',
    ],
  },
  {
    title: '五、免责声明',
    body: [
      '广场中的批注内容为用户个人观点,不代表本应用立场。',
      '知命而不认命,请理性看待命理内容,但行好事,莫问前程。',
    ],
  },
  {
    title: '六、隐私政策(要点)',
    body: [
      '我们收集的信息:手机号(登录验证)、您发布的内容(帖子与批注)。',
      '信息用途:提供登录、社区展示、称号计数。',
      '信息存储:LeanCloud 国内版服务,数据存储于中国大陆境内。',
      '我们不会向任何第三方出售您的个人信息。',
      '完整隐私政策请访问:https://dhsioabdsuao.github.io/fanpan/privacy.html',
      '联系与支持:GitHub Issues(见「关于」页)',
    ],
  },
];

export default function UserAgreementScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground />
      <BlurTargetView style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.backLink}>← 返回</Text>
            </Pressable>
            <Text style={styles.headerTitle}>用户协议与隐私政策</Text>
            <View style={styles.headerSpacer} />
          </View>

          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.body.map((p, i) => (
                <Text key={i} style={styles.paragraph}>{p}</Text>
              ))}
            </View>
          ))}

          <Text style={styles.updated}>更新日期:2026-08-30</Text>
        </ScrollView>
      </BlurTargetView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 128 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backLink: { fontSize: FontSize.sm, color: colors.goldText },
  headerTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 72 },
  section: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  paragraph: {
    fontSize: FontSize.sm,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  updated: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
