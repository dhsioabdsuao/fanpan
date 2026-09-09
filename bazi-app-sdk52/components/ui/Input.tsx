import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useMemo } from 'react';
import { FontSize, BorderRadius, Spacing } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

export default function Input({ style, ...rest }: TextInputProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={colors.textMuted}
      {...rest}
    />
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: 44,
  },
});
