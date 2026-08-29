import { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import type { FullAnalysis } from '@/lib/bage/analyze';
import type { ElementType } from '@/types/bazi';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

import { ELEMENT_COLORS } from '@/lib/theme-tokens';

const ELEMENT_ORDER: ElementType[] = ['金', '木', '水', '火', '土'];

const ELEMENT_BG: Record<string, string> = {
  金: ELEMENT_COLORS['金'],
  木: ELEMENT_COLORS['木'],
  水: ELEMENT_COLORS['水'],
  火: ELEMENT_COLORS['火'],
  土: ELEMENT_COLORS['土'],
};

interface Props {
  full: FullAnalysis;
}

export default function ElementChart({ full }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const result = full.bazi;
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
    color: colors.textPrimary,
  },
  barBg: {
    flex: 1,
    height: 20,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
