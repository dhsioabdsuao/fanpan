import { StyleSheet, View, Text } from 'react-native';
import type { BaziResult } from '@/types/bazi';
import { extractPattern, assessOutcome } from '@/lib/bage';
import { Colors, FontSize, FontWeight, FONT_SERIF, Spacing, BorderRadius } from '../../theme';

const OUTCOME_LABEL: Record<string, string> = {
  '成格': '成格',
  '不成格': '不成格',
  '破格': '破格',
};

interface Props {
  result: BaziResult;
}

export default function PatternBlock({ result }: Props) {
  const pattern = extractPattern(result);
  const ao = assessOutcome(result, pattern);

  const reasons = ao.reason
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <View style={styles.container}>
      {/* Pattern name + outcome */}
      <View style={styles.nameRow}>
        <Text style={styles.patternName}>{pattern.displayName}</Text>
        <View style={styles.outcomeBadge}>
          <Text style={styles.outcomeText}>{OUTCOME_LABEL[ao.outcome]}</Text>
        </View>
      </View>

      {/* 用神 */}
      <Text style={styles.infoLine}>
        <Text style={styles.infoLabel}>用神 </Text>
        <Text style={styles.infoValue}>{pattern.yongShen}</Text>
        {pattern.luJieYongShenTenGod && (
          <Text style={styles.infoMuted}>（{pattern.luJieYongShenTenGod}）</Text>
        )}
      </Text>

      {/* 相神 — only when formed */}
      {ao.xiangShen && (
        <Text style={styles.infoLine}>
          <Text style={styles.infoLabel}>相神 </Text>
          <Text style={styles.infoValue}>{ao.xiangShen.god}</Text>
          <Text style={styles.infoMuted}>（{ao.xiangShen.role}）</Text>
        </Text>
      )}

      {/* 格神 */}
      <Text style={styles.infoLine}>
        <Text style={styles.infoLabel}>格神 </Text>
        <Text style={styles.infoMuted}>{pattern.patternGod}</Text>
      </Text>

      {/* Reasons */}
      <View style={styles.reasonSection}>
        <Text style={styles.reasonTitle}>判定依据</Text>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  patternName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FONT_SERIF,
    color: Colors.textPrimary,
  },
  outcomeBadge: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
  },
  outcomeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  infoLine: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  infoLabel: {
    color: Colors.textMuted,
  },
  infoValue: {
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  infoMuted: {
    color: Colors.textSecondary,
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
