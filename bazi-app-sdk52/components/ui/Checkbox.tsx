import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../../theme';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!checked)}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxChecked: {
    backgroundColor: '#1c1917',
    borderColor: '#1c1917',
  },
  check: {
    color: '#ffffff',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  label: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
});
