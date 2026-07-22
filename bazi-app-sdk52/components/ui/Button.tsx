import { StyleSheet, Text, Pressable, ActivityIndicator, type ViewStyle } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'seal';
  style?: ViewStyle;
}

export default function Button({ title, onPress, disabled, loading, variant = 'default', style }: ButtonProps) {
  const isSeal = variant === 'seal';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isSeal && styles.seal,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={isSeal ? '#fff' : '#fff'}
          style={styles.spinner}
        />
      )}
      <Text style={[styles.text, isSeal && styles.sealText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1c1917',
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  seal: {
    backgroundColor: '#c43a31',
    borderRadius: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  disabled: {
    backgroundColor: Colors.surfaceBorder,
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
  sealText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
});
