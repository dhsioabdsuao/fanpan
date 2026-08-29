import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { buildBaziInput } from '../adapters/bazi-input-adapter';
import { calculateBazi } from '@/lib/bazi';
import { extractPattern, assessOutcome } from '@/lib/bage';
import { analyze } from '@/lib/bage/analyze';
import XiYongBlock from '../components/bazi/XiYongBlock';
import LiuTongBlock from '../components/bazi/LiuTongBlock';
import ShenShaBlock from '../components/bazi/ShenShaBlock';
import { DAY_MASTER_INTERPRETATIONS } from '@/lib/interpretations/dayMaster';
import { ZODIAC_TRAITS } from '@/lib/interpretations/zodiac';
import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../theme';
import { useThemeColors } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/ThemeContext';
import AuroraBackground from '../components/layout/AuroraBackground';
import { BlurTargetView } from 'expo-blur';
import PillarTable from '../components/bazi/PillarTable';
import BasicInfo from '../components/bazi/BasicInfo';
import DaYunTable from '../components/bazi/DaYunTable';
import ElementChart from '../components/bazi/ElementChart';
import PatternBlock from '../components/bazi/PatternBlock';
import StrengthBlock from '../components/bazi/StrengthBlock';
import AnalysisBlock from '../components/bazi/AnalysisBlock';
import TiaoHouBlock from '../components/bazi/TiaoHouBlock';
import CareerGuidanceBlock from '../components/bazi/CareerGuidanceBlock';
import HealthGuidanceBlock from '../components/bazi/HealthGuidanceBlock';
import CollapsibleSection from '../components/ui/CollapsibleSection';
import Card from '../components/ui/Card';
import { saveRecord } from '../services/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [openId, setOpenId] = useState<string | null>('narrative');

  const { result, error } = useMemo(() => {
    const input = buildBaziInput(route.params);
    if (!input) {
      return { result: null, error: '参数有误，请返回重新填写' };
    }
    try {
      const res = calculateBazi(input);
      return { result: res, error: null };
    } catch (e: any) {
      return { result: null, error: `排盘失败：${e?.message || '未知错误'}` };
    }
  }, [route.params]);

  // 计算成功后自动保存到本地历史记录
  useEffect(() => {
    if (!result) return;
    try {
      const brief = [
        `${result.pillars.year.stem}${result.pillars.year.branch}`,
        `${result.pillars.month.stem}${result.pillars.month.branch}`,
        `${result.pillars.day.stem}${result.pillars.day.branch}`,
        `${result.pillars.hour.stem}${result.pillars.hour.branch}`,
      ].join(' ');

      const pattern = extractPattern(result);
      const ao = assessOutcome(result, pattern);

      saveRecord(route.params, {
        baziBrief: brief,
        patternDisplay: pattern.displayName,
        patternOutcome: ao.outcome,
        patternResult: ao.reason.split(';')[0].trim(),
        dayMaster: result.dayMaster,
      });
    } catch {
      // 保存失败不影响排盘结果展示
    }
  }, [result]);

  // 【诊断流程】全页只算一次统一管线,所有卡片消费同一结果
  const full = useMemo(() => {
    if (!result) return null;
    try {
      return analyze(result);
    } catch {
      return null;
    }
  }, [result]);

  if (!full) {
    return (
      <View style={styles.safe}>
        <Text style={styles.placeholder}>分析生成中…</Text>
      </View>
    );
  }

  const narrative = full.texts.narrative;

  const toggleSection = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (error || !result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.backLink} onPress={() => navigation.goBack()}>
            返回首页
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const Sections = [
    {
      id: 'zonglan',
      title: '命盘总览',
      render: () => (
        <View>
          <BasicInfo full={full} />
          <ElementChart full={full} />
        </View>
      ),
    },
    { id: 'pattern', title: '格局定位', component: PatternBlock },
    { id: 'strength', title: '日主强弱', component: StrengthBlock },
    {
      id: 'outcome',
      title: '格局成败',
      render: () => {
        if (!full) return null;
        return (
          <View>
            <View style={styles.outcomeHead}>
              <Text style={styles.outcomeLabel}>结论</Text>
              <Text style={styles.outcomeValue}>{full.outcome.outcome}</Text>
              {full.outcome.tiaoHouSpecial ? (
                <Text style={styles.tiaoHouTag}>{full.outcome.tiaoHouSpecial}</Text>
              ) : null}
            </View>
            {full.outcome.conditions.map((c) => (
              <View key={c.label + c.desc} style={styles.condRow}>
                <Text style={c.met ? styles.condOk : styles.condFail}>{c.met ? '✓' : '✗'}</Text>
                <Text style={styles.condText}>
                  <Text style={styles.condLabel}>{c.label}</Text>
                  <Text style={styles.condDesc}> — {c.desc}</Text>
                </Text>
              </View>
            ))}
          </View>
        );
      },
    },
    { id: 'tiaoHou', title: '调候', component: TiaoHouBlock },
    { id: 'liuTong', title: '五行流通', component: LiuTongBlock },
    { id: 'xiyong', title: '喜忌总览', component: XiYongBlock },
    {
      id: 'analysis',
      title: '综合解析',
      render: () => (
        <View>
          {narrative ? (
            <View style={styles.narrativeWrap}>
              {narrative.split('\n\n').map((para, i) => (
                <Text key={i} style={styles.narrativeBody}>{para}</Text>
              ))}
            </View>
          ) : null}
          <AnalysisBlock full={full} />
        </View>
      ),
    },
    { id: 'dayun', title: '大运流年', component: DaYunTable },
    { id: 'career', title: '事业指引', component: CareerGuidanceBlock },
    { id: 'health', title: '体质倾向', component: HealthGuidanceBlock },
    { id: 'shensha', title: '神煞(标注)', component: ShenShaBlock },
    {
      id: 'daymaster',
      title: '日主解析',
      render: () => {
        const i = DAY_MASTER_INTERPRETATIONS[result.dayMaster];
        if (!i) return <Text style={styles.placeholder}>该日主解读尚在编写中</Text>;
        return (
          <View style={styles.interpretationWrap}>
            <View style={styles.dmCenter}>
              <Text style={styles.dmName}>{result.dayMaster}</Text>
              <Text style={styles.dmSub}>
                {i.element} {i.yinYang}
              </Text>
            </View>
            <InterpretSection title="性格特点" text={i.personality} />
            <InterpretSection title="优势特质" text={i.strength} />
            <InterpretSection title="需要注意" text={i.weakness} />
            <InterpretSection title="适合方向" text={i.career} />
          </View>
        );
      },
    },
    {
      id: 'zodiac',
      title: '生肖特征',
      render: () => (
        <View style={styles.interpretationWrap}>
          <View style={styles.dmCenter}>
            <Text style={styles.dmName}>{result.zodiac}</Text>
          </View>
          <Text style={styles.interpretBody}>
            {ZODIAC_TRAITS[result.zodiac]?.description ?? '暂无解读'}
          </Text>
        </View>
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <AuroraBackground />
      <BlurTargetView style={styles.flex}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.backLink} onPress={() => navigation.goBack()}>
            ← 返回首页
          </Text>
          <Text style={styles.headerTitle}>命盘</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Pillar Table */}
        <PillarTable full={full} />

        {/* Collapsible Sections */}
        <View style={styles.sections}>
          {Sections.map((section) => {
            const isOpen = openId === section.id;
            return (
              <CollapsibleSection
                key={section.id}
                title={section.title}
                isOpen={isOpen}
                onToggle={() => toggleSection(section.id)}
              >
                {section.render
                  ? section.render()
                  : section.component && <section.component full={full} />}
              </CollapsibleSection>
            );
          })}
        </View>

        {/* 历史排盘入口 */}
        <Pressable
          style={styles.historyEntry}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyEntryText}>历史排盘 →(本次命盘已自动保存)</Text>
        </Pressable>

        {/* Disclaimer — 古籍批注风格 */}
        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerDivider} />
          <Text style={styles.disclaimerText}>
            本站排盘基于子平派传统命理学，可见人生大致方向、性格特质、五行分布。
          </Text>
          <Text style={styles.motto}>知命而不认命，但行好事，莫问前程</Text>
          <Text style={styles.disclaimerNote}>
            —— 命运掌握在自己手中，请勿据此做出重大人生决策
          </Text>
        </View>
      </ScrollView>
      </BlurTargetView>
    </SafeAreaView>
  );
}

// ── Sub-components ──

function InterpretSection({ title, text }: { title: string; text: string }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeInterpretStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const makeInterpretStyles = (colors: ThemeColors) => StyleSheet.create({
  section: {
    marginTop: Spacing.md,
  },
  heading: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: FontSize.base,
    lineHeight: 24,
    color: colors.textSecondary,
  },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
    color: colors.goldText,
    fontFamily: FONT_SERIF,
  },
  headerSpacer: {
    width: 80,
  },
  backLink: {
    fontSize: FontSize.base,
    color: colors.goldText,
    fontWeight: FontWeight.medium,
    padding: Spacing.xs,
  },
  narrativeWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  outcomeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  outcomeLabel: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
  },
  outcomeValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: colors.textPrimary,
  },
  tiaoHouTag: {
    fontSize: FontSize.xs,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  condRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  condOk: {
    color: '#059669',
    fontWeight: FontWeight.bold,
  },
  condFail: {
    color: '#dc2626',
    fontWeight: FontWeight.bold,
  },
  condText: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  condLabel: {
    fontWeight: FontWeight.medium,
    color: colors.textPrimary,
  },
  condDesc: {
    color: colors.textMuted,
  },
  narrativeBody: {
    fontSize: FontSize.base,
    lineHeight: 28,
    color: colors.textSecondary,
    marginBottom: Spacing.md,
  },
  sections: {
    marginTop: Spacing.lg,
    gap: 12,
  },
  placeholder: {
    fontSize: FontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  interpretationWrap: {
    gap: Spacing.sm,
  },
  dmCenter: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dmName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FONT_SERIF,
    color: colors.textPrimary,
  },
  dmSub: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  interpretBody: {
    fontSize: FontSize.base,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.md,
    color: colors.destructive,
    textAlign: 'center',
  },
  historyEntry: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.surface,
    marginBottom: Spacing.lg,
  },
  historyEntryText: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
  },
  disclaimerContainer: {
    marginTop: Spacing.xl,
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  disclaimerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginBottom: Spacing.md,
  },
  disclaimerText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
    lineHeight: 18,
    writingDirection: 'ltr' as const,
  },
  disclaimerNote: {
    fontSize: 10,
    color: colors.textSubtle,
    textAlign: 'right',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  motto: {
    fontSize: FontSize.md,
    fontFamily: FONT_SERIF,
    color: colors.textMuted,
    textAlign: 'right',
    marginVertical: Spacing.sm,
  },
});
