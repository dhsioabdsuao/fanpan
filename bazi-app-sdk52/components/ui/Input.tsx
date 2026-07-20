import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../../theme';

export default function Input({ style, ...rest }: TextInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={Colors.textMuted}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    minHeight: 44,
  },
});
