import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((opt, index) => {
        const isActive = value === opt.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.option,
              isActive && styles.active,
              isFirst && styles.first,
              isLast && styles.last,
            ]}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  active: {
    backgroundColor: '#1c1917',
  },
  activeLabel: {
    color: '#ffffff',
  },
  first: {
    borderTopLeftRadius: BorderRadius.md - 2,
    borderBottomLeftRadius: BorderRadius.md - 2,
  },
  last: {
    borderTopRightRadius: BorderRadius.md - 2,
    borderBottomRightRadius: BorderRadius.md - 2,
    borderRightWidth: 0,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
});
