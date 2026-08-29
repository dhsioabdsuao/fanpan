import { StyleSheet, View, Text } from 'react-native';
import type { FullAnalysis } from '@/lib/bage/analyze';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

const CATEGORY_LABEL: Record<string, string> = {
  '贵人': '贵人星',
  '凶星': '凶星',
  '泛星': '泛星',
};

interface Props {
  full: FullAnalysis;
}

export default function ShenShaBlock({ full }: Props) {
  const shenSha = full.shenSha;
  const groups = (['贵人', '凶星', '泛星'] as const)
    .map((cat) => ({ cat, stars: shenSha.filter((s) => s.category === cat) }))
    .filter((g) => g.stars.length > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.note}>神煞为传统民俗标注,不参与格局、强弱、喜忌判定【诊断流程 L9】</Text>
      {groups.map((g) => (
        <View key={g.cat}>
          <Text style={styles.heading}>{CATEGORY_LABEL[g.cat]}</Text>
          <View style={styles.chips}>
            {g.stars.map((s) => (
              <View key={s.name + s.pillar} style={styles.chip}>
                <Text style={styles.chipText}>{s.name}</Text>
                <Text style={styles.chipPillar}>{s.pillar}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      {shenSha.length === 0 && (
        <Text style={styles.note}>命局无神煞入格</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  note: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  heading: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chipPillar: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
