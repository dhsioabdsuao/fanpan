// 副星(藏干十神):每柱地支藏干对应的十神。
// 命理界通行定义:主星 = 天干十神(已示于四柱表格),副星 = 藏干十神。
// 数据来自 BaziResult.tenGods.*Branch,与 pillars.*.hiddenStems 按构造逐位对应
// (lib/bazi.ts),纯标注展示,不参与任何判定。视觉沿用 PillarTable 玻璃卡语言。
import { StyleSheet, View, Text } from 'react-native';
import { useMemo } from 'react';
import type { FullAnalysis } from '@/lib/bage/analyze';
import GlassCard from '../ui/GlassCard';
import { FontSize, FontWeight, Spacing, FONT_SERIF, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

const PILLAR_LABELS: Record<string, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '时柱',
};

interface Props {
  full: FullAnalysis;
  hideHour?: boolean;
}

export default function FuXingBlock({ full, hideHour }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { pillars, tenGods } = full.bazi;
  const keys = ['year', 'month', 'day', 'hour'] as const;

  return (
    <GlassCard intensity={28} contentStyle={styles.glassContent} style={styles.shell}>
      <View style={styles.innerFrame}>
        {/* 标题 */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>副星</Text>
          <Text style={styles.subtitle}>地支藏干对应的十神</Text>
        </View>

        {/* 四列:藏干 · 十神 配对 */}
        <View style={styles.grid}>
          {keys.map((key) => {
            const isHourHidden = hideHour && key === 'hour';
            const highlight = key === 'day';
            const stems = pillars[key].hiddenStems;
            const gods = tenGods[`${key}Branch`];

            return (
              <View
                key={key}
                style={[styles.column, highlight && styles.columnHighlight]}
              >
                <Text style={styles.columnLabel}>{PILLAR_LABELS[key]}</Text>
                {isHourHidden ? (
                  <View style={styles.hiddenPlaceholder}>
                    <Text style={styles.hiddenText}>未知</Text>
                  </View>
                ) : (
                  <View style={styles.pairList}>
                    {stems.map((stem, i) => (
                      <View key={`${stem}-${i}`} style={styles.pairChip}>
                        <Text style={styles.stemChar}>{stem}</Text>
                        <Text style={styles.godText}>{gods[i]}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 标注说明 */}
        <Text style={styles.note}>副星为地支藏干对应的十神,标注展示,不参与判定</Text>
      </View>
    </GlassCard>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    shell: {
      borderRadius: BorderRadius.xl,
      marginTop: Spacing.md,
    },
    glassContent: {
      padding: 5,
    },
    innerFrame: {
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.hairlineGold,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      padding: Spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    title: {
      fontFamily: FONT_SERIF,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: colors.goldDark,
    },
    subtitle: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
    },
    grid: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    column: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.xs,
      paddingHorizontal: 2,
    },
    columnHighlight: {
      backgroundColor: colors.dayMasterBg,
      borderWidth: 1,
      borderColor: colors.dayMasterBorder,
    },
    columnLabel: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.medium,
      color: colors.textMuted,
    },
    pairList: {
      gap: 3,
    },
    pairChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    stemChar: {
      fontFamily: FONT_SERIF,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      color: colors.goldDark,
    },
    godText: {
      fontSize: 10,
      color: colors.textMuted,
    },
    hiddenPlaceholder: {
      paddingVertical: Spacing.md,
      justifyContent: 'center',
    },
    hiddenText: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
    },
    note: {
      marginTop: Spacing.sm,
      fontSize: 9,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
