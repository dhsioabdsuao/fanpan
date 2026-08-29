import { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { BorderRadius, Spacing } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export default function Card({ children, style, ...rest }: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
