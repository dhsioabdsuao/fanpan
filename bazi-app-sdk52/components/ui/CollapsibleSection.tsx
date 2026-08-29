import { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Animated, LayoutAnimation } from 'react-native';
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
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <GlassCard intensity={30} contentStyle={styles.glassContent} style={styles.cardShell}>
      <Pressable style={styles.header} onPress={handleToggle}>
        <Text style={styles.title}>{title}</Text>
        <Animated.Text style={[styles.chevron, { transform: [{ rotate: chevronRotation }] }]}>
          ▾
        </Animated.Text>
      </Pressable>
      {isOpen && <View style={styles.content}>{children}</View>}
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
