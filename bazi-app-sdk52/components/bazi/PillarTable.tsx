// 四柱题签(曜金夜宴):玻璃外框 + 金色双细线内框 + 日主柱金底高亮
import { StyleSheet, View, Text } from 'react-native';
import { useMemo } from 'react';
import type { FullAnalysis } from '@/lib/bage/analyze';
import type { ShenSha } from '@/lib/bage/shensha';
import GlassCard from '../ui/GlassCard';
import { FontSize, FontWeight, Spacing, FONT_SERIF, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { ELEMENT_COLORS } from '@/lib/theme-tokens';

const PILLAR_LABELS: Record<string, '年柱' | '月柱' | '日柱' | '时柱'> = {
  year: '年柱', month: '月柱', day: '日柱', hour: '时柱',
};

interface Props {
  full: FullAnalysis;
  hideHour?: boolean;
}

export default function PillarTable({ full, hideHour }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const result = full.bazi;
  const { pillars, tenGods, naYin } = result;
  const shensha: ShenSha[] = full.shenSha;
  const pillarKeys = ['year', 'month', 'day', 'hour'] as const;

  const columns = [
    { key: 'year' as const, label: '年柱', pillar: pillars.year, tenGod: tenGods.yearStem, naYin: naYin.year, highlight: false },
    { key: 'month' as const, label: '月柱', pillar: pillars.month, tenGod: tenGods.monthStem, naYin: naYin.month, highlight: false },
    { key: 'day' as const, label: '日柱', pillar: pillars.day, tenGod: '日主', naYin: naYin.day, highlight: true },
    { key: 'hour' as const, label: '时柱', pillar: pillars.hour, tenGod: tenGods.hourStem, naYin: naYin.hour, highlight: false },
  ];

  return (
    <GlassCard intensity={28} contentStyle={styles.glassContent} style={styles.shell}>
      <View style={styles.innerFrame}>
        {/* 4-column grid */}
        <View style={styles.grid}>
          {columns.map((col) => {
            const isHourHidden = hideHour && col.key === 'hour';

            return (
              <View
                key={col.key}
                style={[styles.column, col.highlight && styles.columnHighlight]}
              >
                {/* Column title */}
                <View style={styles.titleRow}>
                  <Text style={styles.columnLabel}>{col.label}</Text>
                  {col.highlight && (
                    <View style={styles.dayMasterBadge}>
                      <Text style={styles.dayMasterBadgeText}>日主</Text>
                    </View>
                  )}
                </View>

                {isHourHidden ? (
                  <View style={styles.hiddenPlaceholder}>
                    <Text style={styles.hiddenText}>未知</Text>
                  </View>
                ) : (
                  <>
                    {/* Ten god */}
                    <Text style={styles.tenGod}>{col.tenGod}</Text>

                    {/* Stem and branch */}
                    <View style={styles.stemBranchCol}>
                      <Text style={[styles.stemChar, { color: ELEMENT_COLORS[col.pillar.stemElement as keyof typeof ELEMENT_COLORS] ?? colors.textPrimary }]}>
                        {col.pillar.stem}
                      </Text>
                      <Text style={[styles.branchChar, { color: ELEMENT_COLORS[col.pillar.branchElement as keyof typeof ELEMENT_COLORS] ?? colors.textPrimary }]}>
                        {col.pillar.branch}
                      </Text>
                    </View>

                    {/* Hidden stems */}
                    <Text style={styles.subText}>
                      {col.pillar.hiddenStems.join(' ')}
                    </Text>

                    {/* NaYin */}
                    <Text style={styles.subText}>{col.naYin}</Text>
                  </>
                )}
              </View>
            );
          })}
        </View>

        {/* Shensha row */}
        <View style={styles.shenshaContainer}>
          <View style={styles.shenshaGrid}>
            {pillarKeys.map((key) => {
              const label = PILLAR_LABELS[key];
              const stars = shensha.filter((s) => s.pillar === label);
              const isHourHidden = hideHour && key === 'hour';

              return (
                <View key={key} style={styles.shenshaCol}>
                  {isHourHidden ? (
                    <Text style={styles.shenshaNone}>—</Text>
                  ) : stars.length === 0 ? (
                    <Text style={styles.shenshaNone}>无</Text>
                  ) : (
                    <View style={styles.shenshaList}>
                      {stars.map((s, i) => (
                        <Text key={i} style={[styles.shenshaName, { color: colors.fanXing }]}>
                          {s.name}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    shell: {
      borderRadius: BorderRadius.xl,
    },
    glassContent: {
      padding: 6,
    },
    innerFrame: {
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.hairlineGold,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      padding: Spacing.md,
    },
    grid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    column: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
    },
    columnHighlight: {
      backgroundColor: colors.dayMasterBg,
      borderWidth: 1,
      borderColor: colors.dayMasterBorder,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    columnLabel: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      color: colors.textMuted,
    },
    dayMasterBadge: {
      backgroundColor: colors.dayMasterBadge,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    dayMasterBadgeText: {
      fontSize: 9,
      fontWeight: FontWeight.medium,
      color: colors.goldDark,
    },
    hiddenPlaceholder: {
      paddingVertical: Spacing.xl,
    },
    hiddenText: {
      fontSize: FontSize.sm,
      color: colors.textMuted,
    },
    tenGod: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
    },
    stemBranchCol: {
      alignItems: 'center',
      gap: 2,
    },
    stemChar: {
      fontFamily: FONT_SERIF,
      fontSize: 34,
      fontWeight: FontWeight.bold,
      lineHeight: 40,
    },
    branchChar: {
      fontFamily: FONT_SERIF,
      fontSize: 34,
      fontWeight: FontWeight.bold,
      lineHeight: 40,
    },
    subText: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
    },
    shenshaContainer: {
      marginTop: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderTopColor: colors.hairlineGold,
      paddingTop: Spacing.sm,
    },
    shenshaGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    shenshaCol: {
      flex: 1,
      alignItems: 'center',
    },
    shenshaNone: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
      paddingVertical: Spacing.sm,
    },
    shenshaList: {
      alignItems: 'center',
      gap: 2,
      paddingVertical: Spacing.sm,
    },
    shenshaName: {
      fontSize: FontSize.xs,
      textAlign: 'center',
    },
  });
