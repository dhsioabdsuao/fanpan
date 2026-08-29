// 喜忌总览(曜金夜宴):金榜容器 + 五行徽章 + 冲突批注
import { StyleSheet, View, Text, useMemo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FullAnalysis } from '@/lib/bage/analyze';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';
import { useThemeColors, useIsDark } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/ThemeContext';

const EL_LABEL: Record<string, { label: string; color: string; bg: string; bgDark: string; colorDark: string }> = {
  '木': { label: '木', color: '#065f46', bg: '#d1fae5', bgDark: '#1c3a2a', colorDark: '#6bc48e' },
  '火': { label: '火', color: '#991b1b', bg: '#fee2e2', bgDark: '#3a1d16', colorDark: '#ff8a66' },
  '土': { label: '土', color: '#92400e', bg: '#fef3c7', bgDark: '#2a2414', colorDark: '#e0b64d' },
  '金': { label: '金', color: '#854d0e', bg: '#fef9c3', bgDark: '#2a2414', colorDark: '#e0b64d' },
  '水': { label: '水', color: '#1e40af', bg: '#dbeafe', bgDark: '#16283a', colorDark: '#7fb0ea' },
};

interface Props {
  full: FullAnalysis;
}

export default function XiYongBlock({ full }: Props) {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const xi = full.xiYong;

  const chipStyle = (el: string) => {
    const c = EL_LABEL[el];
    return {
      backgroundColor: isDark ? c.bgDark : c.bg,
    };
  };
  const chipTextStyle = (el: string) => {
    const c = EL_LABEL[el];
    return { color: isDark ? c.colorDark : c.color };
  };

  return (
    <View style={styles.container}>
      {/* 金榜:喜用 */}
      <LinearGradient
        colors={isDark
          ? ['rgba(212,169,78,0.14)', 'rgba(212,169,78,0.02)']
          : ['rgba(184,136,11,0.10)', 'rgba(184,136,11,0.01)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.goldBoard}
      >
        <Text style={styles.heading}>喜用五行(有序,第一为最喜)</Text>
        <View style={styles.chips}>
          {xi.favorable.map((el, i) => (
            <View key={el} style={[styles.chip, chipStyle(el)]}>
              <Text style={[styles.chipText, chipTextStyle(el)]}>
                {i + 1}. {EL_LABEL[el].label}
                {el === xi.primaryFavorable ? ' ·最喜' : ''}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>忌神</Text>
        <View style={styles.chips}>
          {xi.avoid.length > 0 ? (
            xi.avoid.map((el) => (
              <View key={el} style={[styles.chip, styles.avoidChip]}>
                <Text style={styles.avoidText}>{EL_LABEL[el].label}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>无明确忌神</Text>
          )}
        </View>
      </LinearGradient>

      <Text style={styles.meta}>
        机制用神：{xi.yongShenTenGod ?? '无'}
        {xi.patternGodTenGod ? `　格神：${xi.patternGodTenGod}` : ''}
      </Text>
      {xi.tongGuan ? <Text style={styles.meta}>通关：{EL_LABEL[xi.tongGuan].label}</Text> : null}

      {xi.conflicts.length > 0 && (
        <View style={styles.conflictWrap}>
          {xi.conflicts.map((c) => (
            <Text key={c.element + c.role} style={styles.conflictText}>{c.note}</Text>
          ))}
        </View>
      )}

      <Text style={styles.muted}>
        判定依据(规则轨迹,可对照《喜忌规格书》核验):{'\n'}
        {xi.ruleTrace.map((t) => `· ${t}`).join('\n')}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: Spacing.md },
    goldBoard: {
      borderRadius: BorderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.hairlineGold,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    heading: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: colors.textPrimary,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    chip: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
    },
    chipText: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
    },
    avoidChip: {
      backgroundColor: colors.inkLight,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    avoidText: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
    meta: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
    conflictWrap: {
      backgroundColor: colors.dayMasterBg,
      borderWidth: 1,
      borderColor: colors.dayMasterBorder,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
    },
    conflictText: {
      fontSize: FontSize.xs,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    muted: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
      lineHeight: 18,
    },
  });
