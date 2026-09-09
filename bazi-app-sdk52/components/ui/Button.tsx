import { StyleSheet, Text, Pressable, ActivityIndicator, type ViewStyle } from 'react-native';
import { useMemo } from 'react';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'seal' | 'gold';
  style?: ViewStyle;
}

export default function Button({ title, onPress, disabled, loading, variant = 'default', style }: ButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isSeal = variant === 'seal';
  const isGold = variant === 'gold';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isSeal && styles.seal,
        isGold && styles.gold,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
      )}
      <Text style={[styles.text, (isSeal || isGold) && styles.variantText, (disabled || loading) && styles.disabledText]}>
        {title}
      </Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    backgroundColor: colors.ink,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  seal: {
    backgroundColor: colors.sealRed,
    borderRadius: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  gold: {
    backgroundColor: colors.goldDark,
  },
  disabled: {
    backgroundColor: colors.surfaceBorder,
  },
  pressed: {
    opacity: 0.8,
  },
  spinner: {
    marginRight: Spacing.sm,
  },
  text: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  variantText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
