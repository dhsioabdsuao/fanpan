import { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import type { FullAnalysis } from '@/lib/bage/analyze';

import { FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

const LEVEL_LABEL: Record<string, string> = {
  '身强': '身强',
  '中和': '中和',
  '身弱': '身弱',
};

interface Props {
  full: FullAnalysis;
}

export default function StrengthBlock({ full }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const s = full.strength;

  const reasons = s.reason
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean);

  return (
    <View style={styles.container}>
      {/* Level */}
      <View style={styles.levelRow}>
        <Text style={styles.levelLabel}>强弱</Text>
        <Text style={styles.levelValue}>{LEVEL_LABEL[s.level]}</Text>
      </View>

      {/* Three factors */}
      <View style={styles.factorGrid}>
        <View style={styles.factorCard}>
          <Text style={styles.factorTitle}>得令</Text>
          <Text style={styles.factorBool}>{s.deLing ? '是' : '否'}</Text>
          <Text style={styles.factorHint}>
            {s.deLing ? '月令帮扶日主' : '月令克泄耗日主'}
          </Text>
        </View>
        <View style={styles.factorCard}>
          <Text style={styles.factorTitle}>得地</Text>
          <Text style={styles.factorBool}>{s.deDi ? '有根' : '无根'}</Text>
          <Text style={styles.factorHint}>
            {s.deDi ? '地支有日主同五行' : '地支无日主同五行'}
          </Text>
        </View>
        <View style={styles.factorCard}>
          <Text style={styles.factorTitle}>得势</Text>
          <Text style={styles.factorBool}>{s.deShi}</Text>
          <Text style={styles.factorHint}>全局帮扶与克泄对比</Text>
        </View>
      </View>

      {/* Reasons */}
      <View style={styles.reasonSection}>
        <Text style={styles.reasonTitle}>判定理由</Text>
        {reasons.map((r, i) => (
          <View key={i} style={styles.reasonRow}>
            <Text style={styles.reasonDash}>—</Text>
            <Text style={styles.reasonText}>{r}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelLabel: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
  },
  levelValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FONT_SERIF,
    color: colors.textPrimary,
  },
  factorGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  factorCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  factorTitle: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  factorBool: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: colors.textSecondary,
  },
  factorHint: {
    fontSize: FontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonSection: {
    gap: Spacing.xs,
  },
  reasonTitle: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reasonDash: {
    fontSize: FontSize.sm,
    color: colors.textSubtle,
  },
  reasonText: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
