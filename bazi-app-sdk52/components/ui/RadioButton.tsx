import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioButtonProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function RadioButton({ options, value, onChange }: RadioButtonProps) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={styles.row}
            onPress={() => onChange(opt.value)}
          >
            <View style={[styles.circle, isActive && styles.circleActive]}>
              {isActive && <View style={styles.dot} />}
            </View>
            <Text style={styles.label}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: {
    borderColor: '#1c1917',
    backgroundColor: '#1c1917',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
});
