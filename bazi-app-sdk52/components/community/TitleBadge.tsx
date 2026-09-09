import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useThemeColors } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';
import { FontSize, FONT_SERIF, BorderRadius, Spacing } from '../../theme';
import { tierColorToken } from '@/community/titles';
import type { TitleInfo } from '@/community/titles';

interface TitleBadgeProps {
  info: TitleInfo;
}

/** 称号徽章:档位色描边 + 称号名;无称号显示「进阶中」 */
export default function TitleBadge({ info }: TitleBadgeProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!info.name) {
    return (
      <View style={[styles.badge, { borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.text, { color: colors.textMuted }]}>进阶中</Text>
      </View>
    );
  }

  const token = tierColorToken(info.tier!);
  const tierColor = (colors as unknown as Record<string, string>)[token] ?? colors.gold;
  return (
    <View style={[styles.badge, { borderColor: tierColor }]}>
      <Text style={[styles.text, { color: tierColor }]}>{info.name}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontFamily: FONT_SERIF,
    fontSize: FontSize.xs,
  },
});
