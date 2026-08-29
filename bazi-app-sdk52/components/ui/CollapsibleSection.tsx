import { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FontSize, FontWeight, Spacing } from '../../theme';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import GlassCard from './GlassCard';

interface Props {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, isOpen, onToggle, children }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rotate = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotate.value = withSpring(isOpen ? 1 : 0, { damping: 16, stiffness: 160 });
  }, [isOpen]);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle();
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 180}deg` }],
  }));

  return (
    <GlassCard intensity={30} contentStyle={styles.glassContent} style={styles.cardShell}>
      <Pressable style={styles.header} onPress={handleToggle}>
        <Text style={styles.title}>{title}</Text>
        <Animated.Text style={[styles.chevron, chevronStyle]}>
          ▾
        </Animated.Text>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeInDown.duration(240)} style={styles.content}>
          {children}
        </Animated.View>
      )}
    </GlassCard>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    cardShell: {
      borderRadius: 16,
    },
    glassContent: {
      padding: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    title: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
      color: colors.textPrimary,
    },
    chevron: {
      fontSize: FontSize.lg,
      color: colors.textMuted,
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
  });
