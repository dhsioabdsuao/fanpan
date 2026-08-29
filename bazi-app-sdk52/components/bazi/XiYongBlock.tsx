import { StyleSheet, View, Text } from 'react-native';
import type { FullAnalysis } from '@/lib/bage/analyze';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

const EL_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  '木': { label: '木', color: '#065f46', bg: '#d1fae5' },
  '火': { label: '火', color: '#991b1b', bg: '#fee2e2' },
  '土': { label: '土', color: '#92400e', bg: '#fef3c7' },
  '金': { label: '金', color: '#854d0e', bg: '#fef9c3' },
  '水': { label: '水', color: '#1e40af', bg: '#dbeafe' },
};

interface Props {
  full: FullAnalysis;
}

export default function XiYongBlock({ full }: Props) {
  const xi = full.xiYong;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>喜用五行(有序,第一为最喜)</Text>
      <View style={styles.chips}>
        {xi.favorable.map((el, i) => (
          <View key={el} style={[styles.chip, { backgroundColor: EL_LABEL[el].bg }]}>
            <Text style={[styles.chipText, { color: EL_LABEL[el].color }]}>
              {i + 1}. {EL_LABEL[el].label}
              {el === xi.primaryFavorable ? ' ·最喜' : ''}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.heading}>忌神</Text>
      <View style={styles.chips}>
        {xi.avoid.length > 0 ? (
          xi.avoid.map((el) => (
            <View key={el} style={[styles.chip, styles.avoidChip]}>
              <Text style={styles.avoidText}>{EL_LABEL[el].label}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>无明确忌神</Text>
        )}
      </View>

      <Text style={styles.meta}>
        机制用神：{xi.yongShenTenGod ?? '无'}
        {xi.patternGodTenGod ? `　格神：${xi.patternGodTenGod}` : ''}
      </Text>
      {xi.tongGuan ? <Text style={styles.meta}>通关：{EL_LABEL[xi.tongGuan].label}</Text> : null}

      {xi.conflicts.length > 0 && (
        <View style={styles.conflictWrap}>
          {xi.conflicts.map((c) => (
            <Text key={c.element + c.role} style={styles.conflictText}>{c.note}</Text>
          ))}
        </View>
      )}

      <Text style={styles.muted}>
        判定依据(规则轨迹,可对照《喜忌规格书》核验):{'\n'}
        {xi.ruleTrace.map((t) => `· ${t}`).join('\n')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  heading: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  avoidChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  avoidText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  conflictWrap: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  conflictText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  muted: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
