import { StyleSheet, View, Text } from 'react-native';
import type { BaziResult } from '@/types/bazi';
import { determineStrength } from '@/lib/strength/determineStrength';
import { Colors, FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';

const LEVEL_LABEL: Record<string, string> = {
  '身强': '身强',
  '中和': '中和',
  '身弱': '身弱',
};

interface Props {
  result: BaziResult;
}

export default function StrengthBlock({ result }: Props) {
  const s = determineStrength(result);

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

const styles = StyleSheet.create({
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
    color: Colors.textMuted,
  },
  levelValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FONT_SERIF,
    color: Colors.textPrimary,
  },
  factorGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  factorCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  factorTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  factorBool: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  factorHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reasonSection: {
    gap: Spacing.xs,
  },
  reasonTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reasonDash: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
  },
  reasonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
});
