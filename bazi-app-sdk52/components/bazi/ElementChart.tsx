import { StyleSheet, View, Text } from 'react-native';
import type { BaziResult, ElementType } from '@/types/bazi';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

const ELEMENT_ORDER: ElementType[] = ['金', '木', '水', '火', '土'];

const ELEMENT_BG: Record<string, string> = {
  金: Colors.gold,
  木: Colors.wood,
  水: Colors.water,
  火: Colors.fire,
  土: Colors.earth,
};

interface Props {
  result: BaziResult;
}

export default function ElementChart({ result }: Props) {
  const { elementCount } = result;

  return (
    <View style={styles.container}>
      {ELEMENT_ORDER.map((el) => {
        const count = elementCount[el];
        const pct = (count / 8) * 100;

        return (
          <View key={el} style={styles.row}>
            <Text style={styles.label}>
              {el} {count}
            </Text>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(pct, 4)}%`, backgroundColor: ELEMENT_BG[el] },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  label: {
    width: 48,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  barBg: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
